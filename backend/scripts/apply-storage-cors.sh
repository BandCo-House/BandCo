#!/bin/sh
# 스토리지 버킷에 CORS 규칙을 적용한다.
#
# presigned URL은 브라우저가 S3로 직접 PUT 하는 방식이라, 버킷에 CORS가 없으면
# preflight(OPTIONS)가 403으로 떨어져 업로드가 전부 실패한다. presigned URL 발급과
# 서명 자체는 정상이므로 서버 로그에는 아무것도 남지 않는다 — 버킷 설정이 유일한 원인이다.
#
# put-bucket-cors는 병합이 아니라 **전체 교체**다. 기존 규칙이 있으면 이 스크립트가
# 만드는 한 벌로 덮인다. 그래서 적용 전에 현재 설정을 출력해 두고, 그걸 본 사람이
# 직접 확인해야 진행한다. 되돌리려면 출력된 JSON을 --cors-configuration으로 다시 넣는다.
#
# 사용: AWS_STORAGE_BUCKET=... pnpm run storage:cors:apply
#   AWS_STORAGE_BUCKET  대상 버킷 (필수 — 운영 버킷에 실수로 나가지 않도록 기본값을 두지 않는다)
#   AWS_REGION          리전 (기본: ap-northeast-2)
#   ALLOWED_ORIGINS     쉼표로 구분한 허용 origin 목록
#   ASSUME_YES          1이면 확인 프롬프트를 건너뛴다 (비대화형 실행용)
set -eu

AWS_REGION=${AWS_REGION:-ap-northeast-2}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://bandco.vercel.app,http://localhost:5173}
ASSUME_YES=${ASSUME_YES:-0}

if [ -z "${AWS_STORAGE_BUCKET:-}" ]; then
  echo "AWS_STORAGE_BUCKET이 필요합니다. 예: AWS_STORAGE_BUCKET=bandco-prod-media $0" >&2
  exit 1
fi

BUCKET=$AWS_STORAGE_BUCKET

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI가 필요합니다." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq가 필요합니다." >&2
  exit 1
fi

# ExposeHeaders에 ETag를 두면 업로드 후 클라이언트가 결과를 확인할 수 있다.
cors_json=$(jq -n --arg origins "$ALLOWED_ORIGINS" '{
  CORSRules: [
    {
      AllowedOrigins: ($origins | split(",") | map(gsub("^\\s+|\\s+$"; ""))),
      AllowedMethods: ["GET", "PUT", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000
    }
  ]
}')

echo "대상 버킷: $BUCKET ($AWS_REGION)"
echo
echo "현재 설정:"
# CORS가 아직 없는 버킷은 NoSuchCORSConfiguration으로 떨어진다 — 정상이므로 넘어간다.
# 그 밖의 실패(권한 없음·세션 만료 등)까지 삼키면, 되돌릴 값을 못 본 채로 전체 교체를
# 진행하게 된다. 그때는 멈춘다.
if current_cors=$(aws s3api get-bucket-cors --bucket "$BUCKET" --region "$AWS_REGION" 2>&1); then
  echo "$current_cors"
else
  case "$current_cors" in
    *NoSuchCORSConfiguration*)
      echo "(설정 없음)"
      ;;
    *)
      echo "$current_cors" >&2
      echo "현재 CORS 설정을 읽지 못했습니다. 되돌릴 값을 확인할 수 없어 중단합니다." >&2
      exit 1
      ;;
  esac
fi
echo
echo "적용할 설정:"
echo "$cors_json"
echo

if [ "$ASSUME_YES" != "1" ]; then
  printf '위 설정으로 %s의 CORS를 전체 교체합니다. 계속할까요? [y/N] ' "$BUCKET"
  read -r answer
  case "$answer" in
    y | Y) ;;
    *)
      echo "취소했습니다."
      exit 1
      ;;
  esac
fi

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --region "$AWS_REGION" \
  --cors-configuration "$cors_json"

echo "$BUCKET 버킷에 CORS 규칙을 적용했습니다."

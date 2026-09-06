#!/bin/sh
# 스토리지 버킷의 CORS 규칙을 조회·적용한다.
#
# 파일 업로드는 브라우저가 presigned URL로 직접 PUT 하는 방식이라, 허용 origin에
# 없는 곳에서 열면 preflight(OPTIONS)가 403으로 막힌다. presigned URL 발급과 서명은
# 정상이라 서버 로그에는 아무것도 남지 않으므로, 업로드만 실패하면 여기부터 본다.
#
# 이 버킷은 Lightsail Object Storage다. 업로드 URL이 S3 호환 주소로 나가는 것은
# 정상이지만, 버킷 설정은 s3api가 아니라 lightsail API로 다뤄야 한다.
#   조회: aws lightsail get-buckets --include-cors
#   적용: aws lightsail update-bucket --cors
#
# update-bucket --cors는 병합이 아니라 **전체 교체**다. 그래서 적용 전에 현재 규칙을
# 출력하고, 그걸 본 사람이 확인해야 진행한다. 되돌리려면 출력된 rules를 그대로 다시 넣는다.
#
# 사용: AWS_STORAGE_BUCKET=... pnpm run storage:cors:apply
#   AWS_STORAGE_BUCKET  대상 버킷 이름 (필수 — 운영 버킷에 실수로 나가지 않도록 기본값을 두지 않는다)
#   AWS_REGION          리전 (기본: ap-northeast-2)
#   ALLOWED_ORIGINS     쉼표로 구분한 허용 origin 목록
#   ASSUME_YES          1이면 확인 프롬프트를 건너뛴다 (비대화형 실행용)
set -eu

AWS_REGION=${AWS_REGION:-ap-northeast-2}
# 운영 도메인과 로컬 개발 서버. Vercel Preview는 배포마다 주소가 달라 여기 못 넣는다
# (Preview에서도 업로드를 열지는 별도 정책으로 정한다).
# 로컬은 5173 하나로 고정한다 — 포트를 바꿔 띄우면 여기 없는 origin이 되어 막힌다.
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://band-co.vercel.app,http://localhost:5173}
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
  rules: [
    {
      id: "app-upload",
      allowedOrigins: ($origins | split(",") | map(gsub("^\\s+|\\s+$"; ""))),
      allowedMethods: ["GET", "PUT", "HEAD"],
      allowedHeaders: ["*"],
      exposeHeaders: ["ETag"],
      maxAgeSeconds: 3000
    }
  ]
}')

echo "대상 버킷: $BUCKET ($AWS_REGION)"
echo
echo "현재 CORS 규칙:"
# 조회가 실패하면(권한 없음·세션 만료·잘못된 리전) 되돌릴 값을 못 본 채 전체 교체를
# 진행하게 되므로 멈춘다.
if ! current_cors=$(aws lightsail get-buckets \
  --bucket-name "$BUCKET" \
  --include-cors \
  --region "$AWS_REGION" \
  --query 'buckets[0].cors' \
  --output json 2>&1); then
  echo "$current_cors" >&2
  echo "현재 CORS 규칙을 읽지 못했습니다. 되돌릴 값을 확인할 수 없어 중단합니다." >&2
  exit 1
fi

echo "$current_cors"
echo
echo "적용할 규칙:"
echo "$cors_json"
echo

if [ "$ASSUME_YES" != "1" ]; then
  printf '위 규칙으로 %s의 CORS를 전체 교체합니다. 계속할까요? [y/N] ' "$BUCKET"
  read -r answer
  case "$answer" in
    y | Y) ;;
    *)
      echo "취소했습니다."
      exit 1
      ;;
  esac
fi

aws lightsail update-bucket \
  --bucket-name "$BUCKET" \
  --region "$AWS_REGION" \
  --cors "$cors_json"

echo "$BUCKET 버킷에 CORS 규칙을 적용했습니다."

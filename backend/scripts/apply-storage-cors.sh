#!/bin/sh
# 스토리지 버킷에 CORS 규칙을 적용한다.
#
# presigned URL은 브라우저가 S3로 직접 PUT 하는 방식이라, 버킷에 CORS가 없으면
# preflight(OPTIONS)가 403으로 떨어져 업로드가 전부 실패한다. presigned URL 발급과
# 서명 자체는 정상이므로 서버 로그에는 아무것도 남지 않는다 — 버킷 설정이 유일한 원인이다.
#
# 사용: sh ./scripts/apply-storage-cors.sh
#   AWS_STORAGE_BUCKET  대상 버킷 (기본: bandco-prod-media)
#   AWS_REGION          리전 (기본: ap-northeast-2)
#   ALLOWED_ORIGINS     쉼표로 구분한 허용 origin 목록
set -eu

BUCKET=${AWS_STORAGE_BUCKET:-bandco-prod-media}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://bandco.vercel.app,http://localhost:5173}

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

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --region "$AWS_REGION" \
  --cors-configuration "$cors_json"

echo "$BUCKET 버킷에 CORS 규칙을 적용했습니다. 현재 설정:"
aws s3api get-bucket-cors --bucket "$BUCKET" --region "$AWS_REGION"

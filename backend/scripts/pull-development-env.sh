#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SECRET_ID=${BANDCO_DEV_SECRET_ID:-bandco/dev/backend}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
ENV_FILE="$BACKEND_DIR/.env.development"
TEMP_ENV_FILE=$(mktemp "$BACKEND_DIR/.env.development.tmp.XXXXXX")

cleanup() {
  rm -f "$TEMP_ENV_FILE"
}

trap cleanup EXIT INT TERM

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI가 필요합니다." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq가 필요합니다." >&2
  exit 1
fi

secret_json=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

jq -r 'to_entries[] | "\(.key)=\(.value | tostring | @json)"' <<EOF >"$TEMP_ENV_FILE"
$secret_json
EOF

chmod 600 "$TEMP_ENV_FILE"
mv "$TEMP_ENV_FILE" "$ENV_FILE"
trap - EXIT INT TERM

echo "$SECRET_ID 값을 $ENV_FILE 파일에 반영했습니다."

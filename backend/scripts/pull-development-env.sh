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

# 필수 키 검사는 두지 않지만, secret ID를 잘못 지정해 운영 값이 개발 파일에 써지는 것은 막는다.
if ! jq -e 'type == "object" and .NODE_ENV == "development" and all(keys[]; test("^[A-Z][A-Z0-9_]*$"))' <<EOF >/dev/null
$secret_json
EOF
then
  echo "$SECRET_ID 는 개발 환경 secret이 아닙니다. NODE_ENV=development인 객체여야 합니다." >&2
  exit 1
fi

jq -r 'to_entries[] | "\(.key)=\(.value | tostring | @json)"' <<EOF >"$TEMP_ENV_FILE"
$secret_json
EOF

chmod 600 "$TEMP_ENV_FILE"
mv "$TEMP_ENV_FILE" "$ENV_FILE"
trap - EXIT INT TERM

echo "$SECRET_ID 값을 $ENV_FILE 파일에 반영했습니다."

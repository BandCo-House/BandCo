import base64
import gzip
import json
import os
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


KST = timezone(timedelta(hours=9))
LOG_EVENTS_URL = (
    "https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home"
    "?region=ap-northeast-2#logsV2:log-groups/log-group"
)


def format_log_stream_url(log_group, log_stream, started_at):
    group_path = log_group.replace("/", "$252F")
    stream_path = log_stream.replace("/", "$252F")
    start = started_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return f"{LOG_EVENTS_URL}/{group_path}/log-events/{stream_path}?start={start}"


def get_webhook_url():
    import boto3

    secret_arn = os.environ["WEBHOOK_SECRET_ARN"]
    response = boto3.client("secretsmanager").get_secret_value(SecretId=secret_arn)
    return response["SecretString"]


def send_discord(content, webhook_url):
    payload = json.dumps({"content": content, "allowed_mentions": {"parse": []}}).encode("utf-8")
    request = Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "BandCo-ErrorAlert/1.0"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            if response.status != 204:
                raise RuntimeError(f"Discord webhook HTTP {response.status}")
    except HTTPError as error:
        raise RuntimeError(f"Discord webhook HTTP {error.code}") from None
    except URLError:
        raise RuntimeError("Discord webhook connection failed") from None


def format_log_alerts(event):
    encoded = base64.b64decode(event["awslogs"]["data"])
    batch = json.loads(gzip.decompress(encoded))
    if batch.get("messageType") == "CONTROL_MESSAGE":
        return []

    alerts = []
    for log_event in batch.get("logEvents", []):
        try:
            record = json.loads(log_event["message"])
        except (KeyError, json.JSONDecodeError):
            continue
        if record.get("context") != "ApiExceptionFilter":
            continue
        status_code = record.get("statusCode")
        if not isinstance(status_code, int) or status_code < 500:
            continue

        occurred_at = datetime.fromtimestamp(log_event["timestamp"] / 1000, timezone.utc)
        method = record.get("method", "?")
        path = record.get("path", "?")
        log_url = format_log_stream_url(batch["logGroup"], batch["logStream"], occurred_at)
        log_url = f"{log_url}&refEventId={log_event['id']}"
        alerts.append(
            "🚨 BandCo 운영 5xx 오류\n"
            f"{occurred_at.astimezone(KST):%Y-%m-%d %H:%M:%S} KST | {method} {path} | HTTP {status_code}\n"
            f"[해당 오류 로그 보기]({log_url})"
        )
    return alerts


def format_alarm_alert(event):
    alarm = event.get("alarmData", {})
    if alarm.get("state", {}).get("value") != "ALARM":
        return None
    alarm_time = datetime.fromisoformat(event["time"]).astimezone(timezone.utc)
    started_at = alarm_time - timedelta(minutes=15)
    log_url = format_log_stream_url("/bandco/backend", "bandco-nest", started_at)
    return (
        "⚠️ BandCo 운영 4xx 오류 급증\n"
        f"{alarm_time.astimezone(KST):%Y-%m-%d %H:%M:%S} KST | 5분 동안 4xx 오류 10건 이상\n"
        f"[발생 시간대 백엔드 로그 보기]({log_url})"
    )


def handler(event, _context):
    if "awslogs" in event:
        alerts = format_log_alerts(event)
    elif event.get("source") == "aws.cloudwatch":
        alert = format_alarm_alert(event)
        alerts = [alert] if alert else []
    else:
        alerts = []

    if alerts:
        webhook_url = get_webhook_url()
        for alert in alerts:
            send_discord(alert, webhook_url)
    return {"sent": len(alerts)}

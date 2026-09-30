import base64
import gzip
import json
import unittest

from handler import format_alarm_alert, format_log_alerts


class DiscordAlertTests(unittest.TestCase):
    def test_5xx_alert_excludes_message_stack_and_user_id(self):
        record = {
            "context": "ApiExceptionFilter",
            "statusCode": 500,
            "method": "POST",
            "path": "/bandspaces/:bandspaceId/schedules",
            "message": "secret-token",
            "stack": "secret-stack",
            "userId": "secret-user",
        }
        batch = {
            "messageType": "DATA_MESSAGE",
            "logGroup": "/bandco/backend",
            "logStream": "bandco-nest",
            "logEvents": [{"id": "event-123", "timestamp": 0, "message": json.dumps(record)}],
        }
        event = {"awslogs": {"data": base64.b64encode(gzip.compress(json.dumps(batch).encode())).decode()}}

        alerts = format_log_alerts(event)

        self.assertEqual(len(alerts), 1)
        self.assertIn("1970-01-01 09:00:00 KST", alerts[0])
        self.assertIn("POST /bandspaces/:bandspaceId/schedules | HTTP 500", alerts[0])
        self.assertIn("/log-group/$252Fbandco$252Fbackend/log-events/bandco-nest", alerts[0])
        self.assertIn("start=1970-01-01T00:00:00.000Z&refEventId=event-123", alerts[0])
        self.assertNotIn("secret-", alerts[0])

    def test_alarm_only_sends_on_alarm_transition(self):
        event = {"time": "2026-09-29T16:10:00.000+0000", "alarmData": {"state": {"value": "OK"}}}

        self.assertIsNone(format_alarm_alert(event))
        event["alarmData"]["state"]["value"] = "ALARM"
        alert = format_alarm_alert(event)
        self.assertIn("4xx 오류 급증", alert)
        self.assertIn("2026-09-30 01:10:00 KST | 5분 동안 4xx 오류 10건 이상", alert)
        self.assertIn("start=2026-09-29T15:55:00.000Z", alert)
        self.assertIn("/log-events/bandco-nest", alert)

    def test_4xx_and_request_logs_do_not_create_5xx_alerts(self):
        records = [
            {"context": "ApiExceptionFilter", "statusCode": 400},
            {"context": "RequestLogging", "statusCode": 500},
        ]
        batch = {
            "messageType": "DATA_MESSAGE",
            "logEvents": [{"timestamp": 0, "message": json.dumps(record)} for record in records],
        }
        event = {"awslogs": {"data": base64.b64encode(gzip.compress(json.dumps(batch).encode())).decode()}}

        self.assertEqual(format_log_alerts(event), [])


if __name__ == "__main__":
    unittest.main()

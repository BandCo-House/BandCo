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
            "logEvents": [{"timestamp": 0, "message": json.dumps(record)}],
        }
        event = {"awslogs": {"data": base64.b64encode(gzip.compress(json.dumps(batch).encode())).decode()}}

        alerts = format_log_alerts(event)

        self.assertEqual(len(alerts), 1)
        self.assertIn("POST /bandspaces/:bandspaceId/schedules | HTTP 500", alerts[0])
        self.assertNotIn("secret-", alerts[0])

    def test_alarm_only_sends_on_alarm_transition(self):
        event = {"alarmData": {"state": {"value": "OK"}}}

        self.assertIsNone(format_alarm_alert(event))
        event["alarmData"]["state"]["value"] = "ALARM"
        self.assertIn("4xx 오류 급증", format_alarm_alert(event))

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

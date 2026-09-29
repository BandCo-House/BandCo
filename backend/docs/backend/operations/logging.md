# 운영 백엔드 로그

운영 백엔드 로그는 서울 리전의 CloudWatch 로그 그룹 `/bandco/backend`에서 확인한다.

## 실시간 조회

팀원은 AWS 콘솔에서 서울 리전을 선택한 뒤 CloudWatch → 대시보드 → `BandCo-Backend-Logs`를 연다. 이 대시보드에는 최근 6시간의 HTTP 오류 목록과 5분 단위 오류 요청 수가 표시된다. 운영 백엔드가 새 로그 설정으로 배포되기 전에는 두 위젯에 운영 데이터가 없다.

AWS 콘솔에서 CloudWatch → 로그 → 로그 그룹 → `/bandco/backend` → Live Tail을 연다. Live Tail은 필요한 동안만 사용한다.

AWS CLI에서는:

```bash
aws logs tail /bandco/backend --follow --region ap-northeast-2
```

Lightsail에 SSH로 접속할 수 있는 경우:

```bash
docker logs -f --tail 200 bandco-nest
```

## 지난 오류 찾기

CloudWatch Logs Insights에서 `/bandco/backend`를 선택하고 시간 범위를 좁힌 뒤 실행한다.

```sql
fields @timestamp, method, path, statusCode, message, userId
| filter statusCode >= 400
| sort @timestamp desc
| limit 50
```

```sql
fields @timestamp, method, path, statusCode, message
| filter path = "/bandspaces/:bandspaceId/schedules" and statusCode = 400
| sort @timestamp desc
| limit 50
```

요청 로그에는 메서드, 라우트 템플릿, 상태, 소요 시간, 인증된 사용자 ID만 담는다. 오류 로그에는 상태와 사용자 노출 메시지도 담는다. 본문, 쿼리, 인증 헤더는 남기지 않는다.

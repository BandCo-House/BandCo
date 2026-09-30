# 운영 백엔드 로그

운영 백엔드 로그는 서울 리전의 CloudWatch 로그 그룹 `/bandco/backend`에서 확인한다.

## 대시보드에서 오류 현황 보기

AWS 콘솔에서 서울 리전을 선택한 뒤 CloudWatch → 대시보드 → `BandCo-Backend-Logs`를 연다. 최근 6시간의 HTTP 4xx·5xx 오류 목록과 5분 단위 오류 요청 수를 볼 수 있다. 두 위젯은 오류만 표시하므로, 결과가 없을 때는 로그 그룹에서 정상 요청 로그가 수집되는지도 확인한다.

## 로그 그룹에서 원문과 실시간 로그 보기

CloudWatch → 로그 → 로그 그룹 → `/bandco/backend`에서 `bandco-nest` 스트림을 열면 각 로그의 원문을 볼 수 있다. 같은 로그 그룹에서 Live Tail을 열면 새 로그가 들어오는 대로 표시된다. Live Tail은 필요한 동안만 사용한다.

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

## Discord 오류 알림

- 5xx: `/bandco/backend`의 `BandCoBackend5xxDiscord` 구독 필터가 예외 로그를 Lambda `bandco-prod-discord-error-alert`에 전달한다. 오류마다 알림을 보낸다.
- 4xx: `BandCoBackend4xxExceptions` 메트릭 필터와 `BandCo-Backend-4xx-Spike` 알람을 사용한다. 5분 동안 10건 이상 발생해 알람 상태로 바뀌면 한 번 알린다. 정상 상태로 돌아갔다가 다시 기준을 넘으면 다시 알린다.
- Discord 메시지에는 한국시간(KST) 기준 발생 시각, HTTP 상태, 메서드, 라우트 경로를 보낸다. 5xx 링크는 해당 로그 이벤트를, 4xx 급증 링크는 발생 시간대의 백엔드 로그 스트림을 연다. 오류 메시지, 스택, 사용자 ID, 본문, 쿼리, 인증 정보는 보내지 않는다.
- 웹훅 URL은 Secrets Manager의 `bandco/prod/discord-error-webhook`에 저장한다. 알림 채널을 옮길 때 새 채널의 웹훅을 만들고 이 비밀값을 교체하면 다음 알림부터 적용된다. Lambda 코드는 `infra/discord-alert/handler.py`에 있다.
- 알림 Lambda 자체의 실행·실패 기록은 `/aws/lambda/bandco-prod-discord-error-alert` 로그 그룹에서 확인한다. 이 로그는 14일간 보관한다.

Lambda 코드 변경은 백엔드 배포와 별개다. 저장소 루트에서 아래 명령으로 배포한다.

```bash
zip -j /tmp/bandco-discord-alert.zip infra/discord-alert/handler.py
aws lambda update-function-code --function-name bandco-prod-discord-error-alert --zip-file fileb:///tmp/bandco-discord-alert.zip --region ap-northeast-2
```

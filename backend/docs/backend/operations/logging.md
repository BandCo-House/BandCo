# 운영 백엔드 로그

## 전송 구성

- 운영 백엔드는 한 줄 JSON을 표준 출력으로 기록한다.
- Lightsail 호스트의 Docker 데몬이 `awslogs` 드라이버로 서울 리전의 `/bandco/backend` 로그 그룹에 전송한다.
- 로그 그룹은 배포 전에 Standard 클래스로 만들고 보존 기간을 30일로 설정한다. 30일 보존은 저장 기간만 제한하며 수집 비용을 제한하지 않는다.
- Docker 데몬이 시작 시 읽을 수 있는 호스트 자격 증명에 해당 로그 그룹의 `logs:CreateLogStream`, `logs:PutLogEvents`만 허용한다. GitHub Actions의 OIDC 역할은 호스트에 전달되지 않는다.
- 자격 증명은 저장소, GitHub Actions 변수, 백엔드 `.env`에 넣지 않는다. Docker 데몬의 루트 사용자 AWS 공유 자격 증명 파일은 호스트에서만 관리한다. 임시 자격 증명을 쓰면 만료 전에 갱신하고 컨테이너를 다시 시작해야 한다.
- Docker의 원격 로그 드라이버용 로컬 읽기 캐시는 기본적으로 회전한다. 전송이 실패하면 Docker 데몬 로그도 확인한다.

### 호스트 권한 설정

1. AWS IAM에서 콘솔 로그인 권한이 없는 전용 사용자 `bandco-cloudwatch-writer`를 만들고 아래 정책을 부여한다. `ACCOUNT_ID`는 실제 AWS 계정 ID로 바꾼다.

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
         "Resource": "arn:aws:logs:ap-northeast-2:ACCOUNT_ID:log-group:/bandco/backend:*"
       }
     ]
   }
   ```

2. 해당 사용자의 액세스 키를 발급해 Lightsail 호스트의 `/root/.aws/credentials`에만 넣는다. 파일 소유자는 root, 디렉터리 권한은 `700`, 파일 권한은 `600`으로 둔다. 키를 채팅, 저장소, GitHub Actions 비밀 변수, 백엔드 `.env`에 복사하지 않는다.
3. 배포 전 `docker run`의 `awslogs` 사전 검사로 로그 드라이버 초기화를 확인한다. 이 검사가 실패하면 기존 백엔드 컨테이너를 중지하지 않는다. 실제 `PutLogEvents` 성공 여부는 CloudWatch에서 검사 로그가 도착했는지 확인한다.
4. 키를 교체하면 자격 증명 파일을 갱신하고 백엔드 컨테이너를 다시 시작한다. Docker 데몬은 컨테이너 시작 시 자격 증명을 읽는다.

## 실시간 조회

팀원은 AWS 콘솔에서 서울 리전을 선택한 뒤 CloudWatch → 대시보드 → `BandCo-Backend-Logs`를 연다. 이 대시보드에는 최근 6시간의 HTTP 오류 목록과 5분 단위 오류 요청 수가 표시된다. 운영 백엔드가 새 로그 설정으로 배포되기 전에는 두 위젯에 운영 데이터가 없다.

팀원 IAM 사용자 `bandco-junhwan`에는 `BandCoBackendCloudWatchManage` 정책이 연결되어 있다. 이 정책으로 `/bandco/backend` 로그 조회, Live Tail, Logs Insights 검색, 보존 기간과 메트릭 필터 설정, `BandCo-Backend-Logs` 대시보드 편집을 할 수 있다. 다른 로그 그룹의 내용 조회와 로그 그룹 삭제 권한은 없다. 팀원이 추가되면 같은 정책을 해당 IAM 사용자에게 연결한다.

AWS 콘솔에서 CloudWatch → 로그 → 로그 그룹 → `/bandco/backend` → Live Tail을 연다. Live Tail은 필요한 동안만 사용한다. 팀원은 AWS 콘솔 로그인과 로그 조회 권한이 필요하다.

AWS CLI 자격 증명이 있는 경우:

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

## 후속 작업

Discord 오류 알림은 관리자 계정으로 연결할 수 있을 때 별도 작업으로 진행한다. 먼저 CloudWatch 로그 수집과 검색이 정상 동작하는지 확인한다.

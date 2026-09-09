# Backend API Docs

백엔드 API 명세서를 보관한다.

API 엔드포인트, 요청 DTO, 응답 DTO, 응답 예시를 작성하거나 수정할 때 이 디렉터리의 문서를 함께 확인한다.

## 공통 응답 형식

모든 엔드포인트는 같은 envelope을 쓴다. 성공은 `createSuccessResponse`, 실패는 글로벌 `ApiExceptionFilter`가 만든다.

```json
{ "status": "success", "error": null, "message": "조회 성공", "data": { "...": "..." } }
```

```json
{ "status": "fail", "error": { "code": "NOT_FOUND", "details": { "statusCode": 404 } }, "message": "존재하지 않는 유저입니다.", "data": {} }
```

- `message`는 사용자에게 그대로 보여줄 수 있는 문구다. class-validator 오류가 여러 건이면 줄바꿈으로 합쳐진다.
- `error.code`는 HTTP 상태 이름(`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`)이다.
- 인증 토큰이 만료되면 401 `만료된 토큰입니다.`, 서명·형식이 잘못되면 401 `유효하지 않은 토큰입니다.`로 응답한다. 클라이언트는 401에서만 토큰 재발급을 시도한다.
- 각 문서의 응답 예시 중 `"success": true`로 적힌 것은 옛 형식이다(정정 백로그: `docs/IMPROVEMENTS.md`). 실제 응답은 위 형식이다.

## 문서 목록

- [유저 API 명세](./users.md)
- [밴드 API 명세](./band.md)
- [밴드 초대 API 명세](./band-invitation.md)
- [밴드 초대 링크 API 명세](./band-invite-link.md)
- [밴드 가입 요청 API 명세](./band-join-request.md)
- [곡 API 명세](./song.md)
- [합주 공간 관리 API 명세](./bandspaces.md)
- [일정 관리 API 명세](./schedules.md)
- [장소 API 명세](./place.md)
- [알림 API 명세](./notification.md)
- [팀 API 명세](./teams.md)
- [자연어 밴드 조회 API 명세](./assistant.md)
- [공통(Common) API 명세](./common.md)

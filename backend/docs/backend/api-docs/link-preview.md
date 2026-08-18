# 링크 미리보기 API

외부 페이지의 제목과 파비콘을 서버에서 읽어 반환한다. 브라우저 CORS 제약을 피하기 위한 공개 엔드포인트다.

## GET `/link-previews`

### Query Parameters

| 이름 | 필수 | 설명 |
|------|:----:|------|
| `url` | Y | `http` 또는 `https` 절대 URL |

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "링크 미리보기 조회 성공",
  "data": {
    "url": "https://bandco.atlassian.net/jira/project",
    "title": "BandCo JIRA",
    "siteName": "Jira",
    "faviconUrl": "https://bandco.atlassian.net/favicon.ico"
  }
}
```

외부 페이지 조회 또는 파싱에 실패하면 HTTP 200을 유지하고 `title`, `siteName`, `faviconUrl`을 `null`로 반환한다. 사설 IP, localhost, 예약 IP 및 해당 주소로 이어지는 리다이렉트는 조회하지 않는다.

### Error

| 코드 | 사유 |
|------|------|
| 400 | `url`이 `http` 또는 `https` 절대 URL이 아님 |

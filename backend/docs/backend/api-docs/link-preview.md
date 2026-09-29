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
    "faviconUrl": "https://bandco.atlassian.net/favicon.ico",
    "imageUrl": null,
    "authorName": null
  }
}
```

외부 페이지 조회 또는 파싱에 실패하면 HTTP 200을 유지하고 `title`, `siteName`, `faviconUrl`, `imageUrl`, `authorName`을 `null`로 반환한다. 사설 IP, localhost, 예약 IP 및 해당 주소로 이어지는 리다이렉트는 조회하지 않는다.

#### 유튜브 링크

유튜브 페이지는 HTML head에서 제목을 읽을 수 없어, 호스트가 `youtube.com`·`www.youtube.com`·`m.youtube.com`·`music.youtube.com`·`youtu.be`인 링크는 유튜브 oEmbed로 읽는다. 이때만 `imageUrl`(영상 썸네일)과 `authorName`(채널 이름)이 채워진다. 일반 페이지는 두 값이 항상 `null`이다.

```json
{
  "url": "https://youtu.be/LjhCEhWiKXk",
  "title": "Bruno Mars - Just The Way You Are (Official Music Video)",
  "siteName": "YouTube",
  "faviconUrl": "https://www.youtube.com/favicon.ico",
  "imageUrl": "https://i.ytimg.com/vi/LjhCEhWiKXk/hqdefault.jpg",
  "authorName": "Bruno Mars"
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `url`이 `http` 또는 `https` 절대 URL이 아님 |

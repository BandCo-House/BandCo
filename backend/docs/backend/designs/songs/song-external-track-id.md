# Song 외부 트랙 ID 저장 및 미리듣기 조회

> 대상 모듈: `src/modules/songs`
>
> 관련 API 명세: [곡 API 명세](../../api-docs/song.md)
>
> 결정일: 2026-07-28

## 결정 배경

외부 음원 검색 API의 `SongPreview`에는 `externalTrackId`와 `previewUrl`이 있었지만, 곡 생성 DTO와 Prisma `Song` 모델에는 두 필드가 없었다. 기존 곡 CRUD 설계에서 검색 결과를 등록 전 미리보기 데이터로만 취급했고, 외부 음원 메타데이터 저장 여부를 미결정으로 남겼기 때문이다.

현재 사용하는 Deezer의 `previewUrl`은 만료 시각이 포함된 서명 URL이다. 이 값을 Song 레코드에 저장하면 짧은 시간 뒤 재생할 수 없는 링크가 되므로 영속화하지 않는다.

대신 안정적인 Deezer `externalTrackId`를 Song에 저장한다. 클라이언트는 사용자가 재생을 요청한 시점에 `GET /songs/tracks/:trackId`를 호출해 최신 `previewUrl`을 조회한다.

## 구현 범위

- `Song.externalTrackId` nullable 컬럼 추가
- 신규 곡 생성 요청에서 `externalTrackId` 필수 검증
- 곡 생성 시 `externalTrackId` 저장
- 곡 생성 응답과 밴드 곡 목록 응답에 `externalTrackId` 포함
- `previewUrl`은 Song에 저장하지 않고 목록 응답에도 포함하지 않음

## DB 모델

```prisma
externalTrackId String? @map("external_track_id") @db.VarChar(255)
```

DB 컬럼은 기존 Song 레코드와의 호환을 위해 nullable이다. 백필 근거가 없는 기존 레코드는 `null`을 유지하지만 신규 생성 요청에서는 필수로 받는다.

## 조회 흐름

1. `GET /bands/:bandId/songs`에서 Song의 `externalTrackId`를 조회한다.
2. 사용자가 재생을 요청한다.
3. 클라이언트가 `GET /songs/tracks/:trackId`를 호출한다.
4. 서버가 Deezer에서 최신 트랙 정보를 조회해 유효한 `previewUrl`을 반환한다.

목록 조회 중 곡마다 Deezer API를 호출하지 않는다. 목록 크기에 비례한 외부 요청, 응답 지연, Deezer 장애 전파를 피하기 위한 결정이다.

## 테스트

- Service가 생성 입력의 `externalTrackId`를 Repository에 전달하는지 확인
- Repository가 `externalTrackId`를 Song 생성 데이터에 포함하는지 확인
- 곡 생성 응답에 저장된 `externalTrackId`가 포함되는지 확인
- 밴드 곡 목록에서 저장된 값과 기존 레코드의 `null`이 모두 올바르게 매핑되는지 확인

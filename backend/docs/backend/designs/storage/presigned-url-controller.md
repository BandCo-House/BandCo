# Storage Controller 설계

## 작업 범위

| 항목 | 내용 |
|------|------|
| 모듈 경로 | `src/storage/` |
| 작업 유형 | 컨트롤러 추가 (서비스 메서드 1개 추가 포함) |
| API 명세 위치 | 없음 (storage 모듈은 별도 Notion API 명세 없음) |

---

## 파일 목록

### 신규
- `src/storage/dto/get-presigned-url.dto.ts` — 요청 DTO
- `src/storage/storage.controller.ts` — 컨트롤러

### 수정
- `src/storage/storage.service.ts` — `generateUploadUrl` 메서드 추가
- `src/storage/storage.module.ts` — 컨트롤러 등록, AuthModule·UsersModule 추가

---

## API

### `POST /storage/presigned-url`

| 항목 | 내용 |
|------|------|
| 인증 | AccessTokenGuard (Bearer 토큰) |
| 요청 Body | `{ folder: string, contentType: string }` |
| 응답 | `{ presignedUrl: string, objectUrl: string }` |

**설계 근거:**
- 클라이언트가 오브젝트 `key` 전체를 지정하면 경로 조작(path traversal) 위험이 있으므로 `folder`만 받고 파일명(UUID)은 서버에서 생성한다.
- key는 `users/{userId}/{folder}/{uuid}.{ext}` 형태로 구성해 유저별 파일을 격리한다. 회원탈퇴 시 파일 일괄 정리가 용이하다.
- `contentType`으로 확장자를 추출한다.

---

## Service 메서드

```typescript
// StorageService에 추가
/**
 * folder와 contentType을 받아 UUID 기반 key를 생성하고 Presigned URL을 반환한다.
 * 클라이언트가 key를 직접 지정하지 못하도록 서버에서 생성한다.
 */
async generateUploadUrl(userId: string, folder: string, contentType: string): Promise<{ presignedUrl: string; objectUrl: string }> {
  const ext = contentType.split('/')[1] ?? 'bin';
  const key = `users/${userId}/${folder}/${randomUUID()}.${ext}`;
  return this.getPresignedUploadUrl(key, contentType);
}
```

---

## DTO

```typescript
// get-presigned-url.dto.ts
export class GetPresignedUrlDto {
  @ApiProperty({ description: '업로드 폴더 경로', example: 'profiles' })
  @IsString()
  @IsNotEmpty()
  folder: string;

  @ApiProperty({ description: '파일 MIME 타입', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
```

---

## Controller

```typescript
@ApiTags('스토리지')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Presigned URL 발급' })
  @ApiResponse({ status: 201, description: 'Presigned URL 발급 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getPresignedUrl(
    @Req() request: AuthenticatedRequest,
    @Body() dto: GetPresignedUrlDto,
  ): Promise<ApiSuccessResponse<{ presignedUrl: string; objectUrl: string }>> {
    const result = await this.storageService.generateUploadUrl(request.user.id, dto.folder, dto.contentType);
    return createSuccessResponse('Presigned URL 발급 성공', result);
  }
}
```

---

## Module 변경

```typescript
@Global()
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StorageController],
  providers: [StorageService, AccessTokenGuard],
  exports: [StorageService],
})
export class StorageModule {}
```

---

## 테스트 계획

StorageService는 외부 AWS SDK에 의존하므로 컨트롤러는 테스트하지 않는다 (하네스 규칙: Controller 테스트 제외).
`generateUploadUrl`은 기존 `getPresignedUploadUrl`을 호출하는 래퍼이므로 별도 테스트 없이 기존 spec 유지.

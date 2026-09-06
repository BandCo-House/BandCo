import { randomUUID } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = configService.getOrThrow<string>('AWS_REGION');
    this.bucket = configService.getOrThrow<string>('AWS_STORAGE_BUCKET');

    this.s3 = new S3Client({
      region: this.region,
    });
  }

  /**
   * 지정된 키로 Lightsail 오브젝트 스토리지에 업로드할 Presigned URL을 생성한다.
   *
   * 브라우저가 이 URL로 직접 PUT 하므로 요청 origin이 버킷 CORS 허용 목록에 있어야 한다.
   * 없는 origin이면 preflight가 403으로 막혀 업로드만 실패하고 서버 로그에는 아무것도
   * 남지 않는다. 규칙 조회·적용: `pnpm run storage:cors:apply`
   *
   * @param key 업로드할 오브젝트 키 (예: profiles/uuid.jpg)
   * @param contentType 파일 MIME 타입 (예: image/jpeg)
   * @param expiresIn URL 만료 시간(초), 기본값 300
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<{ presignedUrl: string; objectUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn });
    const objectUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { presignedUrl, objectUrl };
  }

  /**
   * 유저별 폴더를 격리해 Presigned URL을 생성한다.
   * key는 `users/{userId}/{folder}/{uuid}.{ext}` 형태로 구성된다.
   *
   * @param userId 인증된 유저 ID
   * @param folder 업로드 대상 폴더 (예: profiles)
   * @param contentType 파일 MIME 타입 (예: image/jpeg)
   */
  async generateUploadUrl(userId: string, folder: string, contentType: string): Promise<{ presignedUrl: string; objectUrl: string }> {
    const ext = contentType.split('/').pop() ?? 'bin';
    const key = `users/${userId}/${folder}/${randomUUID()}.${ext}`;
    return this.getPresignedUploadUrl(key, contentType);
  }

  /**
   * 지정된 key의 오브젝트를 다운로드할 Presigned URL을 생성한다.
   *
   * @param key 오브젝트 키 (예: users/{userId}/profiles/{uuid}.jpeg)
   * @param expiresIn URL 만료 시간(초), 기본값 300
   */
  async generateDownloadUrl(key: string, expiresIn = 300): Promise<{ presignedUrl: string }> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn });
    return { presignedUrl };
  }
}

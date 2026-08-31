import { randomUUID } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null;
  private readonly bucket: string | null;
  private readonly region: string | null;

  constructor(configService: ConfigService) {
    this.region = readOptionalConfig(configService, 'AWS_REGION');
    this.bucket = readOptionalConfig(configService, 'AWS_STORAGE_BUCKET');

    if (configService.get<string>('NODE_ENV') === 'production' && (this.region === null || this.bucket === null)) {
      throw new Error('운영 환경에는 AWS_REGION과 AWS_STORAGE_BUCKET이 필요합니다.');
    }

    this.s3 = this.region === null ? null : new S3Client({ region: this.region });
  }

  /**
   * 지정된 키로 Lightsail 오브젝트 스토리지에 업로드할 Presigned URL을 생성한다.
   * @param key 업로드할 오브젝트 키 (예: profiles/uuid.jpg)
   * @param contentType 파일 MIME 타입 (예: image/jpeg)
   * @param expiresIn URL 만료 시간(초), 기본값 300
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<{ presignedUrl: string; objectUrl: string }> {
    const storage = this.getStorageConfig();
    const command = new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(storage.s3, command, { expiresIn });
    const objectUrl = `https://${storage.bucket}.s3.${storage.region}.amazonaws.com/${key}`;

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
    const storage = this.getStorageConfig();
    const command = new GetObjectCommand({ Bucket: storage.bucket, Key: key });
    const presignedUrl = await getSignedUrl(storage.s3, command, { expiresIn });
    return { presignedUrl };
  }

  /**
   * 로컬에서 스토리지를 생략한 경우 서버 부팅 대신 해당 기능 호출만 명확하게 거절한다.
   *
   * @returns {object} Presigned URL 생성에 필요한 AWS 클라이언트와 버킷 정보
   */
  private getStorageConfig(): { s3: S3Client; bucket: string; region: string } {
    if (this.s3 === null || this.bucket === null || this.region === null) {
      throw new ServiceUnavailableException('로컬 스토리지가 설정되지 않았습니다. AWS 환경변수를 확인해 주세요.');
    }

    return { s3: this.s3, bucket: this.bucket, region: this.region };
  }
}

/**
 * 빈 환경변수를 설정값으로 오인하지 않도록 정규화한다.
 *
 * @param {ConfigService} configService - 애플리케이션 환경변수 접근 객체
 * @param {string} key - 읽을 환경변수 이름
 * @returns {string | null} 공백을 제거한 값 또는 미설정 상태
 */
function readOptionalConfig(configService: ConfigService, key: string): string | null {
  const value = configService.get<string>(key)?.trim();

  return value === undefined || value === '' ? null : value;
}

import { randomUUID } from 'node:crypto';

import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
   * 남지 않는다 — 업로드만 안 될 때 여기부터 의심한다.
   * 이 버킷은 Lightsail Object Storage라 설정은 `aws lightsail get-buckets --include-cors`로 본다.
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

  /**
   * 버킷의 모든 오브젝트 키와 크기를 조회한다. 어드민 대시보드의 스토리지 사용량 집계에 쓴다.
   *
   * ListObjectsV2는 한 번에 최대 1000개만 돌려주므로 continuation token으로 끝까지 이어서 조회한다.
   * 서버 자격 증명에 버킷 대상 `s3:ListBucket` 권한이 없으면 403(AccessDenied)으로 실패한다.
   *
   * @returns 오브젝트 키와 크기(바이트) 목록
   */
  async listAllObjects(): Promise<{ key: string; size: number }[]> {
    const objects: { key: string; size: number }[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucket, ContinuationToken: continuationToken }));

      for (const content of response.Contents ?? []) {
        if (content.Key === undefined) {
          continue;
        }
        objects.push({ key: content.Key, size: content.Size ?? 0 });
      }

      if (response.IsTruncated === true) {
        continuationToken = response.NextContinuationToken;
      } else {
        continuationToken = undefined;
      }
    } while (continuationToken !== undefined);

    return objects;
  }
}

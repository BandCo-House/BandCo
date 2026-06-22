import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = configService.getOrThrow<string>('NCP_OBJECT_STORAGE_ENDPOINT');
    this.bucket = configService.getOrThrow<string>('NCP_BUCKET_NAME');

    this.s3 = new S3Client({
      region: configService.getOrThrow<string>('NCP_REGION'),
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('NCP_ACCESS_KEY'),
        secretAccessKey: configService.getOrThrow<string>('NCP_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  /**
   * 지정된 키로 NCP 오브젝트 스토리지에 업로드할 Presigned URL을 생성한다.
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
    const objectUrl = `${this.endpoint}/${this.bucket}/${key}`;

    return { presignedUrl, objectUrl };
  }
}

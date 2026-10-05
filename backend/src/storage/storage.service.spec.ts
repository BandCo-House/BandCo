import { type ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ConfigService } from '@nestjs/config';

import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner');

const TEST_REGION = 'ap-northeast-2';
const TEST_BUCKET = 'test-bucket';

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, string> = {
      AWS_REGION: TEST_REGION,
      AWS_STORAGE_BUCKET: TEST_BUCKET,
    };
    if (key in config) return config[key];
    throw new Error(`Unknown config key: ${key}`);
  }),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService(mockConfigService as unknown as ConfigService);
    jest.clearAllMocks();
  });

  describe('getPresignedUploadUrl', () => {
    it('presignedUrl과 objectUrl을 반환한다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned.example.com/signed');

      const result = await service.getPresignedUploadUrl('profiles/test.jpg', 'image/jpeg');

      expect(result).toEqual({
        presignedUrl: 'https://presigned.example.com/signed',
        objectUrl: `https://${TEST_BUCKET}.s3.${TEST_REGION}.amazonaws.com/profiles/test.jpg`,
      });
    });

    it('기본 만료 시간 300초로 서명된다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned.example.com/signed');

      await service.getPresignedUploadUrl('profiles/test.jpg', 'image/jpeg');

      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 300 });
    });

    it('expiresIn을 직접 지정할 수 있다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned.example.com/signed');

      await service.getPresignedUploadUrl('profiles/test.jpg', 'image/jpeg', 600);

      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 600 });
    });
  });

  describe('listAllObjects', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('continuation token을 따라 모든 페이지의 오브젝트를 모은다', async () => {
      const sendSpy = jest
        .spyOn(S3Client.prototype, 'send')
        .mockResolvedValueOnce({
          Contents: [{ Key: 'users/a/profiles/1.jpeg', Size: 100 }],
          IsTruncated: true,
          NextContinuationToken: 'next-token',
        } as never)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'bands/b/cover.png', Size: 50 }],
          IsTruncated: false,
        } as never);

      const result = await service.listAllObjects();

      expect(result).toEqual([
        { key: 'users/a/profiles/1.jpeg', size: 100 },
        { key: 'bands/b/cover.png', size: 50 },
      ]);
      expect(sendSpy).toHaveBeenCalledTimes(2);
      const secondCommand = sendSpy.mock.calls[1][0] as ListObjectsV2Command;
      expect(secondCommand.input).toEqual({ Bucket: TEST_BUCKET, ContinuationToken: 'next-token' });
    });

    it('빈 버킷이면 빈 목록을 반환한다', async () => {
      jest.spyOn(S3Client.prototype, 'send').mockResolvedValueOnce({ IsTruncated: false } as never);

      const result = await service.listAllObjects();

      expect(result).toEqual([]);
    });
  });
});

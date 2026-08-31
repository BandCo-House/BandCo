import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner');

const TEST_REGION = 'ap-northeast-2';
const TEST_BUCKET = 'test-bucket';

const createConfigService = (config: Record<string, string | undefined>): ConfigService =>
  ({
    get(key: string) {
      return config[key];
    },
  }) as ConfigService;

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService(
      createConfigService({
        NODE_ENV: 'development',
        AWS_REGION: TEST_REGION,
        AWS_STORAGE_BUCKET: TEST_BUCKET,
      }),
    );
    jest.clearAllMocks();
  });

  it('로컬 환경은 AWS 설정 없이도 서비스를 초기화한다', async () => {
    const localService = new StorageService(createConfigService({ NODE_ENV: 'development' }));

    await expect(localService.getPresignedUploadUrl('profiles/test.jpg', 'image/jpeg')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('운영 환경은 AWS 설정이 없으면 초기화에 실패한다', () => {
    expect(() => new StorageService(createConfigService({ NODE_ENV: 'production' }))).toThrow(
      '운영 환경에는 AWS_REGION과 AWS_STORAGE_BUCKET이 필요합니다.',
    );
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
});

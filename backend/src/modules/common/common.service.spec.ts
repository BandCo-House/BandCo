import type { CommonRepository } from './repositories/common.repository';
import type { GenreListResult } from './types/genre-list.type';
import type { SkillTypeListResult } from './types/skill-type-list.type';
import { CommonService } from './common.service';

function createCommonRepositoryStub(options?: {
  genreListResult?: GenreListResult;
  skillTypeListResult?: SkillTypeListResult;
  onFindAllGenres?: (tx: unknown) => void;
  onFindAllSkillTypes?: (tx: unknown) => void;
}): CommonRepository {
  return {
    async findAllGenres(tx) {
      options?.onFindAllGenres?.(tx);
      return options?.genreListResult ?? { genres: [] };
    },
    async findAllSkillTypes(tx) {
      options?.onFindAllSkillTypes?.(tx);
      return options?.skillTypeListResult ?? { skills: [] };
    },
  };
}

describe('CommonService', () => {
  describe('getGenres', () => {
    it('Repository 결과를 그대로 반환한다', async () => {
      const expected: GenreListResult = { genres: [{ genreId: 'genre-1', name: '락' }] };
      const service = new CommonService(createCommonRepositoryStub({ genreListResult: expected }));

      const result = await service.getGenres();

      expect(result).toEqual(expected);
    });

    it('빈 목록도 예외 없이 반환한다', async () => {
      const service = new CommonService(createCommonRepositoryStub({ genreListResult: { genres: [] } }));

      const result = await service.getGenres();

      expect(result).toEqual({ genres: [] });
    });

    it('외부 tx가 전달되면 repository에 동일 tx를 전달한다', async () => {
      const tx = {} as never;
      let capturedTx: unknown;
      const service = new CommonService(
        createCommonRepositoryStub({
          onFindAllGenres: t => {
            capturedTx = t;
          },
        }),
      );

      await service.getGenres(tx);

      expect(capturedTx).toBe(tx);
    });
  });

  describe('getSkillTypes', () => {
    it('Repository 결과를 그대로 반환한다', async () => {
      const expected: SkillTypeListResult = { skills: [{ skillTypeId: 'skill-1', name: '보컬' }] };
      const service = new CommonService(createCommonRepositoryStub({ skillTypeListResult: expected }));

      const result = await service.getSkillTypes();

      expect(result).toEqual(expected);
    });

    it('빈 목록도 예외 없이 반환한다', async () => {
      const service = new CommonService(createCommonRepositoryStub({ skillTypeListResult: { skills: [] } }));

      const result = await service.getSkillTypes();

      expect(result).toEqual({ skills: [] });
    });

    it('외부 tx가 전달되면 repository에 동일 tx를 전달한다', async () => {
      const tx = {} as never;
      let capturedTx: unknown;
      const service = new CommonService(
        createCommonRepositoryStub({
          onFindAllSkillTypes: t => {
            capturedTx = t;
          },
        }),
      );

      await service.getSkillTypes(tx);

      expect(capturedTx).toBe(tx);
    });
  });
});

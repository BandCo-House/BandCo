import type { SkillsRepository } from './repositories/skills.repository';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  const createService = () => {
    const repository: jest.Mocked<SkillsRepository> = {
      findExistingSkillTypeIds: jest.fn(),
    };

    const service = new SkillsService(repository);

    return {
      repository,
      service,
    };
  };

  describe('findExistingSkillTypeIds', () => {
    it('Repository 결과를 그대로 반환한다', async () => {
      const { repository, service } = createService();

      repository.findExistingSkillTypeIds.mockResolvedValue({ skillTypeIds: ['skill-type-1'] });

      const result = await service.findExistingSkillTypeIds(['skill-type-1']);

      expect(repository.findExistingSkillTypeIds).toHaveBeenCalledWith(['skill-type-1'], undefined);
      expect(result).toEqual({ skillTypeIds: ['skill-type-1'] });
    });
  });
});

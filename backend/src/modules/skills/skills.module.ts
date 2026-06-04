import { Module } from '@nestjs/common';

import { SkillsPrismaRepository } from './repositories/skills.prisma-repository';
import { SKILLS_REPOSITORY } from './repositories/skills.repository';
import { SkillsService } from './skills.service';

@Module({
  providers: [
    SkillsService,
    SkillsPrismaRepository,
    {
      provide: SKILLS_REPOSITORY,
      useExisting: SkillsPrismaRepository,
    },
  ],
  exports: [SkillsService],
})
export class SkillsModule {}

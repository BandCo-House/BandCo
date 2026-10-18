import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminGenresPrismaRepository } from './repositories/admin-genres.prisma-repository';
import { ADMIN_GENRES_REPOSITORY } from './repositories/admin-genres.repository';
import { AdminSkillTypesPrismaRepository } from './repositories/admin-skill-types.prisma-repository';
import { ADMIN_SKILL_TYPES_REPOSITORY } from './repositories/admin-skill-types.repository';
import { AdminGenresController } from './admin-genres.controller';
import { AdminGenresService } from './admin-genres.service';
import { AdminSkillTypesController } from './admin-skill-types.controller';
import { AdminSkillTypesService } from './admin-skill-types.service';

/** 어드민 마스터 데이터 관리(/admin/genres, /admin/skill-types). 가드와 감사 로그는 AdminCoreModule에서 가져온다. */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminGenresController, AdminSkillTypesController],
  providers: [
    AdminGenresService,
    AdminSkillTypesService,
    { provide: ADMIN_GENRES_REPOSITORY, useClass: AdminGenresPrismaRepository },
    { provide: ADMIN_SKILL_TYPES_REPOSITORY, useClass: AdminSkillTypesPrismaRepository },
  ],
})
export class AdminMasterDataModule {}

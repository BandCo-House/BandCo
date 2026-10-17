import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_GENRES_REPOSITORY, type AdminGenresRepository } from './repositories/admin-genres.repository';
import type { AdminGenreItem, CreateMasterDataInput, UpdateMasterDataInput } from './types/admin-master-data.type';

const DUPLICATE_GENRE_NAME_MESSAGE = '이미 같은 이름의 장르가 있습니다.';

@Injectable()
export class AdminGenresService {
  constructor(
    @Inject(ADMIN_GENRES_REPOSITORY)
    private readonly adminGenresRepository: AdminGenresRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 장르 전체를 표시 순서대로 사용 횟수와 함께 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ genres: AdminGenreItem[] }>} 장르 목록
   */
  async getGenres(tx?: Prisma.TransactionClient): Promise<{ genres: AdminGenreItem[] }> {
    const genres = await this.adminGenresRepository.findGenres(tx);
    return { genres };
  }

  /**
   * 장르를 추가한다. sortOrder를 생략하면 기존 최대값 + 1(장르가 없으면 0)로 맨 뒤에 둔다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {CreateMasterDataInput} input - 이름(앞뒤 공백 제거됨)과 선택 sortOrder
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem>} 생성된 장르
   */
  async createGenre(admin: AdminPrincipal, input: CreateMasterDataInput, tx?: Prisma.TransactionClient): Promise<AdminGenreItem> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminGenreItem> => {
      const duplicate = await this.adminGenresRepository.findGenreIdByName(input.name, client);
      if (duplicate !== null) {
        throw new ConflictException(DUPLICATE_GENRE_NAME_MESSAGE);
      }

      const sortOrder = input.sortOrder ?? (await this.findNextSortOrder(client));
      const created = await this.saveWithDuplicateNameGuard(() => this.adminGenresRepository.createGenre({ name: input.name, sortOrder }, client));
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'GENRE_CREATE',
          targetType: 'GENRE',
          targetId: created.genreId,
          detail: { name: created.name, sortOrder: created.sortOrder },
        },
        client,
      );

      return created;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 장르 이름·순서를 바꾼다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} genreId - 장르 ID
   * @param {UpdateMasterDataInput} input - 변경 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem>} 수정된 장르
   */
  async updateGenre(admin: AdminPrincipal, genreId: string, input: UpdateMasterDataInput, tx?: Prisma.TransactionClient): Promise<AdminGenreItem> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminGenreItem> => {
      await this.findGenre(genreId, client);

      if (input.name !== undefined) {
        const duplicate = await this.adminGenresRepository.findGenreIdByName(input.name, client);
        const isOtherGenre = duplicate !== null && duplicate.id !== genreId;
        if (isOtherGenre) {
          throw new ConflictException(DUPLICATE_GENRE_NAME_MESSAGE);
        }
      }

      const updated = await this.saveWithDuplicateNameGuard(() =>
        this.adminGenresRepository.updateGenre(genreId, { name: input.name, sortOrder: input.sortOrder }, client),
      );
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'GENRE_UPDATE',
          targetType: 'GENRE',
          targetId: genreId,
          detail: { name: updated.name, sortOrder: updated.sortOrder },
        },
        client,
      );

      return updated;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 장르를 삭제한다.
   * band_genres·favor_genres FK가 CASCADE라 사용 중인 장르를 지우면 밴드·유저의 장르 선택이 조용히 사라지므로 막는다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} genreId - 장르 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ genreId: string }>} 삭제된 장르 ID
   */
  async deleteGenre(admin: AdminPrincipal, genreId: string, tx?: Prisma.TransactionClient): Promise<{ genreId: string }> {
    const run = async (client: Prisma.TransactionClient): Promise<{ genreId: string }> => {
      const genre = await this.findGenre(genreId, client);
      if (genre.usageCount > 0) {
        throw new ConflictException(`밴드·유저 ${genre.usageCount}건에서 사용 중인 장르는 삭제할 수 없습니다.`);
      }

      await this.adminGenresRepository.deleteGenre(genreId, client);
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'GENRE_DELETE',
          targetType: 'GENRE',
          targetId: genreId,
          detail: { name: genre.name, sortOrder: genre.sortOrder },
        },
        client,
      );

      return { genreId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** 장르를 찾고, 없으면 404를 던진다. */
  private async findGenre(genreId: string, client: Prisma.TransactionClient): Promise<AdminGenreItem> {
    const genre = await this.adminGenresRepository.findGenreById(genreId, client);
    if (genre === null) {
      throw new NotFoundException('장르를 찾을 수 없습니다.');
    }

    return genre;
  }

  /** 새 장르를 맨 뒤에 두기 위한 순서. 장르가 없으면 0부터 시작한다. */
  private async findNextSortOrder(client: Prisma.TransactionClient): Promise<number> {
    const maxSortOrder = await this.adminGenresRepository.findMaxGenreSortOrder(client);
    if (maxSortOrder === null) {
      return 0;
    }

    return maxSortOrder + 1;
  }

  /**
   * 사전 중복 검사와 저장 사이에 같은 이름이 끼어들 수 있어,
   * name 유니크 제약 위반(P2002)도 사전 검사와 같은 409로 바꾼다.
   */
  private async saveWithDuplicateNameGuard<T>(save: () => Promise<T>): Promise<T> {
    try {
      return await save();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE_GENRE_NAME_MESSAGE);
      }
      throw error;
    }
  }
}

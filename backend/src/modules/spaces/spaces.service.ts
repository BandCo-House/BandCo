import { Injectable } from '@nestjs/common';

import { createPagination, paginateItems } from '../../common/pagination';

import type { GetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import { SpacesMockRepository } from './repositories/spaces.mock-repository';
import type { BandSpaceListItem, GetBandSpacesResult } from './types/band-space-list-item.type';

@Injectable()
export class SpacesService {
  constructor(private readonly spacesRepository: SpacesMockRepository) {}

  getBandSpaces(bandId: string, query: GetBandSpacesQuery): GetBandSpacesResult {
    const allSpaces = this.spacesRepository.findAll();
    const bandSpaces = allSpaces.filter(space => space.bandId === bandId);
    const searchedSpaces = this.applySearchFilter(bandSpaces, query.query);
    const mineFilteredSpaces = this.applyOnlyMineFilter(searchedSpaces, query.onlyMine);
    const statusFilteredSpaces = this.applyInProgressFilter(mineFilteredSpaces, query.inProgressOnly);
    const sortedSpaces = this.applySort(statusFilteredSpaces, query.sort);
    const pagination = createPagination(sortedSpaces.length, {
      page: query.page,
      size: query.size,
    });
    const pagedSpaces = paginateItems(sortedSpaces, {
      page: query.page,
      size: query.size,
    });

    return {
      items: pagedSpaces,
      pagination,
    };
  }

  private applySearchFilter(spaces: BandSpaceListItem[], keyword: string | undefined): BandSpaceListItem[] {
    if (keyword === undefined) {
      return spaces;
    }

    const normalizedKeyword = keyword.toLowerCase();

    return spaces.filter(space => {
      const matchesName = space.name.toLowerCase().includes(normalizedKeyword);
      const matchesDescription = space.description.toLowerCase().includes(normalizedKeyword);

      return matchesName || matchesDescription;
    });
  }

  private applyOnlyMineFilter(spaces: BandSpaceListItem[], onlyMine: boolean | undefined): BandSpaceListItem[] {
    if (onlyMine !== true) {
      return spaces;
    }

    return spaces.filter(space => space.isMine);
  }

  private applyInProgressFilter(spaces: BandSpaceListItem[], inProgressOnly: boolean | undefined): BandSpaceListItem[] {
    if (inProgressOnly !== true) {
      return spaces;
    }

    return spaces.filter(space => space.status === 'ACTIVE');
  }

  private applySort(spaces: BandSpaceListItem[], sort: string | undefined): BandSpaceListItem[] {
    if (sort === undefined || sort === 'createdAt,desc') {
      return [...spaces].sort((leftSpace, rightSpace) => rightSpace.createdAt.localeCompare(leftSpace.createdAt));
    }

    if (sort === 'createdAt,asc') {
      return [...spaces].sort((leftSpace, rightSpace) => leftSpace.createdAt.localeCompare(rightSpace.createdAt));
    }

    if (sort === 'name,asc') {
      return [...spaces].sort((leftSpace, rightSpace) => leftSpace.name.localeCompare(rightSpace.name));
    }

    if (sort === 'name,desc') {
      return [...spaces].sort((leftSpace, rightSpace) => rightSpace.name.localeCompare(leftSpace.name));
    }

    return spaces;
  }
}

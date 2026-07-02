import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import type { GetBandTeamsQuery } from './dto/get-band-teams-query.dto';
import type { GetMyTeamsQuery } from './dto/get-my-teams-query.dto';
import type { GetTeamMembersQuery } from './dto/get-team-members-query.dto';
import type { TeamsRepository } from './repositories/teams.repository';
import type { AddTeamMemberResult } from './types/add-team-member-result.type';
import type { ChangeTeamLeaderResult } from './types/change-team-leader-result.type';
import type { CreateTeamResult } from './types/create-team-result.type';
import type { DeleteTeamResult } from './types/delete-team-result.type';
import type { GetBandTeamsResult } from './types/get-band-teams-result.type';
import type { GetMyTeamsResult } from './types/get-my-teams-result.type';
import type { GetTeamMembersResult } from './types/get-team-members-result.type';
import type { GetTeamResult } from './types/get-team-result.type';
import type { RemoveTeamMemberResult } from './types/remove-team-member-result.type';
import type { UpdateTeamResult } from './types/update-team-result.type';
import { TeamsService } from './teams.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_ID = '22222222-2222-4222-8222-222222222222';
const TEAM_ID = '33333333-3333-4333-8333-333333333333';
const BAND_MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const TEAM_MEMBER_ID = '55555555-5555-4555-8555-555555555555';
const OTHER_BAND_MEMBER_ID = '66666666-6666-4666-8666-666666666666';
const OTHER_TEAM_MEMBER_ID = '77777777-7777-4777-8777-777777777777';

const DEFAULT_BAND_MEMBER = { id: BAND_MEMBER_ID };
const DEFAULT_BAND_MEMBER_RECORD = { id: BAND_MEMBER_ID, bandId: BAND_ID };

const DEFAULT_TEAM_FOR_UPDATE = {
  id: TEAM_ID,
  bandId: BAND_ID,
  teamLeaderBandMemberId: BAND_MEMBER_ID,
};

const DEFAULT_TEAM_MEMBER = {
  id: TEAM_MEMBER_ID,
  teamId: TEAM_ID,
  bandMemberId: BAND_MEMBER_ID,
  teamRole: 'MEMBER' as const,
};

const DEFAULT_CREATE_RESULT: CreateTeamResult = {
  teamId: TEAM_ID,
  bandId: BAND_ID,
  name: '보컬팀',
  description: null,
  status: 'ACTIVE',
  teamLeaderUserId: USER_ID,
  teamCoverUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_GET_TEAM_RESULT: GetTeamResult = {
  teamId: TEAM_ID,
  bandId: BAND_ID,
  name: '보컬팀',
  description: null,
  status: 'ACTIVE',
  teamCoverUrl: null,
  teamLeader: { userId: USER_ID, nickname: '리더' },
  memberCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_UPDATE_RESULT: UpdateTeamResult = {
  teamId: TEAM_ID,
  bandId: BAND_ID,
  name: '보컬팀',
  description: null,
  status: 'ACTIVE',
  teamCoverUrl: null,
  teamLeader: { userId: USER_ID, nickname: '리더' },
  memberCount: 1,
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const DEFAULT_BAND_TEAMS_RESULT: GetBandTeamsResult = {
  bandId: BAND_ID,
  items: [],
  meta: { count: 0, take: 20, cursor: null, next: null },
};

const DEFAULT_TEAM_MEMBERS_RESULT: GetTeamMembersResult = {
  teamId: TEAM_ID,
  items: [],
  meta: { count: 0, take: 20, cursor: null, next: null },
};

const DEFAULT_MY_TEAMS_RESULT: GetMyTeamsResult = {
  items: [],
  meta: { count: 0, take: 20, cursor: null, next: null },
};

const DEFAULT_CHANGE_LEADER_RESULT: ChangeTeamLeaderResult = {
  teamId: TEAM_ID,
  teamLeader: { userId: '99999999-9999-4999-8999-999999999999', nickname: '새 리더' },
};

const DEFAULT_REMOVE_RESULT: RemoveTeamMemberResult = {
  teamMemberId: OTHER_TEAM_MEMBER_ID,
  removed: true,
};

const DEFAULT_ADD_MEMBER_RESULT: AddTeamMemberResult = {
  teamMemberId: OTHER_TEAM_MEMBER_ID,
  teamId: TEAM_ID,
  bandMemberId: OTHER_BAND_MEMBER_ID,
  user: { userId: USER_ID, nickname: '새 멤버', profileImageUrl: null },
  teamRole: 'MEMBER',
  joinedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_DELETE_RESULT: DeleteTeamResult = {
  teamId: TEAM_ID,
  deleted: true,
};

function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

const DEFAULT_BAND = { id: BAND_ID };

function createTeamsRepositoryStub(options?: {
  band?: { id: string } | null;
  bandMemberByBandAndUser?: { id: string } | null;
  bandMemberById?: { id: string; bandId: string } | null;
  teamForUpdate?: { id: string; bandId: string; teamLeaderBandMemberId: string | null } | null;
  teamById?: GetTeamResult | null;
  teamMemberById?: { id: string; teamId: string; bandMemberId: string; teamRole: string } | null;
  teamMemberByTeamAndBandMember?: { id: string; teamRole: string } | null;
  onCreateTeam?: (input: unknown, tx: unknown) => void;
  onUpdateTeam?: (teamId: string, input: unknown, tx: unknown) => void;
  onChangeTeamLeader?: (teamId: string, newLeaderTeamMemberId: string, tx: unknown) => void;
  onRemoveTeamMember?: (teamMemberId: string, teamId: string, tx: unknown) => void;
  onAddTeamMember?: (teamId: string, bandMemberId: string, tx: unknown) => void;
  onDeleteTeam?: (teamId: string, tx: unknown) => void;
}): TeamsRepository {
  return {
    async findBandById(_bandId, _tx) {
      return options?.band !== undefined ? options.band : DEFAULT_BAND;
    },
    async findBandMemberByBandIdAndUserId(_bandId, _userId, _tx) {
      return options?.bandMemberByBandAndUser !== undefined ? options.bandMemberByBandAndUser : DEFAULT_BAND_MEMBER;
    },
    async findBandMemberById(_bandMemberId, _tx) {
      return options?.bandMemberById !== undefined ? options.bandMemberById : DEFAULT_BAND_MEMBER_RECORD;
    },
    async createTeam(input, tx) {
      options?.onCreateTeam?.(input, tx);
      return DEFAULT_CREATE_RESULT;
    },
    async findBandTeams(_bandId, _query, _tx) {
      return DEFAULT_BAND_TEAMS_RESULT;
    },
    async findTeamById(_teamId, _tx) {
      return options?.teamById !== undefined ? options.teamById : DEFAULT_GET_TEAM_RESULT;
    },
    async findTeamForUpdate(_teamId, _tx) {
      return options?.teamForUpdate !== undefined ? options.teamForUpdate : DEFAULT_TEAM_FOR_UPDATE;
    },
    async findTeamMemberByTeamAndBandMember(_teamId, _bandMemberId, _tx) {
      return options?.teamMemberByTeamAndBandMember !== undefined ? options.teamMemberByTeamAndBandMember : null;
    },
    async findTeamMemberById(_teamMemberId, _tx) {
      return options?.teamMemberById !== undefined ? options.teamMemberById : DEFAULT_TEAM_MEMBER;
    },
    async updateTeam(teamId, input, tx) {
      options?.onUpdateTeam?.(teamId, input, tx);
      return DEFAULT_UPDATE_RESULT;
    },
    async findTeamMembers(_teamId, _query, _tx) {
      return DEFAULT_TEAM_MEMBERS_RESULT;
    },
    async changeTeamLeader(teamId, newLeaderTeamMemberId, tx) {
      options?.onChangeTeamLeader?.(teamId, newLeaderTeamMemberId, tx);
      return DEFAULT_CHANGE_LEADER_RESULT;
    },
    async removeTeamMember(teamMemberId, teamId, tx) {
      options?.onRemoveTeamMember?.(teamMemberId, teamId, tx);
      return DEFAULT_REMOVE_RESULT;
    },
    async findMyTeams(_userId, _query, _tx) {
      return DEFAULT_MY_TEAMS_RESULT;
    },
    async addTeamMember(teamId, bandMemberId, tx) {
      options?.onAddTeamMember?.(teamId, bandMemberId, tx);
      return DEFAULT_ADD_MEMBER_RESULT;
    },
    async deleteTeam(teamId, tx) {
      options?.onDeleteTeam?.(teamId, tx);
      return DEFAULT_DELETE_RESULT;
    },
  };
}

const BASE_BAND_TEAMS_QUERY: GetBandTeamsQuery = {
  take: 20,
  order__created_at: 'desc',
  order__id: 'desc',
};

const BASE_TEAM_MEMBERS_QUERY: GetTeamMembersQuery = {
  take: 20,
  order__joined_at: 'desc',
  order__id: 'desc',
};

const BASE_MY_TEAMS_QUERY: GetMyTeamsQuery = {
  take: 20,
  order__joined_at: 'desc',
  order__id: 'desc',
};

describe('TeamsService', () => {
  describe('createTeam', () => {
    it('팀을 성공적으로 생성한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.createTeam(USER_ID, BAND_ID, { name: '보컬팀' });

      expect(result.teamId).toBe(TEAM_ID);
      expect(result.bandId).toBe(BAND_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ band: null }), createPrismaServiceStub());

      await expect(service.createTeam(USER_ID, BAND_ID, { name: '보컬팀' })).rejects.toThrow(NotFoundException);
    });

    it('밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: null }), createPrismaServiceStub());

      await expect(service.createTeam(USER_ID, BAND_ID, { name: '보컬팀' })).rejects.toThrow(ForbiddenException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        onCreateTeam: (_input, tx) => capturedTransactions.push(tx),
      });

      repository.findBandById = async (_bandId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.createTeam(USER_ID, BAND_ID, { name: '보컬팀' });

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          onCreateTeam: (_input, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.createTeam(USER_ID, BAND_ID, { name: '보컬팀' }, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getBandTeams', () => {
    it('밴드 팀 목록을 성공적으로 조회한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.getBandTeams(BAND_ID, BASE_BAND_TEAMS_QUERY);

      expect(result.bandId).toBe(BAND_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ band: null }), createPrismaServiceStub());

      await expect(service.getBandTeams(BAND_ID, BASE_BAND_TEAMS_QUERY)).rejects.toThrow(NotFoundException);
    });

    it('외부 tx를 findBandById와 findBandTeams에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub();
      repository.findBandById = async (_bandId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND;
      };
      repository.findBandTeams = async (_bandId, _query, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_TEAMS_RESULT;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.getBandTeams(BAND_ID, BASE_BAND_TEAMS_QUERY, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(0);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('getTeam', () => {
    it('팀 상세를 성공적으로 조회한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.getTeam(TEAM_ID);

      expect(result.teamId).toBe(TEAM_ID);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamById: null }), createPrismaServiceStub());

      await expect(service.getTeam(TEAM_ID)).rejects.toThrow(NotFoundException);
    });

    it('외부 tx를 findTeamById에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createTeamsRepositoryStub();
      repository.findTeamById = async (_teamId, tx) => {
        capturedTx = tx;
        return DEFAULT_GET_TEAM_RESULT;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.getTeam(TEAM_ID, externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('updateTeam', () => {
    it('팀 리더가 팀 정보를 성공적으로 수정한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.updateTeam(USER_ID, TEAM_ID, { name: '새 이름' });

      expect(result.teamId).toBe(TEAM_ID);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.updateTeam(USER_ID, TEAM_ID, { name: '새 이름' })).rejects.toThrow(NotFoundException);
    });

    it('팀 리더가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: { id: 'different-id' } }), createPrismaServiceStub());

      await expect(service.updateTeam(USER_ID, TEAM_ID, { name: '새 이름' })).rejects.toThrow(ForbiddenException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        onUpdateTeam: (_teamId, _input, tx) => capturedTransactions.push(tx),
      });

      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.updateTeam(USER_ID, TEAM_ID, { name: '새 이름' });

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          onUpdateTeam: (_teamId, _input, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.updateTeam(USER_ID, TEAM_ID, { name: '새 이름' }, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getTeamMembers', () => {
    it('팀 멤버 목록을 성공적으로 조회한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.getTeamMembers(TEAM_ID, BASE_TEAM_MEMBERS_QUERY);

      expect(result.teamId).toBe(TEAM_ID);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.getTeamMembers(TEAM_ID, BASE_TEAM_MEMBERS_QUERY)).rejects.toThrow(NotFoundException);
    });

    it('외부 tx를 findTeamForUpdate와 findTeamMembers에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub();
      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findTeamMembers = async (_teamId, _query, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_MEMBERS_RESULT;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.getTeamMembers(TEAM_ID, BASE_TEAM_MEMBERS_QUERY, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(0);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('changeTeamLeader', () => {
    const newLeaderTeamMember = {
      id: OTHER_TEAM_MEMBER_ID,
      teamId: TEAM_ID,
      bandMemberId: OTHER_BAND_MEMBER_ID,
      teamRole: 'MEMBER' as const,
    };

    it('팀 리더를 성공적으로 변경한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: newLeaderTeamMember }), createPrismaServiceStub());
      const result = await service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID });

      expect(result.teamId).toBe(TEAM_ID);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID })).rejects.toThrow(NotFoundException);
    });

    it('팀 리더가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: { id: 'different-id' } }), createPrismaServiceStub());

      await expect(service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID })).rejects.toThrow(ForbiddenException);
    });

    it('대상 팀 멤버가 팀에 없으면 NotFoundException을 던진다', async () => {
      const memberInOtherTeam = { ...newLeaderTeamMember, teamId: 'other-team-id' };
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: memberInOtherTeam }), createPrismaServiceStub());

      await expect(service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID })).rejects.toThrow(NotFoundException);
    });

    it('대상이 이미 팀 리더이면 BadRequestException을 던진다', async () => {
      const alreadyLeader = { ...newLeaderTeamMember, teamRole: 'LEADER' as const };
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: alreadyLeader }), createPrismaServiceStub());

      await expect(service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID })).rejects.toThrow(BadRequestException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        teamMemberById: newLeaderTeamMember,
        onChangeTeamLeader: (_teamId, _newLeaderId, tx) => capturedTransactions.push(tx),
      });

      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };
      repository.findTeamMemberById = async (_teamMemberId, tx) => {
        capturedTransactions.push(tx);
        return newLeaderTeamMember;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID });

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          teamMemberById: newLeaderTeamMember,
          onChangeTeamLeader: (_teamId, _newLeaderId, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.changeTeamLeader(USER_ID, TEAM_ID, { teamMemberId: OTHER_TEAM_MEMBER_ID }, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('removeTeamMember', () => {
    const targetMember = {
      id: OTHER_TEAM_MEMBER_ID,
      teamId: TEAM_ID,
      bandMemberId: OTHER_BAND_MEMBER_ID,
      teamRole: 'MEMBER' as const,
    };

    it('팀 리더가 팀 멤버를 성공적으로 제거한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: targetMember }), createPrismaServiceStub());
      const result = await service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID);

      expect(result.removed).toBe(true);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID)).rejects.toThrow(NotFoundException);
    });

    it('팀 리더가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: { id: 'different-id' } }), createPrismaServiceStub());

      await expect(service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('대상 팀 멤버가 팀에 없으면 NotFoundException을 던진다', async () => {
      const memberInOtherTeam = { ...targetMember, teamId: 'other-team-id' };
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: memberInOtherTeam }), createPrismaServiceStub());

      await expect(service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID)).rejects.toThrow(NotFoundException);
    });

    it('팀 리더는 자신을 제거할 수 없다 (BadRequestException)', async () => {
      const leaderMember = { ...targetMember, teamRole: 'LEADER' as const };
      const service = new TeamsService(createTeamsRepositoryStub({ teamMemberById: leaderMember }), createPrismaServiceStub());

      await expect(service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID)).rejects.toThrow(BadRequestException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        teamMemberById: targetMember,
        onRemoveTeamMember: (_teamMemberId, _teamId, tx) => capturedTransactions.push(tx),
      });

      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };
      repository.findTeamMemberById = async (_teamMemberId, tx) => {
        capturedTransactions.push(tx);
        return targetMember;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID);

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          teamMemberById: targetMember,
          onRemoveTeamMember: (_teamMemberId, _teamId, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.removeTeamMember(USER_ID, TEAM_ID, OTHER_TEAM_MEMBER_ID, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getMyTeams', () => {
    it('내 팀 목록을 성공적으로 조회한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.getMyTeams(USER_ID, BASE_MY_TEAMS_QUERY);

      expect(result.meta.count).toBe(0);
    });

    it('외부 tx를 findMyTeams에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createTeamsRepositoryStub();
      repository.findMyTeams = async (_userId, _query, tx) => {
        capturedTx = tx;
        return DEFAULT_MY_TEAMS_RESULT;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.getMyTeams(USER_ID, BASE_MY_TEAMS_QUERY, externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('addTeamMember', () => {
    const otherBandMemberRecord = { id: OTHER_BAND_MEMBER_ID, bandId: BAND_ID };

    it('팀 리더가 밴드 멤버를 팀에 추가한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberById: otherBandMemberRecord }), createPrismaServiceStub());
      const result = await service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID);

      expect(result.teamId).toBe(TEAM_ID);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID)).rejects.toThrow(NotFoundException);
    });

    it('팀 리더가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: { id: 'different-id' } }), createPrismaServiceStub());

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('추가 대상 밴드 멤버가 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberById: null }), createPrismaServiceStub());

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID)).rejects.toThrow(NotFoundException);
    });

    it('다른 밴드 멤버이면 BadRequestException을 던진다', async () => {
      const otherBandMember = { id: OTHER_BAND_MEMBER_ID, bandId: 'other-band-id' };
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberById: otherBandMember }), createPrismaServiceStub());

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID)).rejects.toThrow(BadRequestException);
    });

    it('이미 팀 멤버이면 ConflictException을 던진다', async () => {
      const existingMember = { id: TEAM_MEMBER_ID, teamRole: 'MEMBER' };
      const service = new TeamsService(
        createTeamsRepositoryStub({
          bandMemberById: otherBandMemberRecord,
          teamMemberByTeamAndBandMember: existingMember,
        }),
        createPrismaServiceStub(),
      );

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID)).rejects.toThrow(ConflictException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        bandMemberById: otherBandMemberRecord,
        onAddTeamMember: (_teamId, _bandMemberId, tx) => capturedTransactions.push(tx),
      });

      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };
      repository.findBandMemberById = async (_bandMemberId, tx) => {
        capturedTransactions.push(tx);
        return otherBandMemberRecord;
      };
      repository.findTeamMemberByTeamAndBandMember = async (_teamId, _bandMemberId, tx) => {
        capturedTransactions.push(tx);
        return null;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID);

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          bandMemberById: otherBandMemberRecord,
          onAddTeamMember: (_teamId, _bandMemberId, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.addTeamMember(USER_ID, TEAM_ID, OTHER_BAND_MEMBER_ID, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('deleteTeam', () => {
    it('팀 리더가 팀을 성공적으로 삭제한다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub(), createPrismaServiceStub());
      const result = await service.deleteTeam(USER_ID, TEAM_ID);

      expect(result.deleted).toBe(true);
    });

    it('팀이 없으면 NotFoundException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ teamForUpdate: null }), createPrismaServiceStub());

      await expect(service.deleteTeam(USER_ID, TEAM_ID)).rejects.toThrow(NotFoundException);
    });

    it('팀 리더가 아니면 ForbiddenException을 던진다', async () => {
      const service = new TeamsService(createTeamsRepositoryStub({ bandMemberByBandAndUser: { id: 'different-id' } }), createPrismaServiceStub());

      await expect(service.deleteTeam(USER_ID, TEAM_ID)).rejects.toThrow(ForbiddenException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createTeamsRepositoryStub({
        onDeleteTeam: (_teamId, tx) => capturedTransactions.push(tx),
      });

      repository.findTeamForUpdate = async (_teamId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_TEAM_FOR_UPDATE;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);
        return DEFAULT_BAND_MEMBER;
      };

      const service = new TeamsService(repository, createPrismaServiceStub());
      await service.deleteTeam(USER_ID, TEAM_ID);

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않고 mutation에 externalTx를 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const service = new TeamsService(
        createTeamsRepositoryStub({
          onDeleteTeam: (_teamId, tx) => {
            capturedTx = tx;
          },
        }),
        createPrismaServiceFailingTransactionStub(),
      );

      await expect(service.deleteTeam(USER_ID, TEAM_ID, externalTx as never)).resolves.toBeDefined();
      expect(capturedTx).toBe(externalTx);
    });
  });
});

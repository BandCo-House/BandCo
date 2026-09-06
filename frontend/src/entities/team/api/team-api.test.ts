import { describe, it, expect } from 'vitest';
import {
  getBandTeams,
  getTeamDetail,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
} from './team-api';

// mocks/team/handlers.ts의 인메모리 스토어를 그대로 쓴다. 삭제는 다른 케이스에 영향을 주므로 마지막에 둔다.
describe('team-api 계약 테스트', () => {
  it('밴드 팀 목록을 올바르게 조회한다', async () => {
    const teams = await getBandTeams('band-1');
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0]).toHaveProperty('teamId');
    expect(teams[0]).toHaveProperty('name');
  });

  it('팀 상세 정보를 올바르게 조회한다', async () => {
    const detail = await getTeamDetail('team-1');
    expect(detail.teamId).toBe('team-1');
    expect(detail.name).toBe('듀얼 기타 편성');
  });

  it('팀 멤버 목록을 올바르게 조회한다', async () => {
    const members = await getTeamMembers('team-1');
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBe(2);
    expect(members[0].user.nickname).toBe('김민준');
  });

  it('팀 멤버를 올바르게 추가한다', async () => {
    const newMember = await addTeamMember('team-1', 'member-3');
    expect(newMember.bandMemberId).toBe('member-3');
    expect(newMember.user.nickname).toBe('이준호');
  });

  it('팀 멤버를 올바르게 제거한다', async () => {
    const result = await removeTeamMember('team-1', 'tm-1-2');
    expect(result.teamMemberId).toBe('tm-1-2');
    expect(result.removed).toBe(true);
  });

  it('팀을 올바르게 삭제한다', async () => {
    const result = await deleteTeam('team-1');
    expect(result.teamId).toBe('team-1');
    expect(result.deleted).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import {
  getBandTeams,
  getTeamDetail,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
} from './team-api';

describe('team-api Contract Tests', () => {
  it('fetches band teams list correctly', async () => {
    const teams = await getBandTeams('band-1');
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0]).toHaveProperty('teamId');
    expect(teams[0]).toHaveProperty('name');
  });

  it('fetches team detail correctly', async () => {
    const detail = await getTeamDetail('team-1');
    expect(detail.teamId).toBe('team-1');
    expect(detail.name).toBe('보컬팀');
  });

  it('deletes team correctly', async () => {
    const result = await deleteTeam('team-1');
    expect(result.teamId).toBe('team-1');
    expect(result.deleted).toBe(true);
  });

  it('fetches team members correctly', async () => {
    const members = await getTeamMembers('team-1');
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBe(4);
    expect(members[0].user.nickname).toBe('김기타');
  });

  it('adds team member correctly', async () => {
    const newMember = await addTeamMember('team-1', 'bm-5');
    expect(newMember.bandMemberId).toBe('bm-5');
    expect(newMember.user.nickname).toBe('신규멤버');
  });

  it('removes team member correctly', async () => {
    const result = await removeTeamMember('team-1', 'tm-1');
    expect(result.teamMemberId).toBe('tm-1');
    expect(result.removed).toBe(true);
  });
});

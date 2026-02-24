interface Props {
  selectedTeamId: string | null;
  onChange: (teamId: string) => void;
  onSubmit: () => void;
}

export const TeamSelectStep = ({
  selectedTeamId,
  onChange,
  onSubmit,
}: Props) => {
  const teams = [
    { id: 'team-1', name: '팀 A' },
    { id: 'team-2', name: '팀 B' },
  ];

  const isValid = selectedTeamId !== null;

  return (
    <div data-testid="ensemble-step-3">
      <h2>팀 선택 스텝</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            <label>
              <input
                type="radio"
                name="team"
                checked={selectedTeamId === team.id}
                onChange={() => onChange(team.id)}
              />
              {team.name}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={onSubmit} disabled={!isValid}>
        생성 완료
      </button>
    </div>
  );
};

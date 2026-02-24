interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  memo: string;
  onMemoChange: (memo: string) => void;
  onSubmit: () => void;
}

export const MemberSelectStep = ({
  selectedIds,
  onChange,
  memo,
  onMemoChange,
  onSubmit,
}: Props) => {
  // Dummy data representing fetched members
  const members = [
    { id: 'member-1', name: '김코딩' },
    { id: 'member-2', name: '박디자인' },
  ];

  const allSelected = selectedIds.length === members.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(members.map((m) => m.id));
    }
  };

  const handleToggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const isValid = selectedIds.length > 0;

  return (
    <div data-testid="meeting-step-2">
      <h2>참여 인원 및 메모 스텝</h2>
      <button onClick={handleToggleAll}>전원 선택</button>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(member.id)}
                onChange={() => handleToggle(member.id)}
              />
              {member.name}
            </label>
          </li>
        ))}
      </ul>
      <div>
        <label htmlFor="memo">메모</label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="간단한 메모를 적어주세요 (선택)"
        />
      </div>
      <button onClick={onSubmit} disabled={!isValid}>
        생성 완료
      </button>
    </div>
  );
};

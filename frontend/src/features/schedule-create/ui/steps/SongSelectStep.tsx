interface Props {
  selectedId: string | null;
  onChange: (id: string) => void;
  onNext: () => void;
}

export const SongSelectStep = ({ selectedId, onChange, onNext }: Props) => {
  // Dummy data representing fetched songs
  const songs = [
    { id: 'song-1', title: 'Hype Boy' },
    { id: 'song-2', title: 'Ditto' },
  ];

  const isValid = selectedId !== null;

  return (
    <div data-testid="ensemble-step-2">
      <h2>곡 선택 스텝</h2>
      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            <div
              className={`rounded-full border border-gray-300 ${selectedId === song.id ? 'bg-blue-500' : ''}`}
              aria-checked={selectedId === song.id}
              onClick={() => onChange(song.id)}
            >
              {song.title}
            </div>
          </li>
        ))}
      </ul>
      <button onClick={onNext} disabled={!isValid}>
        다음
      </button>
    </div>
  );
};

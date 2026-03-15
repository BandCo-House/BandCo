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
            <label>
              <input
                type="radio"
                name="song"
                checked={selectedId === song.id}
                onChange={() => onChange(song.id)}
              />
              {song.title}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={onNext} disabled={!isValid}>
        다음
      </button>
    </div>
  );
};

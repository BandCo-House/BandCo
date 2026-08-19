import { SONG_KEYS } from './schema';
import type { SongKey } from './types';

/**
 * 조성 표시 라벨. 백엔드 enum은 sharp만 갖고 있어 플랫은 이명동음으로 함께 적는다.
 * (예: `CSM` = C#/D♭ Minor)
 */
const SONG_KEY_LABELS: Record<SongKey, string> = {
  C: 'C Major',
  CM: 'C Minor',
  CS: 'C#/D♭ Major',
  CSM: 'C#/D♭ Minor',
  D: 'D Major',
  DM: 'D Minor',
  DS: 'D#/E♭ Major',
  DSM: 'D#/E♭ Minor',
  E: 'E Major',
  EM: 'E Minor',
  F: 'F Major',
  FM: 'F Minor',
  FS: 'F#/G♭ Major',
  FSM: 'F#/G♭ Minor',
  G: 'G Major',
  GM: 'G Minor',
  GS: 'G#/A♭ Major',
  GSM: 'G#/A♭ Minor',
  A: 'A Major',
  AM: 'A Minor',
  AS: 'A#/B♭ Major',
  ASM: 'A#/B♭ Minor',
  B: 'B Major',
  BM: 'B Minor',
};

export const SONG_KEY_OPTIONS = SONG_KEYS.map((value) => ({
  value,
  label: SONG_KEY_LABELS[value],
}));

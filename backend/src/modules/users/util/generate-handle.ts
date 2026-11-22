import { randomInt } from 'node:crypto';

/** 랜덤 고유 ID에 쓰는 글자. HANDLE_PATTERN의 부분집합이며, 대소문자 무시 중복을 피하려고 소문자만 쓴다 */
const GENERATED_HANDLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** 랜덤 고유 ID 길이. 36^8 ≈ 2.8조라 겹칠 일이 거의 없다 */
const GENERATED_HANDLE_LENGTH = 8;

/** 겹친 후보를 다시 뽑는 최대 횟수 */
export const GENERATED_HANDLE_MAX_ATTEMPTS = 5;

/**
 * 소문자·숫자 8자 고유 ID 후보를 만든다.
 *
 * @returns {string} 랜덤 고유 ID 후보
 */
export function generateRandomHandle(): string {
  let handle = '';
  for (let i = 0; i < GENERATED_HANDLE_LENGTH; i++) {
    handle += GENERATED_HANDLE_ALPHABET[randomInt(GENERATED_HANDLE_ALPHABET.length)];
  }
  return handle;
}

/**
 * 아무도 쓰지 않는 랜덤 고유 ID를 고른다.
 * 트랜잭션 안에서는 유니크 위반 뒤 재시도가 불가능해(Postgres가 트랜잭션을 중단한다) 저장 전에 조회로 확인한다.
 *
 * @param {(handle: string) => Promise<boolean>} isTaken - 대소문자를 무시하고 이미 쓰이는지 확인하는 함수
 * @returns {Promise<string>} 쓰이지 않은 랜덤 고유 ID
 * @throws {Error} 최대 횟수 안에 고르지 못한 경우
 */
export async function pickAvailableHandle(isTaken: (handle: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < GENERATED_HANDLE_MAX_ATTEMPTS; attempt++) {
    const candidate = generateRandomHandle();
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }
  throw new Error('랜덤 고유 ID를 고르지 못했습니다.');
}

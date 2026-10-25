/** 닉네임 최대 글자 수. DB `user_profiles.nickname VARCHAR(20)`과 맞춘다. */
export const NICKNAME_MAX_LENGTH = 20;

/**
 * 닉네임 길이를 코드 포인트 단위로 검사하는 패턴. class-validator의 MinLength·MaxLength는
 * 서로게이트 쌍과 변형 선택자(U+FE0F 등)를 빼고 세서, `'❤️'.repeat(11)`처럼 DB VARCHAR(20)를 넘는 값이 통과한다.
 */
export const nicknameLengthPattern = (minLength: number) => new RegExp(`^.{${minLength},${NICKNAME_MAX_LENGTH}}$`, 'su');

/** 고유 ID(@handle) 형식. 영문 대소문자·숫자·밑줄 4~8자. DB `user_profiles.handle VARCHAR(8)`과 맞춘다. */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{4,8}$/;

export const HANDLE_PATTERN_MESSAGE = '고유 ID는 영문 대소문자·숫자·밑줄(_)만 사용해 4~8자로 입력해 주세요.';

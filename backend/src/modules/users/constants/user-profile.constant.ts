/** 닉네임 최대 글자 수. DB `user_profiles.nickname VARCHAR(20)`과 맞춘다. */
export const NICKNAME_MAX_LENGTH = 20;

/** 고유 ID(@handle) 형식. 영문 대소문자·숫자·밑줄 4~8자. DB `user_profiles.handle VARCHAR(8)`과 맞춘다. */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{4,8}$/;

export const HANDLE_PATTERN_MESSAGE = '고유 ID는 영문 대소문자·숫자·밑줄(_)만 사용해 4~8자로 입력해 주세요.';

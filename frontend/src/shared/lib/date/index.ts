// src/shared/lib/date/index.ts

/**
 * 주어진 날짜가 속한 주의 월요일(시작일)에 해당하는 새로운 Date 객체를 반환합니다.
 * 주는 월요일(1)부터 일요일(0 또는 7)까지로 정의됩니다.
 */
export const getStartOfWeek = (date: Date): Date => {
  const newDate = new Date(date);

  // getDay()는 일요일 0, 월요일 1 ... 토요일 6을 반환합니다
  const day = newDate.getDay();
  // 일요일(0)을 7로 취급하여 월요일을 주의 시작 기준으로 계산합니다
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);

  // 일광 절약 시간제(DST) 등 시간 관련 이슈를 방지하기 위해 시, 분, 초, 밀리초를 0으로 초기화합니다
  newDate.setHours(0, 0, 0, 0);
  newDate.setDate(diff);

  return newDate;
};

/**
 * 주어진 시작 날짜로부터 7일간(월~일)의 Date 객체 배열을 반환합니다.
 */
export const getWeekDays = (startDate: Date): Date[] => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
};

/**
 * 주어진 날짜에 특정 일(days) 수만큼을 더하거나 뺀 새로운 Date 객체를 반환합니다.
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * 로컬 시간대 기준으로 날짜를 "YYYY-MM-DD" 문자열로 변환합니다.
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 해당 날짜의 로컬 자정(00:00:00.000)을 가리키는 새 Date를 반환합니다.
 */
export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * 해당 날짜의 로컬 하루 끝(23:59:59.999)을 가리키는 새 Date를 반환합니다.
 */
export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * 시작일과 종료일을 받아 "YYYY년 M월 D일 ~ [M월] D일" 포맷의 문자열을 반환합니다.
 */
export const formatWeekRange = (startDate: Date, endDate: Date): string => {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  if (startYear !== endYear) {
    return `${startYear}년 ${startMonth}월 ${startDay}일 ~ ${endYear}년 ${endMonth}월 ${endDay}일`;
  }

  if (startMonth !== endMonth) {
    return `${startYear}년 ${startMonth}월 ${startDay}일 ~ ${endMonth}월 ${endDay}일`;
  }

  return `${startYear}년 ${startMonth}월 ${startDay}일 ~ ${endDay}일`;
};

/**
 * ISO 문자열을 "YYYY.MM. DD" 형식으로 변환합니다. 값이 없으면 "-".
 */
export const formatDotDate = (iso: string | null): string => {
  if (!iso) return '-';
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}. ${day}`;
};

/**
 * ISO 문자열을 "HH:mm"(24시간) 형식으로 변환합니다. 값이 없으면 빈 문자열.
 */
export const formatClockTime = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

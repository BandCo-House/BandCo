export interface WheelDate {
  /** 연도 (예: 2026) */
  year: number;
  /** 월 (1~12) */
  month: number;
  /** 일 (1~31) */
  day: number;
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** WheelDate → 'YYYY-MM-DD' */
export const toDateString = ({ year, month, day }: WheelDate): string =>
  `${year}-${pad2(month)}-${pad2(day)}`;

/** Date → WheelDate */
export const toWheelDate = (date: Date): WheelDate => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

import { bandHandlers } from './band/handlers';
import { scheduleHandlers } from './schedule/handlers';

export const handlers = [
  ...bandHandlers,
  ...scheduleHandlers,
  // 이후 추가될 타 도메인 핸들러들
];

import { assistantHandlers } from './assistant/handlers';
import { authHandlers } from './auth/handlers';
import { bandHandlers } from './band/handlers';
import { inviteHandlers } from './invite/handlers';
import { linkHandlers } from './link/handlers';
import { memberHandlers } from './member/handlers';
import { noticeHandlers } from './notice/handlers';
import { notificationHandlers } from './notification/handlers';
import { placeHandlers } from './place/handlers';
import { profileHandlers } from './profile/handlers';
import { scheduleHandlers } from './schedule/handlers';
import { songHandlers } from './song/handlers';
import { spaceHandlers } from './space/handlers';
import { storageHandlers } from './storage/handlers';
import { teamHandlers } from './team/handlers';
import { skillHandlers } from './skill/handlers';
import { genreHandlers } from './genre/handlers';

export const handlers = [
  ...assistantHandlers,
  ...authHandlers,
  ...bandHandlers,
  ...inviteHandlers,
  ...linkHandlers,
  ...memberHandlers,
  ...noticeHandlers,
  ...notificationHandlers,
  ...placeHandlers,
  ...profileHandlers,
  ...scheduleHandlers,
  ...songHandlers,
  ...spaceHandlers,
  ...storageHandlers,
  ...teamHandlers,
  ...skillHandlers,
  ...genreHandlers,
];

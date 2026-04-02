import { bandHandlers } from './band/handlers';
import { inviteHandlers } from './invite/handlers';
import { notificationHandlers } from './notification/handlers';
import { profileHandlers } from './profile/handlers';
import { scheduleHandlers } from './schedule/handlers';
import { songHandlers } from './song/handlers';
import { songTeamHandlers } from './song-team/handlers';
import { spaceHandlers } from './space/handlers';

export const handlers = [
  ...bandHandlers,
  ...inviteHandlers,
  ...notificationHandlers,
  ...profileHandlers,
  ...scheduleHandlers,
  ...songHandlers,
  ...songTeamHandlers,
  ...spaceHandlers,
];

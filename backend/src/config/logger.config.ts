import type { WinstonModuleOptions } from 'nest-winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { format, transports } from 'winston';

export function createWinstonLoggerOptions(): WinstonModuleOptions {
  const consoleFormat =
    process.env.NODE_ENV === 'production'
      ? format.combine(format.timestamp(), format.json())
      : format.combine(
          format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike('jamplay-backend', {
            prettyPrint: true,
          }),
        );

  return {
    level: 'info',
    transports: [
      new transports.Console({
        format: consoleFormat,
      }),
    ],
  };
}

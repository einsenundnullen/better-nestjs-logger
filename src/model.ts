import { LogLevel } from '@nestjs/common';

export const PARAMS_PROVIDER_TOKEN = 'better-logger-config';

export type PreparedMessageArgs = {
  message: string;
  context: string;
  args: any[];
};

export type PreparedMetaInfo = {
  pid: string;
  timestamp: string;
};

export type BetterLoggerConfig = {
  json?: boolean;
  logLevel?: LogLevel[];
};

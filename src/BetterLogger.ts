import { ConsoleLogger, Inject, LogLevel } from '@nestjs/common';
import util from 'util';
import {
  BetterLoggerConfig,
  PARAMS_PROVIDER_TOKEN,
  PreparedMessageArgs,
  PreparedMetaInfo,
} from './model';

export class BetterLogger extends ConsoleLogger {
  private readonly outputAsJson;

  constructor(@Inject(PARAMS_PROVIDER_TOKEN) options?: BetterLoggerConfig) {
    super();
    this.outputAsJson = options?.json;
  }

  error(...args: any[]) {
    const finalArgs = this.prepareArgs(args);
    super.error(finalArgs);
  }

  warn(...args: any[]) {
    const finalArgs = this.prepareArgs(args);
    super.warn(finalArgs);
  }

  log(...args: any[]) {
    const finalArgs = this.prepareArgs(args);
    super.log(finalArgs);
  }

  debug(...args: any[]) {
    const finalArgs = this.prepareArgs(args);
    super.debug(finalArgs);
  }

  verbose(...args: any[]) {
    const finalArgs = this.prepareArgs(args);
    super.verbose(finalArgs);
  }

  private format(args: PreparedMessageArgs) {
    return `[${args.context}]: ${args.message} ${JSON.stringify(
      args.args,
      null,
      this.outputAsJson ? 0 : 2,
    )}`;
  }

  private prepareArgs(args: any[] = []): PreparedMessageArgs {
    const context = args.pop();
    const message = args.shift();

    return {
      message,
      context,
      args,
    };
  }

  private prepareMetaInfo(): PreparedMetaInfo {
    return {
      pid: String(process.pid),
      timestamp: new Date().toISOString(),
    };
  }

  formatMessageJson(
    logLevel: LogLevel,
    message: PreparedMessageArgs,
    metaInfo: PreparedMetaInfo,
  ) {
    return `${JSON.stringify({
      severity: logLevel,
      message: message.message,
      payload: message.args,
      context: message.context,
      pid: metaInfo.pid,
      timestamp: metaInfo.timestamp,
    })}\n`;
  }

  private safeStringify(value?: unknown) {
    if (!value) {
      return '';
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      try {
        return JSON.stringify(util.inspect(value));
      } catch (error) {
        return String(value);
      }
    }
  }

  formatMessageString(
    logLevel: LogLevel,
    message: PreparedMessageArgs,
    metaInfo: PreparedMetaInfo,
  ) {
    const contextMessage = message.context ? `[${message.context}] ` : '';
    const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');

    const stringMessage = String(
      [
        message.message || '',
        message.args && message.args.length > 0
          ? message.args.map(this.safeStringify)
          : '',
      ]
        .flat()
        .map((s) => String(s).trim())
        .filter(Boolean)
        .join(' '),
    ).trim();

    return this.formatMessage(
      logLevel,
      stringMessage,
      `(${metaInfo.pid}) `,
      formattedLogLevel,
      contextMessage,
      '',
    );
  }

  protected printMessages(
    messages: PreparedMessageArgs[],
    // ignore this context. we got it already
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ) {
    messages.forEach((message) => {
      const metaInfo = this.prepareMetaInfo();
      const formatedMessage = this.outputAsJson
        ? this.formatMessageJson(logLevel, message, metaInfo)
        : this.formatMessageString(logLevel, message, metaInfo);

      process[writeStreamType ?? 'stdout'].write(formatedMessage);
    });
  }
}

import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'http';
import { getReasonPhrase } from 'http-status-codes';
import { BetterLoggerConfig, PARAMS_PROVIDER_TOKEN } from './model';

type HRTime = [number, number];

const NS_PER_SEC = 1e9;
const NS_TO_MS = 1e6;

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);
  private readonly logHeaders: boolean;
  private readonly redactedHeaders: string[];
  private readonly getCustomFields;

  constructor(@Inject(PARAMS_PROVIDER_TOKEN) config?: BetterLoggerConfig) {
    this.logHeaders = config?.requestMiddleware?.headers ?? false;
    this.redactedHeaders = config?.requestMiddleware?.redactedHeaders ?? [];
    this.getCustomFields = config?.getCustomFields;
  }

  private prepareHeaders(headers: IncomingHttpHeaders) {
    const reqHeaderNames = Object.keys(headers).map((k) =>
      String(k).toLowerCase(),
    );
    const headersToRedact = this.redactedHeaders.filter((h) =>
      reqHeaderNames.includes(String(h).toLowerCase()),
    );
    return {
      ...headers,
      ...headersToRedact.reduce(
        (prev, curr) => ({
          ...prev,
          [curr]: '[Redacted]',
        }),
        {},
      ),
    };
  }

  private getDurationMs(startTime: HRTime): number {
    const diff = process.hrtime(startTime);
    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
  }

  private getCustomFieldData(request: Request, response: Response) {
    try {
      if (this.getCustomFields) {
        const data = this.getCustomFields(request, response);
        if (!data) {
          return {};
        }
        return data;
      }
    } catch (error) {
      console.error('Error getting trace context', error);
    }
    return {};
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl, headers } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = process.hrtime();

    response.on('close', async () => {
      const { statusCode } = response;

      const reason = getReasonPhrase(statusCode);

      const durationMs = this.getDurationMs(startTime).toFixed(2);

      const message = [
        method,
        originalUrl,
        '=>',
        statusCode,
        reason,
        `(${durationMs}ms)`,
      ]
        .filter(Boolean)
        .join(' ');

      const headerInfo = this.logHeaders
        ? {
            headers: this.prepareHeaders(headers),
          }
        : {};

      const customFieldData = this.getCustomFieldData(request, response);

      const requestInfo = {
        remoteIp: ip,
        requestUrl: originalUrl,
        status: statusCode,
        requestMethod: method,
        duration: durationMs,
        userAgent,
        ...headerInfo,
        ...customFieldData,
      };

      if (statusCode <= 399) {
        this.logger.log(message, requestInfo);
        return;
      }

      this.logger.error(message, requestInfo);
    });

    next();
  }
}

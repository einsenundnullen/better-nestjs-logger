import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'http';
import { getReasonPhrase } from 'http-status-codes';
import { BetterLoggerConfig, PARAMS_PROVIDER_TOKEN } from './model';
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);
  private readonly logHeaders: boolean;
  private readonly redactedHeaders: string[];

  constructor(@Inject(PARAMS_PROVIDER_TOKEN) config?: BetterLoggerConfig) {
    this.logHeaders = config?.requestMiddleware?.headers || false;
    this.redactedHeaders = config?.requestMiddleware?.redactedHeaders || [];
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

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl, headers } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('close', () => {
      const { statusCode } = response;

      const reason = getReasonPhrase(statusCode);

      const message = [method, originalUrl, '=>', statusCode, reason]
        .filter(Boolean)
        .join(' ');

      const headerInfo = this.logHeaders
        ? {
            headers: this.prepareHeaders(headers),
          }
        : {};

      const requestInfo = {
        remoteIp: ip,
        requestUrl: originalUrl,
        status: statusCode,
        requestMethod: method,
        userAgent,
        ...headerInfo,
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

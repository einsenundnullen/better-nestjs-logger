import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('Http');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('close', () => {
      const { statusCode } = response;

      const message = [method, originalUrl, '=>', statusCode]
        .filter(Boolean)
        .join(' ');
      const metaData = {
        remoteIp: ip,
        requestUrl: originalUrl,
        status: statusCode,
        requestMethod: method,
        userAgent,
      };

      if (statusCode <= 299) {
        this.logger.log(message, metaData);
        return;
      }

      if (statusCode) {
        this.logger.error(message, metaData);
        return;
      }
    });

    next();
  }
}

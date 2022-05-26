import { Module } from '@nestjs/common';
import {
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common/interfaces';
import { BetterLogger } from './BetterLogger';
import { BetterLoggerConfig, PARAMS_PROVIDER_TOKEN } from './model';
import { RequestLoggerMiddleware } from './RequestLoggerMiddleware';

@Module({})
export class BetterLoggerModule implements NestModule {
  static forRoot(options?: BetterLoggerConfig): DynamicModule {
    return {
      module: BetterLoggerModule,
      providers: [
        {
          provide: PARAMS_PROVIDER_TOKEN,
          useValue: options,
        },
        BetterLogger,
      ],
      exports: [BetterLogger],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

import { Module } from '@nestjs/common';
import { DynamicModule, MiddlewareConsumer } from '@nestjs/common/interfaces';
import { BetterLogger } from './BetterLogger';
import { RequestLoggerMiddleware } from './RequestLoggerMiddleware';
import { BetterLoggerConfig, PARAMS_PROVIDER_TOKEN } from './model';

@Module({})
export class BetterLoggerModule {
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

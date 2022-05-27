# @einsenundnullen/better-nestjs-logger

This is just a simple logger for NestJS. It prints to console and can output plain strings and structured JSON.

## Why is it better than the default logger?

Compared to the classic `console.log` statement it is not possible to pass additional data to the default NestJS logger instance. Better logger aims to provide a more coherent logging experience while still being able to print nice log lines for local development as well as JSON output for cloud environments.

BetterLogger focuses on less configuration and more convention and therefore allows only minimal configuration compared to other logging libraries.

### Features

- Provides simple logs for local development and JSON output if needed
- Provides Request Logging out of the box
- Can log any kind of data (even circular objects like express.Request)
- Easy to set up

### Limitations

- Only console logging

## Getting started

To get started quickly follow these steps:

### 1. Install the logger package

```
npm i @einsenundnullen/better-nestjs-logger
```

### 2. Configure BetterLoggerModule

```typescript
import { BetterLoggerModule } from '@einsenundnullen/better-nestjs-logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BetterLoggerModule.forRoot({
      // Enable JSON output
      json: true,
      // Set desired log levels
      logLevel: ['log', 'debug', 'error', 'verbose', 'warn'],
      // Set options for the request middleware
      requestMiddleware: {
        // enable header logging (off by default)
        headers: true,
        // set headers that should be redacted
        redactedHeaders: ['authorization', 'cookie'],
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 3. Override the default Logger provider

```typescript
import { BetterLogger } from '@einsenundnullen/better-nestjs-logger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs ensures all logs get sent to the correct logger
    bufferLogs: true,
  });

  app.useLogger(app.get(BetterLogger));

  await app.listen(8080);
};
bootstrap();
```

### 4. Log all the stuff!

The logger is imported the same way as the NestJS logger...

```typescript
// The logger name will be properly propagated (yay!)
private readonly logger = new Logger(MyService.name);
```

... but can now handle all kinds of log data

```typescript
this.logger.verbose('Something happened!');

this.logger.log('Something happened!', {
  usefulvalue: 'i am useful information',
});

this.logger.debug('Something happened!', {
  usefulvalue: 'i am useful information',
});

this.logger.error(
  'Something bad happened!',
  {
    usefulvalue: 'i am useful information',
  },
  some_error,
);

this.logger.warn(
  'Something happened!',
  {
    usefulvalue: 'i am useful information',
  },
  ['some item', 'another item'],
);
```

### 5. Profit

Leave a like or an issue if you enjoy this package!

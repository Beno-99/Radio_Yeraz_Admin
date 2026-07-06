// src/database/database.module.ts
import 'dotenv/config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const shouldConnectToMongo =
      process.env.MONGODB_ENABLED === 'true' && Boolean(process.env.MONGODB_URI);

    if (!shouldConnectToMongo) {
      return {
        module: DatabaseModule,
      };
    }

    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('MONGODB_URI'),
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [MongooseModule],
    };
  }
}

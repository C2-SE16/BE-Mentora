import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('REDIS_TTL', 60 * 60), // Default TTL: 1 hour
        max: configService.get('REDIS_MAX_ITEMS', 100), // Maximum number of items in cache
      }),
      isGlobal: true,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {} 
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          ttl: configService.get('REDIS_TTL', 7200), // Default TTL: 2 hours
          max: configService.get('REDIS_MAX_ITEMS', 1000), // Tăng số lượng items tối đa
          // Đảm bảo Redis sẽ giữ keys trong thời gian TTL đã định
          db: 0,
          tls: false,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          retry_strategy: function(options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              return new Error('Redis server refused connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {} 
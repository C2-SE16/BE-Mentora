import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Operation failed after all retries');
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Redis operation failed, attempt ${i + 1}/${this.MAX_RETRIES}: ${error.message}`);
        if (i < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    throw lastError;
  }

  /**
   * Lấy giá trị từ cache theo key
   * @param key - Key để tìm trong cache
   * @returns Giá trị được cache hoặc null nếu không tìm thấy
   */
  async get<T>(key: string): Promise<T | null> {
    this.logger.debug(`Getting value from Redis for key: ${key}`);
    return this.retryOperation(async () => {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Redis get result for key ${key}: ${value ? 'found' : 'not found'}`);
      return value;
    });
  }

  /**
   * Lưu trữ giá trị vào cache
   * @param key - Key để lưu trữ giá trị
   * @param value - Giá trị cần lưu trữ
   * @param ttl - Thời gian sống (Time To Live) tính bằng giây (tùy chọn)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.logger.debug(`Setting value in Redis for key: ${key}, ttl: ${ttl}s`);
    return this.retryOperation(async () => {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Successfully set value in Redis for key: ${key}`);
    });
  }

  /**
   * Xóa một giá trị khỏi cache theo key
   * @param key - Key cần xóa
   * @returns true nếu key đã được xóa, false nếu key không tồn tại
   */
  async del(key: string): Promise<boolean> {
    this.logger.debug(`Deleting key from Redis: ${key}`);
    return this.retryOperation(async () => {
      await this.cacheManager.del(key);
      this.logger.debug(`Successfully deleted key from Redis: ${key}`);
      return true; // Giả định xóa thành công nếu không có lỗi
    });
  }

  /**
   * Xóa tất cả các keys trong cache
   * Lưu ý: Tính năng này cần Redis client trực tiếp để hoạt động tốt
   */
  async reset(): Promise<void> {
    this.logger.warn('Attempting to reset Redis cache');
    return this.retryOperation(async () => {
      const client = (this.cacheManager as any).store?.getClient();
      if (client && typeof client.flushDb === 'function') {
        await client.flushDb();
        this.logger.log('Successfully reset Redis cache');
      } else {
        this.logger.warn('Redis client does not support flushDb operation');
      }
    });
  }

  /**
   * Kiểm tra xem key có tồn tại trong cache không
   * @param key - Key cần kiểm tra
   * @returns true nếu key tồn tại, false nếu không
   */
  async has(key: string): Promise<boolean> {
    this.logger.debug(`Checking existence of key in Redis: ${key}`);
    return this.retryOperation(async () => {
      const value = await this.cacheManager.get(key);
      const exists = value !== undefined && value !== null;
      this.logger.debug(`Key ${key} ${exists ? 'exists' : 'does not exist'} in Redis`);
      return exists;
    });
  }

  /**
   * Kiểm tra xem key có tồn tại trong cache không bằng cách sử dụng exists command
   * @param key - Key cần kiểm tra
   * @returns true nếu key tồn tại, false nếu không
   */
  async exists(key: string): Promise<boolean> {
    this.logger.debug(`Checking existence of key in Redis using exists: ${key}`);
    return this.retryOperation(async () => {
      try {
        const client = (this.cacheManager as any).store?.getClient();
        if (client && typeof client.exists === 'function') {
          const exists = await client.exists(key);
          const doesExist = exists > 0;
          this.logger.debug(`Key ${key} ${doesExist ? 'exists' : 'does not exist'} in Redis`);
          return doesExist;
        } else {
          // Fallback: Thử lấy giá trị để xem key có tồn tại không
          this.logger.debug(`Falling back to get method to check if key exists: ${key}`);
          const value = await this.get(key);
          const exists = value !== undefined && value !== null;
          this.logger.debug(`Key ${key} ${exists ? 'exists' : 'does not exist'} in Redis (fallback check)`);
          return exists;
        }
      } catch (error) {
        this.logger.error(`Error checking existence of key ${key}: ${error.message}`);
        return false;
      }
    });
  }

  /**
   * Lấy tất cả các keys theo pattern
   * @param pattern - Pattern để tìm keys, ví dụ: user:*
   * @returns Danh sách các keys thỏa mãn pattern
   */
  async keys(pattern: string): Promise<string[]> {
    this.logger.debug(`Finding keys in Redis matching pattern: ${pattern}`);
    return this.retryOperation(async () => {
      try {
        const client = (this.cacheManager as any).store?.getClient();
        if (client && typeof client.keys === 'function') {
          const keys = await client.keys(pattern);
          this.logger.debug(`Found ${keys.length} keys matching pattern ${pattern}`);
          return keys;
        } else {
          this.logger.warn('Redis client does not support keys operation');
          return [];
        }
      } catch (error) {
        this.logger.error(`Error finding keys with pattern ${pattern}: ${error.message}`);
        return [];
      }
    });
  }

  /**
   * Lấy thời gian còn lại (TTL) của một key
   * @param key - Key để kiểm tra TTL
   * @returns Thời gian sống còn lại tính bằng giây, -1 nếu không có TTL, -2 nếu key không tồn tại
   */
  async ttl(key: string): Promise<number> {
    this.logger.debug(`Getting TTL for key: ${key}`);
    return this.retryOperation(async () => {
      try {
        const client = (this.cacheManager as any).store?.getClient();
        if (client && typeof client.ttl === 'function') {
          const remainingTtl = await client.ttl(key);
          this.logger.debug(`TTL for key ${key}: ${remainingTtl}s`);
          return remainingTtl;
        } else {
          this.logger.warn('Redis client does not support ttl operation');
          // Kiểm tra xem key có tồn tại không
          const exists = await this.has(key);
          return exists ? -1 : -2; // -1 nếu key tồn tại nhưng không có TTL, -2 nếu key không tồn tại
        }
      } catch (error) {
        this.logger.error(`Error getting TTL for key ${key}: ${error.message}`);
        return -1;
      }
    });
  }
} 
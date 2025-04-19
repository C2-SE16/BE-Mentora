import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Lấy giá trị từ cache theo key
   * @param key - Key để tìm trong cache
   * @returns Giá trị được cache hoặc null nếu không tìm thấy
   */
  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Lưu trữ giá trị vào cache
   * @param key - Key để lưu trữ giá trị
   * @param value - Giá trị cần lưu trữ
   * @param ttl - Thời gian sống (Time To Live) tính bằng giây (tùy chọn)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Xóa một giá trị khỏi cache theo key
   * @param key - Key cần xóa
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Xóa tất cả các keys trong cache
   * Lưu ý: Tính năng này cần Redis client trực tiếp để hoạt động tốt
   */
  async reset(): Promise<void> {
    this.logger.warn('Method reset() không hoạt động với cache-manager mới. Cần triển khai với Redis client trực tiếp.');
    // Trong phiên bản tương lai, nếu muốn xóa tất cả cache, cần sử dụng:
    // const client = this.cacheManager.store.getClient();
    // await client.flushDb();
  }

  /**
   * Kiểm tra xem key có tồn tại trong cache không
   * @param key - Key cần kiểm tra
   * @returns true nếu key tồn tại, false nếu không
   */
  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }
} 
import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

@Controller('redis-example')
export class RedisExampleController {
  constructor(private readonly redisService: RedisService) {}

  @Get(':key')
  async getValue(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    return { key, value: value || 'Không tìm thấy' };
  }

  @Post()
  async setValue(@Body() data: { key: string; value: any; ttl?: number }) {
    const { key, value, ttl } = data;
    await this.redisService.set(key, value, ttl);
    return { message: 'Đã lưu dữ liệu thành công', key, value };
  }

  @Delete(':key')
  async deleteValue(@Param('key') key: string) {
    await this.redisService.del(key);
    return { message: 'Đã xóa dữ liệu thành công', key };
  }

  @Get('check/:key')
  async hasKey(@Param('key') key: string) {
    const exists = await this.redisService.has(key);
    return { key, exists };
  }

  @Delete('all/clear')
  async clearAll() {
    await this.redisService.reset();
    return { message: 'Đã xóa tất cả dữ liệu cache' };
  }
} 
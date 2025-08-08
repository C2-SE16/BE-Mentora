import { Module } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { CartController } from '../controllers/cart.controller';
import { RedisModule } from '../cache/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VoucherService } from '../services/voucher.service';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [CartController],
  providers: [CartService, VoucherService],
  exports: [CartService],
})
export class CartModule {} 
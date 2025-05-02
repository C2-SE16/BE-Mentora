import { Module } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { CartController } from '../controllers/cart.controller';
import { RedisModule } from '../cache/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {} 
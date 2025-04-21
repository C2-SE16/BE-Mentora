import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { AddToCartDto, RemoveFromCartDto, GetCartDto } from '../dto/cart.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @GetUser('userId') userId: string,
  ) {
    return this.cartService.addToCart({
      ...addToCartDto,
      userId,
    });
  }

  @Delete('remove')
  async removeFromCart(
    @Body() removeFromCartDto: RemoveFromCartDto,
    @GetUser('userId') userId: string,
  ) {
    return this.cartService.removeFromCart({
      ...removeFromCartDto,
      userId,
    });
  }

  @Get()
  async getCart(@GetUser('userId') userId: string) {
    return this.cartService.getCart({ userId });
  }

  @Delete('clear')
  async clearCart(@GetUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
} 
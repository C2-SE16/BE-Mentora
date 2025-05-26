import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { AddToCartDto, RemoveFromCartDto, GetCartDto, SelectCartItemsDto, UpdateCartItemStatusDto } from '../dto/cart.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { UserId } from '../decorators/userid.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Giỏ hàng')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ summary: 'Thêm khóa học vào giỏ hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'ID của khóa học cần thêm vào giỏ hàng'
        }
      },
      required: ['courseId']
    }
  })
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @GetUser('userId') userId: string,
    // @UserId() userId: string,
  ) {
    return this.cartService.addToCart(addToCartDto, userId);
    // return this.cartService.addToCart({
    //   ...addToCartDto,
    //   userId,
    // });
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Xóa khóa học khỏi giỏ hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'ID của khóa học cần xóa khỏi giỏ hàng'
        }
      },
      required: ['courseId']
    }
  })
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
  @ApiOperation({ summary: 'Lấy thông tin giỏ hàng với trạng thái đã chọn/chưa chọn' })
  async getCart(@GetUser('userId') userId: string) {
    return this.cartService.getCart({ userId });
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  async clearCart(@GetUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('select')
  @ApiOperation({ 
    summary: 'Chọn các khóa học cụ thể để thanh toán', 
    description: 'Cập nhật trạng thái "selected" cho các khóa học được chọn, và đặt các khóa học khác về trạng thái "unselected". UserId được lấy từ JWT token.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        selectedCourseIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          example: ['550e8400-e29b-41d4-a716-446655440000', '661f9500-e29b-41d4-a716-446655440001'],
          description: 'Danh sách ID các khóa học được chọn để thanh toán'
        }
      },
      required: ['selectedCourseIds']
    }
  })
  async selectCartItems(
    @Body() selectCartItemsDto: SelectCartItemsDto,
    @GetUser('userId') userId: string,
  ) {
    return this.cartService.selectCartItems({
      ...selectCartItemsDto,
      userId,
    });
  }

  @Post('update-status')
  @ApiOperation({ 
    summary: 'Cập nhật trạng thái của nhiều khóa học cùng lúc', 
    description: 'Cập nhật trạng thái "selected" cho từng khóa học cụ thể. UserId được lấy từ JWT token.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: {
                type: 'string',
                example: '550e8400-e29b-41d4-a716-446655440000'
              },
              selected: {
                type: 'boolean',
                example: true
              }
            }
          },
          example: [
            {
              courseId: '550e8400-e29b-41d4-a716-446655440000', 
              selected: true
            },
            {
              courseId: '661f9500-e29b-41d4-a716-446655440001', 
              selected: false
            }
          ],
          description: 'Danh sách các khóa học và trạng thái tương ứng'
        }
      },
      required: ['items']
    }
  })
  async updateCartItemStatus(
    @Body() updateCartItemStatusDto: UpdateCartItemStatusDto,
    @GetUser('userId') userId: string,
  ) {
    return this.cartService.updateCartItemStatus({
      ...updateCartItemStatusDto,
      userId,
    });
  }

  @Get('selected')
  @ApiOperation({ summary: 'Lấy danh sách khóa học đã chọn để thanh toán' })
  async getSelectedCartItems(@GetUser('userId') userId: string) {
    return this.cartService.getSelectedCartItems({ userId });
  }

  @Delete('selected/clear')
  @ApiOperation({ summary: 'Đặt tất cả khóa học về trạng thái chưa chọn (unselected)' })
  async clearSelectedCartItems(@GetUser('userId') userId: string) {
    return this.cartService.clearSelectedCartItems(userId);
  }

  @Post('apply-voucher')
  async applyVoucherToCart(
    @Body() data: { code: string },
    @GetUser('userId') userId: string,
  ) {
    return this.cartService.applyVoucherToCart(userId, data.code);
  }

  // @Delete('remove-voucher')
  // async removeVoucherFromCart(@GetUser('userId') userId: string) {
  //   return this.cartService.removeVoucherFromCart(userId);
  // }
}

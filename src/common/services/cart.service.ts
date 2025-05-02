import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, RemoveFromCartDto, GetCartDto } from '../dto/cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly CART_PREFIX = 'cart:';

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  private getCartKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  async addToCart(addToCartDto: AddToCartDto) {
    const { userId, courseId } = addToCartDto;
    const cartKey = this.getCartKey(userId);

    // Kiểm tra khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new Error('Khóa học không tồn tại');
    }

    // Lấy giỏ hàng hiện tại
    const currentCart = await this.redisService.get<string[]>(cartKey) || [];
    
    // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
    if (currentCart.includes(courseId)) {
      throw new Error('Khóa học đã có trong giỏ hàng');
    }

    // Thêm khóa học vào giỏ hàng
    currentCart.push(courseId);
    await this.redisService.set(cartKey, currentCart);

    return {
      message: 'Đã thêm khóa học vào giỏ hàng thành công',
      courseId,
    };
  }

  async removeFromCart(removeFromCartDto: RemoveFromCartDto) {
    const { userId, courseId } = removeFromCartDto;
    const cartKey = this.getCartKey(userId);

    // Lấy giỏ hàng hiện tại
    const currentCart = await this.redisService.get<string[]>(cartKey) || [];
    
    // Lọc bỏ khóa học khỏi giỏ hàng
    const updatedCart = currentCart.filter(id => id !== courseId);
    
    // Lưu giỏ hàng mới
    await this.redisService.set(cartKey, updatedCart);

    return {
      message: 'Đã xóa khóa học khỏi giỏ hàng thành công',
      courseId,
    };
  }

  async getCart(getCartDto: GetCartDto) {
    const { userId } = getCartDto;
    const cartKey = this.getCartKey(userId);

    // Lấy danh sách khóa học trong giỏ hàng
    const courseIds = await this.redisService.get<string[]>(cartKey) || [];

    // Lấy thông tin chi tiết của các khóa học
    const courses = await this.prismaService.tbl_courses.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
        tbl_instructors: true,
      },
    });

    return {
      courses,
      totalItems: courses.length,
    };
  }

  async clearCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    await this.redisService.del(cartKey);
    return {
      message: 'Đã xóa giỏ hàng thành công',
    };
  }
} 
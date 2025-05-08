import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddToCartDto,
  RemoveFromCartDto,
  GetCartDto,
  AppliedVoucherInCart,
} from '../dto/cart.dto';
import { VoucherService } from './voucher.service';
import { VoucherInfo } from '../dto/voucher.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly CART_PREFIX = 'cart:';

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly voucherService: VoucherService,
  ) {}

  private getCartKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  async removeFromCart(removeFromCartDto: RemoveFromCartDto) {
    const { userId, courseId } = removeFromCartDto;
    const cartKey = this.getCartKey(userId);

    // Lấy giỏ hàng hiện tại
    const currentCart = (await this.redisService.get<string[]>(cartKey)) || [];

    // Lọc bỏ khóa học khỏi giỏ hàng
    const updatedCart = currentCart.filter((id) => id !== courseId);

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
    console.log('cartKey::', cartKey);
    // Lấy danh sách khóa học trong giỏ hàng
    const courseIds = (await this.redisService.get<string[]>(cartKey)) || [];
    console.log('courseIds::', courseIds);
    // Lấy thông tin voucher đã áp dụng (nếu có)
    const appliedVoucher = await this.redisService.get<AppliedVoucherInCart>(
      `${cartKey}:voucher`,
    );

    // Nếu không có khóa học nào trong giỏ hàng
    if (courseIds.length === 0) {
      return {
        courses: [],
        totalItems: 0,
        appliedVoucher: null,
        pricing: {
          totalOriginalPrice: 0,
          totalDiscountAmount: 0,
          totalFinalPrice: 0,
        },
      };
    }

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

    // Tính toán giá sau khi áp dụng voucher
    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    let totalFinalPrice = 0;

    const coursesWithPricing = courses.map((course) => {
      const originalPrice = Number(course.price);
      totalOriginalPrice += originalPrice;

      let discountAmount = 0;
      let finalPrice = originalPrice;

      // Kiểm tra appliedVoucher có tồn tại không trước khi truy cập
      if (appliedVoucher && appliedVoucher.discountedCourses) {
        const discountInfo = appliedVoucher.discountedCourses.find(
          (c) => c.courseId === course.courseId,
        );

        if (discountInfo) {
          discountAmount = discountInfo.discountAmount;
          finalPrice = discountInfo.finalPrice;
          totalDiscountAmount += discountAmount;
        }
      }

      totalFinalPrice += finalPrice;

      return {
        ...course,
        originalPrice,
        discountAmount,
        finalPrice: Math.round(finalPrice * 1000) / 1000,
      };
    });

    return {
      courses: coursesWithPricing,
      totalItems: courses.length,
      appliedVoucher: appliedVoucher
        ? {
            code: appliedVoucher.code,
            voucherId: appliedVoucher.voucherId,
            totalDiscount: totalDiscountAmount,
          }
        : null,
      pricing: {
        totalOriginalPrice,
        totalDiscountAmount,
        totalFinalPrice: Math.round(totalFinalPrice * 1000) / 1000,
      },
    };
  }

  async addToCart(addToCartDto: AddToCartDto, userId: string) {
    const { courseId } = addToCartDto;
    const cartKey = this.getCartKey(userId);

    // Kiểm tra khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new Error('Khóa học không tồn tại');
    }

    // Lấy giỏ hàng hiện tại
    const currentCart = (await this.redisService.get<string[]>(cartKey)) || [];

    // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
    if (currentCart.includes(courseId)) {
      throw new Error('Khóa học đã có trong giỏ hàng');
    }

    // Thêm khóa học vào giỏ hàng
    currentCart.push(courseId);
    await this.redisService.set(cartKey, currentCart);

    await this.applyBestVoucherAutomatically(userId, currentCart);

    return {
      message: 'Đã thêm khóa học vào giỏ hàng thành công',
      courseId,
    };
  }

  async clearCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    await this.redisService.del(cartKey);
    return {
      message: 'Đã xóa giỏ hàng thành công',
    };
  }

  async applyBestVoucherAutomatically(userId: string, courseIds: string[]) {
    try {
      // Lấy tất cả voucher có thể áp dụng
      const { data: voucherResponse } =
        await this.voucherService.getAllVouchers();

      const voucherData = voucherResponse as VoucherInfo[];
      const activeVouchers = voucherData.filter(
        (v) =>
          v.isActive &&
          new Date(v.startDate) <= new Date() &&
          new Date(v.endDate) >= new Date(),
      );

      if (!activeVouchers.length || !courseIds.length) {
        return;
      }

      // Thử áp dụng từng voucher và chọn voucher tốt nhất
      let bestVoucher: VoucherInfo | null = null;
      let maxDiscount = 0;

      for (const voucher of activeVouchers) {
        try {
          const result = await this.voucherService.applyVoucher(userId, {
            code: voucher.code,
            courseIds,
          });

          const totalDiscount = result.data.totalDiscount;
          if (totalDiscount > maxDiscount) {
            maxDiscount = totalDiscount;
            bestVoucher = voucher;
          }
        } catch (error) {
          // Voucher không thể áp dụng, bỏ qua
          continue;
        }
      }

      // Áp dụng voucher tốt nhất tìm được
      if (bestVoucher) {
        await this.applyVoucherToCart(userId, bestVoucher.code);
      }
    } catch (error) {
      this.logger.error(`Không thể áp dụng voucher tự động: ${error.message}`);
    }
  }

  async applyVoucherToCart(userId: string, code: string) {
    const cartKey = this.getCartKey(userId);
    const courseIds = (await this.redisService.get<string[]>(cartKey)) || [];

    if (courseIds.length === 0) {
      throw new Error('Giỏ hàng trống');
    }

    // Gọi đến VoucherService để áp dụng voucher
    const voucherResult = await this.voucherService.applyVoucher(userId, {
      code,
      courseIds,
    });

    // Lưu thông tin voucher đã áp dụng vào Redis
    await this.redisService.set(`${cartKey}:voucher`, {
      code,
      voucherId: voucherResult.data.voucher.voucherId,
      discountedCourses: voucherResult.data.discountedCourses,
    });

    return voucherResult;
  }

  // // Thêm vào CartService (sau phương thức applyVoucherToCart)
  // async removeVoucherFromCart(userId: string) {
  //   const cartKey = this.getCartKey(userId);

  //   // Kiểm tra xem có voucher nào đã được áp dụng không
  //   const appliedVoucher = await this.redisService.get<AppliedVoucherInCart>(
  //     `${cartKey}:voucher`,
  //   );

  //   if (!appliedVoucher) {
  //     throw new Error('Không có voucher nào được áp dụng cho giỏ hàng');
  //   }

  //   // Xóa voucher đã áp dụng
  //   await this.redisService.del(`${cartKey}:voucher`);

  //   return {
  //     success: true,
  //     message: 'Đã xóa voucher khỏi giỏ hàng',
  //     code: appliedVoucher.code,
  //   };
  // }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddToCartDto,
  RemoveFromCartDto,
  GetCartDto,
  SelectCartItemsDto,
  GetSelectedCartItemsDto,
  UpdateCartItemStatusDto,
  CartItemDto,
  AppliedVoucherInCart,
} from '../dto/cart.dto';
import { VoucherService } from './voucher.service';
import { VoucherInfo } from '../dto/voucher.dto';

interface CartItem {
  courseId: string;
  selected: boolean;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly CART_PREFIX = 'cart:';
  private readonly SELECTED_CART_PREFIX = 'selected_cart:';

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly voucherService: VoucherService,
  ) {}

  private getCartKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  private getSelectedCartKey(userId: string): string {
    return `${this.SELECTED_CART_PREFIX}${userId}`;
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

    await this.applyBestVoucherAutomatically(userId, currentCart.join(','));

    return {
      message: 'Đã thêm khóa học vào giỏ hàng thành công',
      courseId,
    };
  }

  async removeFromCart(removeFromCartDto: RemoveFromCartDto) {
    const { userId, courseId } = removeFromCartDto;

    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const cartKey = this.getCartKey(userId);
    const selectedCartKey = this.getSelectedCartKey(userId);

    try {
      // Lấy giỏ hàng hiện tại
      const currentCart =
        (await this.redisService.get<string[]>(cartKey)) || [];
      const currentSelectedCart =
        (await this.redisService.get<string[]>(selectedCartKey)) || [];

      // Lọc bỏ khóa học khỏi giỏ hàng
      const updatedCart = currentCart.filter((id) => id !== courseId);
      const updatedSelectedCart = currentSelectedCart.filter(
        (id) => id !== courseId,
      );

      // Lưu giỏ hàng mới
      await this.redisService.set(cartKey, updatedCart);
      await this.redisService.set(selectedCartKey, updatedSelectedCart);

      // Xóa cache voucher nếu có
      await this.redisService.del(`${cartKey}:voucher`);

      // Cập nhật lại voucher nếu còn khóa học trong giỏ hàng
      if (updatedCart.length > 0) {
        await this.applyBestVoucherAutomatically(userId, updatedCart.join(','));
      }

      // Xóa cache của giỏ hàng
      await this.redisService.del(`${cartKey}:cache`);

      return {
        message: 'Đã xóa khóa học khỏi giỏ hàng thành công',
        courseId,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa khóa học khỏi giỏ hàng: ${error.message}`);
      throw error;
    }
  }

  async getCart(getCartDto: GetCartDto) {
    const { userId } = getCartDto;

    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const cartKey = this.getCartKey(userId);
    // Lấy danh sách khóa học trong giỏ hàng
    const cartItems = (await this.redisService.get<string[]>(cartKey)) || [];
    // Lấy thông tin voucher đã áp dụng (nếu có)
    const appliedVoucher = await this.redisService.get<AppliedVoucherInCart>(
      `${cartKey}:voucher`,
    );

    // Nếu không có khóa học nào trong giỏ hàng
    if (cartItems.length === 0) {
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
          in: cartItems,
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
      totalItems: coursesWithPricing.length,
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

  async clearCart(userId: string) {
    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const cartKey = this.getCartKey(userId);
    await this.redisService.del(cartKey);
    return {
      message: 'Đã xóa giỏ hàng thành công',
    };
  }

  // Cập nhật phương thức để chọn khóa học cụ thể
  async selectCartItems(selectCartItemsDto: SelectCartItemsDto) {
    const { userId, selectedCourseIds } = selectCartItemsDto;

    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const cartKey = this.getCartKey(userId);
    const selectedCartKey = this.getSelectedCartKey(userId);

    // Lấy giỏ hàng hiện tại
    const cartItems = (await this.redisService.get<string[]>(cartKey)) || [];

    // Kiểm tra xem tất cả các khóa học được chọn có trong giỏ hàng không
    const invalidCourseIds = selectedCourseIds.filter(
      (id) => !cartItems.includes(id),
    );

    if (invalidCourseIds.length > 0) {
      throw new Error(
        `Một số khóa học không tồn tại trong giỏ hàng: ${invalidCourseIds.join(', ')}`,
      );
    }

    // Lưu danh sách ID của các khóa học được chọn vào Redis
    await this.redisService.set(selectedCartKey, selectedCourseIds);

    return {
      message: 'Đã cập nhật trạng thái chọn khóa học thành công',
      selectedCourseIds,
    };
  }

  // Phương thức để cập nhật trạng thái của nhiều khóa học cùng lúc
  async updateCartItemStatus(updateCartItemStatusDto: UpdateCartItemStatusDto) {
    const { userId, items } = updateCartItemStatusDto;

    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const cartKey = this.getCartKey(userId);
    const selectedCartKey = this.getSelectedCartKey(userId);

    // Lấy giỏ hàng hiện tại
    const cartItems = (await this.redisService.get<string[]>(cartKey)) || [];

    // Lấy danh sách ID khóa học hiện đang được chọn
    const currentSelectedIds =
      (await this.redisService.get<string[]>(selectedCartKey)) || [];

    // Danh sách ID khóa học cần cập nhật
    const updateCourseIds = items.map((item) => item.courseId);

    // Kiểm tra xem tất cả các khóa học cần cập nhật có trong giỏ hàng không
    const invalidCourseIds = updateCourseIds.filter(
      (id) => !cartItems.includes(id),
    );

    if (invalidCourseIds.length > 0) {
      throw new Error(
        `Một số khóa học không tồn tại trong giỏ hàng: ${invalidCourseIds.join(', ')}`,
      );
    }

    // Cập nhật danh sách khóa học được chọn
    const newSelectedIds = [...currentSelectedIds];

    for (const item of items) {
      if (item.selected && !newSelectedIds.includes(item.courseId)) {
        // Thêm vào danh sách được chọn nếu chưa có
        newSelectedIds.push(item.courseId);
      } else if (!item.selected) {
        // Loại bỏ khỏi danh sách được chọn
        const index = newSelectedIds.indexOf(item.courseId);
        if (index !== -1) {
          newSelectedIds.splice(index, 1);
        }
      }
    }

    // Lưu danh sách đã cập nhật
    await this.redisService.set(selectedCartKey, newSelectedIds);

    return {
      message: 'Đã cập nhật trạng thái chọn khóa học thành công',
      updatedItems: items.length,
    };
  }

  // Phương thức để lấy danh sách các khóa học đã được chọn
  async getSelectedCartItems(getSelectedCartItemsDto: GetSelectedCartItemsDto) {
    const { userId } = getSelectedCartItemsDto;

    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const selectedCartKey = this.getSelectedCartKey(userId);
    const cartKey = this.getCartKey(userId);

    // Lấy danh sách ID của các khóa học đã chọn
    const selectedCourseIds =
      (await this.redisService.get<string[]>(selectedCartKey)) || [];

    if (selectedCourseIds.length === 0) {
      return {
        courses: [],
        totalItems: 0,
      };
    }

    // Lấy thông tin chi tiết của các khóa học đã chọn
    const selectedCourses = await this.prismaService.tbl_courses.findMany({
      where: {
        courseId: {
          in: selectedCourseIds,
        },
      },
      include: {
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
        tbl_instructors: true,
        tbl_voucher_courses: true,
      },
    });

    // Lấy thông tin voucher đã áp dụng (nếu có) để tính toán giá sau discount
    const appliedVoucher = await this.redisService.get<AppliedVoucherInCart>(
      `${cartKey}:voucher`,
    );

    // Tính toán giá sau khi áp dụng voucher cho từng khóa học đã chọn
    const coursesWithPricing = selectedCourses.map((course) => {
      const originalPrice = Number(course.price);

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
        }
      }
 
      return {
        ...course,
        originalPrice,
        discountAmount,
        finalPrice: Math.round(finalPrice * 1000) / 1000,
      };
    });

    return {
      courses: coursesWithPricing,
      totalItems: coursesWithPricing.length,
    };
  }

  // Phương thức để xóa trạng thái selected của tất cả khóa học
  async clearSelectedCartItems(userId: string) {
    if (!userId) {
      throw new Error('UserId không được để trống');
    }

    const selectedCartKey = this.getSelectedCartKey(userId);

    // Xóa danh sách các khóa học đã chọn
    await this.redisService.del(selectedCartKey);

    return {
      message: 'Đã xóa trạng thái chọn của tất cả khóa học thành công',
    };
  }

  // Phương thức để xóa các khóa học đã thanh toán khỏi giỏ hàng trong database
  async removeCoursesFromDatabaseCart(userId: string, courseIds: string[]) {
    if (!userId || !courseIds || courseIds.length === 0) {
      throw new Error('UserId và danh sách khóa học không được để trống');
    }

    try {
      this.logger.log(
        `Xóa ${courseIds.length} khóa học khỏi giỏ hàng trong database cho userId: ${userId}`,
      );

      // Tìm cartId của người dùng
      const userCart = await this.prismaService.tbl_cart.findFirst({
        where: { userId },
      });

      if (!userCart) {
        this.logger.log(
          `Không tìm thấy giỏ hàng trong database cho userId: ${userId}`,
        );

        // Ngay cả khi không tìm thấy trong database, vẫn xóa khỏi Redis
        await this.removeCoursesFromRedisCart(userId, courseIds);

        return {
          message: 'Không tìm thấy giỏ hàng trong database, đã xóa khỏi Redis',
          removedItems: 0,
        };
      }

      // Xóa các mục trong giỏ hàng tương ứng với các khóa học đã thanh toán
      const result = await this.prismaService.tbl_cart_items.deleteMany({
        where: {
          cartId: userCart.cartId,
          courseId: {
            in: courseIds,
          },
        },
      });

      this.logger.log(
        `Đã xóa ${result.count} khóa học khỏi giỏ hàng trong database cho userId: ${userId}`,
      );

      // Xóa khỏi Redis
      await this.removeCoursesFromRedisCart(userId, courseIds);

      return {
        message:
          'Đã xóa khóa học khỏi giỏ hàng trong database và Redis thành công',
        removedItems: result.count,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa khóa học khỏi giỏ hàng trong database: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Phương thức riêng để xóa khóa học khỏi Redis
  private async removeCoursesFromRedisCart(
    userId: string,
    courseIds: string[],
  ) {
    try {
      const cartKey = this.getCartKey(userId);
      const selectedCartKey = this.getSelectedCartKey(userId);

      // Lấy giỏ hàng từ Redis
      let currentCart = await this.redisService.get<any>(cartKey);
      let currentSelectedCart =
        await this.redisService.get<any>(selectedCartKey);

      this.logger.log(
        `[DEBUG] Giỏ hàng hiện tại trong Redis (Trước khi xóa): ${JSON.stringify(currentCart)}`,
      );
      this.logger.log(
        `[DEBUG] Khóa học đã chọn trong Redis (Trước khi xóa): ${JSON.stringify(currentSelectedCart)}`,
      );

      // Xử lý nhiều định dạng có thể có của giỏ hàng trong Redis
      if (!currentCart) {
        currentCart = [];
      } else if (typeof currentCart === 'string') {
        try {
          currentCart = JSON.parse(currentCart);
        } catch (e) {
          this.logger.error(
            `Lỗi khi phân tích chuỗi JSON của giỏ hàng: ${e.message}`,
          );
          currentCart = [];
        }
      }

      if (!currentSelectedCart) {
        currentSelectedCart = [];
      } else if (typeof currentSelectedCart === 'string') {
        try {
          currentSelectedCart = JSON.parse(currentSelectedCart);
        } catch (e) {
          this.logger.error(
            `Lỗi khi phân tích chuỗi JSON của giỏ hàng đã chọn: ${e.message}`,
          );
          currentSelectedCart = [];
        }
      }

      // Xử lý trường hợp giỏ hàng là mảng các đối tượng có thuộc tính courseId
      if (
        Array.isArray(currentCart) &&
        currentCart.length > 0 &&
        typeof currentCart[0] === 'object' &&
        currentCart[0].courseId
      ) {
        // Định dạng là mảng các đối tượng { courseId: string, selected: boolean }
        const updatedCart = currentCart.filter(
          (item) => !courseIds.includes(item.courseId),
        );
        await this.redisService.set(cartKey, updatedCart);
        this.logger.log(
          `[DEBUG] Đã xóa ${currentCart.length - updatedCart.length} khóa học khỏi giỏ hàng Redis (định dạng object)`,
        );
      }
      // Xử lý trường hợp giỏ hàng là mảng các chuỗi courseId
      else if (Array.isArray(currentCart)) {
        const updatedCart = currentCart.filter(
          (courseId) => !courseIds.includes(courseId),
        );
        await this.redisService.set(cartKey, updatedCart);
        this.logger.log(
          `[DEBUG] Đã xóa ${currentCart.length - updatedCart.length} khóa học khỏi giỏ hàng Redis (định dạng mảng ID)`,
        );
      }

      // Tương tự cho selected cart
      if (
        Array.isArray(currentSelectedCart) &&
        currentSelectedCart.length > 0 &&
        typeof currentSelectedCart[0] === 'object' &&
        currentSelectedCart[0].courseId
      ) {
        const updatedSelectedCart = currentSelectedCart.filter(
          (item) => !courseIds.includes(item.courseId),
        );
        await this.redisService.set(selectedCartKey, updatedSelectedCart);
      } else if (Array.isArray(currentSelectedCart)) {
        const updatedSelectedCart = currentSelectedCart.filter(
          (courseId) => !courseIds.includes(courseId),
        );
        await this.redisService.set(selectedCartKey, updatedSelectedCart);
      }

      // Xóa cache voucher nếu có
      try {
        await this.redisService.del(`${cartKey}:voucher`);
        this.logger.log(`[DEBUG] Đã xóa cache voucher cho giỏ hàng`);
      } catch (error) {
        this.logger.error(`Lỗi khi xóa cache voucher: ${error.message}`);
      }

      // Kiểm tra giỏ hàng sau khi cập nhật
      const updatedCartCheck = await this.redisService.get<any>(cartKey);
      this.logger.log(
        `[DEBUG] Giỏ hàng sau khi cập nhật trong Redis: ${JSON.stringify(updatedCartCheck)}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa khóa học khỏi Redis: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async applyBestVoucherAutomatically(userId: string, courseIds: string) {
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
      courseIds: courseIds.join(','),
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

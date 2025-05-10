import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddToCartDto,
  RemoveFromCartDto,
  GetCartDto, SelectCartItemsDto, GetSelectedCartItemsDto, UpdateCartItemStatusDto, CartItemDto,
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

  async addToCart(addToCartDto: AddToCartDto) {
    const { userId, courseId } = addToCartDto;
    
    if (!userId) {
      throw new Error('UserId không được để trống');
    }
    
    const cartKey = this.getCartKey(userId);

    // Kiểm tra khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new Error('Khóa học không tồn tại');
    }

    // Lấy giỏ hàng hiện tại
    const currentCart = await this.redisService.get<CartItem[]>(cartKey) || [];
    
    // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
    if (currentCart.some(item => item.courseId === courseId)) {
      throw new Error('Khóa học đã có trong giỏ hàng');
    }

    // Thêm khóa học vào giỏ hàng với trạng thái mặc định là unselected
    currentCart.push({ courseId, selected: false });
    await this.redisService.set(cartKey, currentCart);

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

    // Lấy giỏ hàng hiện tại
    const currentCart = (await this.redisService.get<CartItem[]>(cartKey)) || [];

    // Lọc bỏ khóa học khỏi giỏ hàng
    const updatedCart = currentCart.filter((item) => item.courseId !== courseId);

    // Lưu giỏ hàng mới
    await this.redisService.set(cartKey, updatedCart);

    return {
      message: 'Đã xóa khóa học khỏi giỏ hàng thành công',
      courseId,
    };
  }

  async getCart(getCartDto: GetCartDto) {
    const { userId } = getCartDto;
    
    if (!userId) {
      throw new Error('UserId không được để trống');
    }
    
    const cartKey = this.getCartKey(userId);
    // Lấy danh sách khóa học trong giỏ hàng
    const cartItems = (await this.redisService.get<CartItem[]>(cartKey)) || [];
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
    const courseIds = cartItems.map(item => item.courseId);

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

    // Kết hợp thông tin khóa học với trạng thái selected
    const coursesWithSelectionStatus = courses.map(course => {
      const cartItem = cartItems.find(item => item.courseId === course.courseId);
      return {
        ...course,
        selected: cartItem ? cartItem.selected : false
      };
    });

    return {
      courses: coursesWithPricing: coursesWithSelectionStatus,
      totalItems: coursesWithSelectionStatus.length,
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

    // Lấy giỏ hàng hiện tại
    const currentCart = await this.redisService.get<CartItem[]>(cartKey) || [];
    
    // Kiểm tra xem tất cả các khóa học được chọn có trong giỏ hàng không
    const invalidCourseIds = selectedCourseIds.filter(id => 
      !currentCart.some(item => item.courseId === id)
    );
    
    if (invalidCourseIds.length > 0) {
      throw new Error(`Một số khóa học không tồn tại trong giỏ hàng: ${invalidCourseIds.join(', ')}`);
    }

    // Cập nhật trạng thái selected cho từng khóa học
    const updatedCart = currentCart.map(item => ({
      ...item,
      selected: selectedCourseIds.includes(item.courseId)
    }));
    
    // Lưu giỏ hàng đã cập nhật
    await this.redisService.set(cartKey, updatedCart);

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

    // Lấy giỏ hàng hiện tại
    const currentCart = await this.redisService.get<CartItem[]>(cartKey) || [];
    
    // Danh sách ID khóa học cần cập nhật
    const updateCourseIds = items.map(item => item.courseId);
    
    // Kiểm tra xem tất cả các khóa học cần cập nhật có trong giỏ hàng không
    const invalidCourseIds = updateCourseIds.filter(id => 
      !currentCart.some(item => item.courseId === id)
    );
    
    if (invalidCourseIds.length > 0) {
      throw new Error(`Một số khóa học không tồn tại trong giỏ hàng: ${invalidCourseIds.join(', ')}`);
    }

    // Cập nhật trạng thái selected cho từng khóa học
    const updatedCart = currentCart.map(cartItem => {
      const updateItem = items.find(item => item.courseId === cartItem.courseId);
      if (updateItem) {
        return {
          ...cartItem,
          selected: updateItem.selected !== undefined ? updateItem.selected : cartItem.selected
        };
      }
      return cartItem;
    });
    
    // Lưu giỏ hàng đã cập nhật
    await this.redisService.set(cartKey, updatedCart);

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
    
    const cartKey = this.getCartKey(userId);

    // Lấy giỏ hàng hiện tại
    const cartItems = await this.redisService.get<CartItem[]>(cartKey) || [];
    
    // Lọc ra các khóa học đã được chọn
    const selectedCartItems = cartItems.filter(item => item.selected);
    
    if (selectedCartItems.length === 0) {
      return {
        courses: [],
        totalItems: 0,
      };
    }

    // Lấy ID của các khóa học đã chọn
    const selectedCourseIds = selectedCartItems.map(item => item.courseId);

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
      },
    });

    return {
      courses: selectedCourses,
      totalItems: selectedCourses.length,
    };
  }

  // Phương thức để xóa trạng thái selected của tất cả khóa học (đặt tất cả về unselected)
  async clearSelectedCartItems(userId: string) {
    if (!userId) {
      throw new Error('UserId không được để trống');
    }
    
    const cartKey = this.getCartKey(userId);
    
    // Lấy giỏ hàng hiện tại
    const cartItems = await this.redisService.get<CartItem[]>(cartKey) || [];
    
    // Đặt tất cả khóa học về trạng thái unselected
    const updatedCart = cartItems.map(item => ({
      ...item,
      selected: false
    }));
    
    // Lưu giỏ hàng đã cập nhật
    await this.redisService.set(cartKey, updatedCart);
    
    return {
      message: 'Đã xóa trạng thái chọn của tất cả khóa học thành công',
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

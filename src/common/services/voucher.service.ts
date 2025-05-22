import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplyVoucherDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../dto/voucher.dto';
import { v4 as uuidv4 } from 'uuid';
import { VoucherScopeEnum } from '../constants/voucher.constant';
import { ROLE } from '../constants/role.constant';
import { convertDecimalValues } from '../utils/convertDecimalValue.util';

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async createVoucher(
    createVoucherDto: CreateVoucherDto,
    creatorId: string,
    creatorRole: string,
  ) {
    const { courseIds, categoryId, ...voucherData } = createVoucherDto;
    const voucherId = uuidv4();

    const existingVoucher = await this.prisma.tbl_vouchers.findUnique({
      where: { code: voucherData.code },
    });

    if (existingVoucher) {
      throw new BadRequestException('Voucher code already exists');
    }

    if (creatorRole === ROLE.INSTRUCTOR) {
      await this.validateInstructorPermissions(
        creatorId,
        courseIds,
        categoryId,
        voucherData.scope,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.tbl_vouchers.create({
        data: {
          voucherId,
          ...voucherData,
          creatorId,
          creatorRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (
        voucherData.scope === VoucherScopeEnum.SPECIFIC_COURSES &&
        courseIds?.length
      ) {
        const voucherCourseData = courseIds?.map((courseId) => ({
          voucherCourseId: uuidv4(),
          voucherId,
          courseId,
          createdAt: new Date(),
        }));

        await tx.tbl_voucher_courses.createMany({
          data: voucherCourseData,
        });
      }

      return {
        success: true,
        message: 'Voucher created successfully',
        data: voucher,
      };
    });
  }

  async getInstructorVouchers(instructorId: string) {
    const vouchers = await this.prisma.tbl_vouchers.findMany({
      where: { creatorId: instructorId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: convertDecimalValues(vouchers),
    };
  }

  // Admin only
  async getAllVouchers() {
    const vouchers = await this.prisma.tbl_vouchers.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: convertDecimalValues(vouchers),
    };
  }

  async applyVoucher(userId: string, applyVoucherDto: ApplyVoucherDto) {
    const { code, courseIds } = applyVoucherDto;

    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (!voucher.isActive) {
      throw new BadRequestException('Voucher is not active');
    }

    const now = new Date();
    if (voucher.startDate && voucher.startDate > now) {
      throw new BadRequestException('Voucher is not yet valid');
    }

    if (voucher.endDate && voucher.endDate < now) {
      throw new BadRequestException('Voucher has expired');
    }

    if (voucher.maxUsage) {
      const usageCount = await this.prisma.tbl_voucher_usage_history.count({
        where: { voucherId: voucher.voucherId },
      });

      if (usageCount >= voucher.maxUsage) {
        throw new BadRequestException('Voucher has reached its maximum usage');
      }
    }

    let applicableCourses: string[] = [];

    if (voucher.scope === VoucherScopeEnum.ALL_COURSES) {
      if (voucher.creatorRole === 'INSTRUCTOR') {
        // Nếu là voucher của instructor, chỉ áp dụng cho khóa học của instructor đó
        const instructorCourses = await this.prisma.tbl_courses.findMany({
          where: {
            instructorId: voucher.creatorId,
            courseId: { in: courseIds },
          },
          select: { courseId: true },
        });
        applicableCourses = instructorCourses.map((course) => course.courseId);
      } else {
        // Nếu là voucher của admin, áp dụng cho tất cả khóa học
        applicableCourses = courseIds;
      }
    } else if (voucher.scope === VoucherScopeEnum.SPECIFIC_COURSES) {
      const voucherCourses = await this.prisma.tbl_voucher_courses.findMany({
        where: { voucherId: voucher.voucherId },
        select: { courseId: true },
      });

      const vourcherCourseIds = voucherCourses.map((vc) => vc.courseId);
      applicableCourses = courseIds.filter((id) =>
        vourcherCourseIds.includes(id),
      );

      if (applicableCourses.length === 0) {
        throw new BadRequestException(
          'Voucher is not applicable to any courses in the cart',
        );
      }
    } else if (voucher.scope === VoucherScopeEnum.CATEGORY) {
      if (!voucher.categoryId) {
        throw new BadRequestException(
          'Voucher is not applicable to any category',
        );
      }

      const courseCategories = await this.prisma.tbl_course_categories.findMany(
        {
          where: {
            categoryId: voucher.categoryId,
            courseId: {
              in: courseIds, // check if the course is int the cart
            },
          },
          select: {
            courseId: true,
          },
        },
      );

      applicableCourses = courseCategories
        .map((cc) => cc.courseId)
        .filter((id): id is string => id !== null);

      if (applicableCourses.length == 0) {
        throw new BadRequestException(
          'Voucher is not applicable to any courses in the cart',
        );
      }
    }

    // get course info to calculate the discount
    const courseInfo = await this.prisma.tbl_courses.findMany({
      where: { courseId: { in: applicableCourses } },
      select: {
        courseId: true,
        price: true,
        title: true,
      },
    });

    // calculate the discount for each course
    const discountedCourses = courseInfo.map((course) => {
      let discountAmount = 0;
      const price = Number(course.price);

      if (voucher.discountType === 'Percentage') {
        discountAmount = price * (Number(voucher.discountValue) / 100);

        if (
          voucher.maxDiscount &&
          discountAmount > Number(voucher.maxDiscount)
        ) {
          discountAmount = Number(voucher.maxDiscount);
        }
      } else {
        discountAmount = Number(voucher.discountValue);

        if (discountAmount > price) {
          discountAmount = price;
        }
      }

      discountAmount = Math.round(discountAmount * 100) / 100;

      const finalPrice = Math.round((price - discountAmount) * 1000) / 1000;

      return {
        courseId: course.courseId,
        title: course.title,
        originalPrice: price,
        discountAmount,
        finalPrice,
      };
    });

    const totalDiscount = discountedCourses.reduce(
      (sum, course) => sum + course.discountAmount,
      0,
    );

    return {
      success: true,
      data: {
        voucher,
        discountedCourses,
        totalDiscount,
        totalFinalPrice: discountedCourses.reduce(
          (sum, courses) => sum + courses.finalPrice,
          0,
        ),
      },
    };
  }

  async applyVoucherToAllCourses(userId: string, code: string) {
    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (!voucher.isActive) {
      throw new BadRequestException('Voucher is not active');
    }

    const now = new Date();
    if (voucher.startDate && voucher.startDate > now) {
      throw new BadRequestException('Voucher is not yet valid');
    }

    if (voucher.endDate && voucher.endDate < now) {
      throw new BadRequestException('Voucher has expired');
    }

    if (voucher.maxUsage) {
      const usageCount = await this.prisma.tbl_voucher_usage_history.count({
        where: { voucherId: voucher.voucherId },
      });

      if (usageCount >= voucher.maxUsage) {
        throw new BadRequestException('Voucher has reached its maximum usage');
      }
    }

    const allCourses = await this.prisma.tbl_courses.findMany({
      select: {
        courseId: true,
        price: true,
        title: true,
      },
    });

    const courseIds = allCourses.map((course) => course.courseId);

    let applicableCourses: string[] = [];

    if (voucher.scope === VoucherScopeEnum.ALL_COURSES) {
      applicableCourses = courseIds;
    } else if (voucher.scope === VoucherScopeEnum.SPECIFIC_COURSES) {
      const voucherCourses = await this.prisma.tbl_voucher_courses.findMany({
        where: { voucherId: voucher.voucherId },
        select: { courseId: true },
      });

      applicableCourses = voucherCourses
        .map((vc) => vc.courseId)
        .filter((id): id is string => id !== null);
    } else if (voucher.scope === VoucherScopeEnum.CATEGORY) {
      if (!voucher.categoryId) {
        throw new BadRequestException(
          'Voucher is not applicable to any category',
        );
      }

      const courseCategories = await this.prisma.tbl_course_categories.findMany(
        {
          where: {
            categoryId: voucher.categoryId,
          },
          select: {
            courseId: true,
          },
        },
      );

      applicableCourses = courseCategories
        .map((cc) => cc.courseId)
        .filter((id): id is string => id !== null);
    }

    // get course info to calculate the discount
    const courseInfo = await this.prisma.tbl_courses.findMany({
      where: { courseId: { in: applicableCourses } },
      select: {
        courseId: true,
        price: true,
        title: true,
      },
    });

    // calculate the discount for each course
    const discountedCourses = courseInfo.map((course) => {
      let discountAmount = 0;
      const price = Number(course.price);

      if (voucher.discountType === 'Percentage') {
        discountAmount = price * (Number(voucher.discountValue) / 100);

        if (
          voucher.maxDiscount &&
          discountAmount > Number(voucher.maxDiscount)
        ) {
          discountAmount = Number(voucher.maxDiscount);
        }
      } else {
        discountAmount = Number(voucher.discountValue);

        if (discountAmount > price) {
          discountAmount = price;
        }
      }

      discountAmount = Math.round(discountAmount * 100) / 100;

      const finalPrice = Math.round((price - discountAmount) * 1000) / 1000;

      return {
        courseId: course.courseId,
        title: course.title,
        originalPrice: price,
        discountAmount,
        finalPrice,
      };
    });

    const totalDiscount = discountedCourses.reduce(
      (sum, course) => sum + course.discountAmount,
      0,
    );

    return {
      success: true,
      data: {
        voucher: convertDecimalValues([voucher]),
        discountedCourses,
        totalDiscount,
        totalFinalPrice: discountedCourses.reduce(
          (sum, courses) => sum + courses.finalPrice,
          0,
        ),
        applicableCourseCount: discountedCourses.length,
        totalCourseCount: allCourses.length,
      },
    };
  }

  async getApplicableVouchersForCourse(courseId: string) {
    const now = new Date();

    // Lấy thông tin khóa học và instructor
    const course = await this.prisma.tbl_courses.findUnique({
      where: { courseId },
      include: {
        tbl_course_categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const instructorId = course.instructorId;

    // 1. Voucher ALL_COURSES từ Admin (áp dụng cho mọi khóa học)
    const adminAllCoursesVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.ALL_COURSES,
        startDate: { lte: now },
        endDate: { gte: now },
        creatorRole: 'ADMIN',
      },
    });

    // 2. Voucher ALL_COURSES từ Instructor (chỉ áp dụng cho khóa học của instructor đó)
    const instructorAllCoursesVouchers =
      await this.prisma.tbl_vouchers.findMany({
        where: {
          isActive: true,
          scope: VoucherScopeEnum.ALL_COURSES,
          startDate: { lte: now },
          endDate: { gte: now },
          creatorRole: 'INSTRUCTOR',
          creatorId: instructorId,
        },
      });

    // 3. Voucher SPECIFIC_COURSES
    const specificVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.SPECIFIC_COURSES,
        startDate: { lte: now },
        endDate: { gte: now },
        tbl_voucher_courses: {
          some: {
            courseId: courseId,
          },
        },
      },
    });

    // 4. Voucher CATEGORY từ Admin (áp dụng cho mọi khóa học trong category)
    const categoryIds = course.tbl_course_categories.map((cc) => cc.categoryId);

    const adminCategoryVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.CATEGORY,
        startDate: { lte: now },
        endDate: { gte: now },
        categoryId: {
          in: categoryIds.filter((id): id is string => id !== null),
        },
        creatorRole: ROLE.ADMIN,
      },
    });

    // 5. Voucher CATEGORY từ Instructor (chỉ áp dụng khi instructor sở hữu khóa học)
    const instructorCategoryVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.CATEGORY,
        startDate: { lte: now },
        endDate: { gte: now },
        categoryId: {
          in: categoryIds.filter((id): id is string => id !== null),
        },
        creatorRole: ROLE.INSTRUCTOR,
        creatorId: instructorId,
      },
    });

    // Kết hợp tất cả voucher
    const allVouchers = [
      ...adminAllCoursesVouchers,
      ...instructorAllCoursesVouchers,
      ...specificVouchers,
      ...adminCategoryVouchers,
      ...instructorCategoryVouchers,
    ];

    // Tính toán và sắp xếp (phần này giữ nguyên)
    const voucherDetails = allVouchers.map((voucher) => {
      const coursePrice = Number(course.price);
      let discountAmount = 0;

      if (voucher.discountType === 'Percentage') {
        discountAmount = coursePrice * (Number(voucher.discountValue) / 100);

        if (
          voucher.maxDiscount &&
          discountAmount > Number(voucher.maxDiscount)
        ) {
          discountAmount = Number(voucher.maxDiscount);
        }
      } else {
        discountAmount = Number(voucher.discountValue);

        if (discountAmount > coursePrice) {
          discountAmount = coursePrice;
        }
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      const finalPrice = coursePrice - discountAmount;

      return {
        ...voucher,
        calculatedDiscount: discountAmount,
        finalPrice,
        percentOff: Math.round((discountAmount / coursePrice) * 100),
      };
    });

    const sortedVouchers = voucherDetails.sort((a, b) => {
      if (a.creatorRole === 'ADMIN' && b.creatorRole !== 'ADMIN') {
        return -1;
      }
      if (b.creatorRole === 'ADMIN' && a.creatorRole !== 'ADMIN') {
        return 1;
      }
      return b.calculatedDiscount - a.calculatedDiscount;
    });

    return {
      success: true,
      data: {
        course: {
          courseId: course.courseId,
          title: course.title,
          price: Number(course.price),
        },
        bestVoucher:
          sortedVouchers.length > 0
            ? convertDecimalValues(sortedVouchers[0])
            : null,
        allVouchers: convertDecimalValues(sortedVouchers),
      },
    };
  }

  async getDiscountedCoursesInfo(courseIds: string[]) {
    if (!courseIds.length) {
      return [];
    }

    const now = new Date();

    const courses = await this.prisma.tbl_courses.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        tbl_course_categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    const allCoursesVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.ALL_COURSES,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const allCategoryIds = Array.from(
      new Set(
        courses.flatMap((course) =>
          course.tbl_course_categories.map((cc) => cc.categoryId),
        ),
      ),
    );

    const categoryVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.CATEGORY,
        startDate: { lte: now },
        endDate: { gte: now },
        categoryId: {
          in: allCategoryIds.filter((id): id is string => id !== null),
        },
      },
    });

    const specificVouchers = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.SPECIFIC_COURSES,
        startDate: { lte: now },
        endDate: { gte: now },
        tbl_voucher_courses: {
          some: {
            courseId: { in: courseIds },
          },
        },
      },
      include: {
        tbl_voucher_courses: {
          where: {
            courseId: { in: courseIds },
          },
          select: {
            courseId: true,
          },
        },
      },
    });

    // Lấy tất cả instructor có khóa học trong danh sách
    const instructorsWithCourses = await this.prisma.tbl_courses.findMany({
      where: {
        courseId: { in: courseIds },
      },
      select: {
        instructorId: true,
        courseId: true,
      },
    });

    const coursesByInstructor = new Map();
    for (const item of instructorsWithCourses) {
      if (!coursesByInstructor.has(item.instructorId)) {
        coursesByInstructor.set(item.instructorId, []);
      }
      coursesByInstructor.get(item.instructorId).push(item.courseId);
    }

    // Lấy voucher ALL_COURSES của các instructor có khóa học trong danh sách
    const instructorIds = Array.from(coursesByInstructor.keys());
    const instructorAllCoursesVouchers =
      await this.prisma.tbl_vouchers.findMany({
        where: {
          isActive: true,
          scope: VoucherScopeEnum.ALL_COURSES,
          startDate: { lte: now },
          endDate: { gte: now },
          creatorRole: ROLE.INSTRUCTOR,
          creatorId: { in: instructorIds },
        },
      });

    // 6. Tính toán discount cho từng khóa học
    const coursesWithDiscount = courses.map((course) => {
      // a. Vouchers ALL_COURSES áp dụng cho course này
      const applicableAllCoursesVouchers = allCoursesVouchers;

      // b. Vouchers CATEGORY áp dụng cho course này
      const courseCategoryIds = course.tbl_course_categories.map(
        (cc) => cc.categoryId,
      );
      const applicableCategoryVouchers = categoryVouchers.filter((voucher) =>
        courseCategoryIds.includes(voucher.categoryId),
      );

      // c. Vouchers SPECIFIC_COURSES áp dụng cho course này
      const applicableSpecificVouchers = specificVouchers.filter((voucher) =>
        voucher.tbl_voucher_courses.some(
          (vc) => vc.courseId === course.courseId,
        ),
      );

      const allApplicableVouchers = [
        ...applicableAllCoursesVouchers,
        ...applicableCategoryVouchers,
        ...applicableSpecificVouchers,
      ];

      //  Calculate discount for each voucher
      const coursePrice = Number(course.price);
      const vouchersWithDiscount = allApplicableVouchers.map((voucher) => {
        const discountAmount = this.calculateDiscount(coursePrice, voucher);
        return {
          ...voucher,
          calculatedDiscount: discountAmount,
          finalPrice: coursePrice - discountAmount,
          percentOff: Math.round((discountAmount / coursePrice) * 100),
        };
      });

      // Sort by highest discount
      const sortedVouchers = vouchersWithDiscount.sort((a, b) => {
        // Ưu tiên voucher từ admin
        if (a.creatorRole === ROLE.ADMIN && b.creatorRole !== ROLE.ADMIN) {
          return -1;
        }
        if (b.creatorRole === ROLE.ADMIN && a.creatorRole !== ROLE.ADMIN) {
          return 1;
        }
        // Nếu cùng role, xét theo mức giảm
        return b.calculatedDiscount - a.calculatedDiscount;
      });

      // Get the best voucher (if any)
      const bestVoucher = sortedVouchers.length > 0 ? sortedVouchers[0] : null;

      return {
        ...course,
        bestVoucher,
      };
    });

    return coursesWithDiscount;
  }

  async getActiveSiteVoucher() {
    const now = new Date();

    const activeSiteVoucher = await this.prisma.tbl_vouchers.findMany({
      where: {
        isActive: true,
        scope: VoucherScopeEnum.ALL_COURSES,
        creatorRole: ROLE.ADMIN,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        discountValue: 'desc',
      },
      take: 1,
    });

    return {
      success: true,
      hasActiveVoucher: activeSiteVoucher.length > 0,
      voucher: activeSiteVoucher[0]
        ? convertDecimalValues(activeSiteVoucher[0])
        : null,
    };
  }

  private calculateDiscount(price: number, voucher: any): number {
    let discountAmount = 0;

    if (voucher.discountType === 'Percentage') {
      discountAmount = price * (Number(voucher.discountValue) / 100);

      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else {
      discountAmount = Number(voucher.discountValue);

      if (discountAmount > price) {
        discountAmount = price;
      }
    }

    return Math.round(discountAmount * 100) / 100;
  }

  private async validateInstructorPermissions(
    instructorId: string,
    courseIds?: string[],
    categoryId?: string,
    scope?: VoucherScopeEnum,
  ) {
    const foundInstructor = await this.prisma.tbl_instructors.findFirst({
      where: { userId: instructorId },
    });
    
    const instructorCourses = await this.prisma.tbl_courses.findMany({
      where: { instructorId: foundInstructor?.instructorId },
      select: { courseId: true },
    });
    const instructorCourseIds = instructorCourses.map(
      (course) => course.courseId,
    );

    if (scope === VoucherScopeEnum.SPECIFIC_COURSES && courseIds?.length) {
      // Kiểm tra xem tất cả courseIds có thuộc về instructor không
      const hasUnauthorizedCourses = courseIds.some(
        (courseId) => !instructorCourseIds.includes(courseId),
      );

      if (hasUnauthorizedCourses) {
        throw new ForbiddenException(
          'You can only create vouchers for your own courses',
        );
      }
    } else if (scope === VoucherScopeEnum.CATEGORY && categoryId) {
      const courseInCategory =
        await this.prisma.tbl_course_categories.findFirst({
          where: {
            categoryId,
            courseId: { in: instructorCourseIds },
          },
        });

      if (!courseInCategory) {
        throw new ForbiddenException(
          'You can only create vouchers for categories containing your courses',
        );
      }
    } else if (scope === VoucherScopeEnum.ALL_COURSES) {
      if (instructorCourseIds.length === 0) {
        throw new ForbiddenException(
          'You need to have at least one course to create an ALL_COURSES voucher',
        );
      }
    }
  }

  // Thêm vào voucher.service.ts
  async deleteVoucher(voucherId: string, userId: string, userRole: string) {
    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    // Kiểm tra quyền: Admin có thể xóa tất cả, Instructor chỉ có thể xóa voucher của mình
    if (userRole !== ROLE.ADMIN && voucher.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own vouchers');
    }

    // Kiểm tra xem voucher đã được sử dụng chưa
    const usageHistory = await this.prisma.tbl_voucher_usage_history.findFirst({
      where: { voucherId },
    });

    if (usageHistory) {
      // Nếu đã được sử dụng, chỉ set isActive = false thay vì xóa
      return this.prisma.tbl_vouchers.update({
        where: { voucherId },
        data: { isActive: false },
      });
    }

    // Nếu chưa được sử dụng, xóa cả voucher và liên kết với courses
    return this.prisma.$transaction(async (tx) => {
      // Xóa liên kết với courses nếu có
      if (voucher.scope === VoucherScopeEnum.SPECIFIC_COURSES) {
        await tx.tbl_voucher_courses.deleteMany({
          where: { voucherId },
        });
      }

      // Xóa voucher
      await tx.tbl_vouchers.delete({
        where: { voucherId },
      });

      return {
        success: true,
        message: 'Voucher deleted successfully',
      };
    });
  }

  async updateVoucher(
    voucherId: string,
    updateVoucherDto: UpdateVoucherDto,
    userId: string,
    userRole: string,
  ) {
    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    // Kiểm tra quyền: Admin có thể cập nhật tất cả, Instructor chỉ có thể cập nhật voucher của mình
    if (userRole !== ROLE.ADMIN && voucher.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own vouchers');
    }

    const { courseIds, categoryId, ...voucherData } = updateVoucherDto;

    // Kiểm tra quyền của instructor đối với courses và category
    if (userRole === ROLE.INSTRUCTOR && (courseIds?.length || categoryId)) {
      await this.validateInstructorPermissions(
        userId,
        courseIds,
        categoryId,
        voucher.scope as VoucherScopeEnum,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVoucher = await tx.tbl_vouchers.update({
        where: { voucherId },
        data: {
          ...voucherData,
          categoryId: categoryId || voucher.categoryId,
          updatedAt: new Date(),
        },
      });

      if (
        courseIds?.length &&
        voucher.scope === VoucherScopeEnum.SPECIFIC_COURSES
      ) {
        // Xóa liên kết cũ
        await tx.tbl_voucher_courses.deleteMany({
          where: { voucherId },
        });

        // Tạo liên kết mới
        const voucherCourseData = courseIds.map((courseId) => ({
          voucherCourseId: uuidv4(),
          voucherId,
          courseId,
          createdAt: new Date(),
        }));

        await tx.tbl_voucher_courses.createMany({
          data: voucherCourseData,
        });
      }

      return {
        success: true,
        message: 'Voucher updated successfully',
        data: convertDecimalValues(updatedVoucher),
      };
    });
  }

  async getVoucherById(voucherId: string) {
    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { voucherId },
      include: {
        tbl_voucher_courses: {
          include: {
            tbl_courses: {
              select: {
                courseId: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return {
      success: true,
      data: {
        ...convertDecimalValues(voucher),
        courses: voucher.tbl_voucher_courses.map((vc) => ({
          courseId: vc.courseId,
          title: vc.tbl_courses?.title,
          price: vc.tbl_courses?.price ? Number(vc.tbl_courses.price) : 0,
        })),
      },
    };
  }

  // Toggle voucher active status
  async toggleVoucherActive(
    voucherId: string,
    userId: string,
    userRole: string,
  ) {
    const voucher = await this.prisma.tbl_vouchers.findUnique({
      where: { voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    // Kiểm tra quyền: Admin có thể cập nhật tất cả, Instructor chỉ có thể cập nhật voucher của mình
    if (userRole !== ROLE.ADMIN && voucher.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own vouchers');
    }

    const updatedVoucher = await this.prisma.tbl_vouchers.update({
      where: { voucherId },
      data: {
        isActive: !voucher.isActive,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Voucher ${updatedVoucher.isActive ? 'activated' : 'deactivated'} successfully`,
      data: convertDecimalValues(updatedVoucher),
    };
  }
}

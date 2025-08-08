import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseDiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  async getPopularCourses(
    categoryId?: string,
    categoryName?: string,
    limit = 10,
  ): Promise<any[]> {
    try {
      const filter: any = {
        approved: 'APPROVED',
      };

      categoryName = categoryName?.toUpperCase();
      // Tìm kiếm theo category ID hoặc category name
      if (categoryId) {
        filter.tbl_course_categories = {
          some: {
            categoryId,
          },
        };
      } else if (categoryName) {
        filter.tbl_course_categories = {
          some: {
            tbl_categories: {
              name: categoryName,
            },
          },
        };
      }

      const courses = await this.prisma.tbl_courses.findMany({
        where: filter,
        orderBy: [
          { rating: 'desc' },
          { tbl_course_enrollments: { _count: 'desc' } },
        ],
        take: limit,
        include: {
          tbl_instructors: {
            select: {
              instructorId: true,
              instructorName: true,
              profilePicture: true,
            },
          },
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
          _count: {
            select: { tbl_course_enrollments: true },
          },
        },
      });

      return courses.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price ? Number(course.price) : 0,
        rating: course.rating ? Number(Number(course.rating).toFixed(1)) : 0,
        enrollments: course._count.tbl_course_enrollments,
        isBestSeller: course.isBestSeller,
        isRecommended: course.isRecommended,
        instructor: course.tbl_instructors
          ? {
              instructorId: course.tbl_instructors.instructorId,
              instructorName: course.tbl_instructors.instructorName,
              profilePicture: course.tbl_instructors.profilePicture,
            }
          : null,
        categories: course.tbl_course_categories.map((cc) => ({
          categoryId: cc.categoryId,
          name: cc.tbl_categories?.name,
        })),
      }));
    } catch (error) {
      console.error('Error fetching popular courses:', error);
      throw error;
    }
  }

  async getNewCourses(
    categoryId?: string,
    categoryName?: string,
    limit = 10,
  ): Promise<any[]> {
    try {
      const filter: any = {
        approved: 'APPROVED',
      };
      categoryName = categoryName?.toUpperCase();

      // Tìm kiếm theo category ID hoặc category name
      if (categoryId) {
        filter.tbl_course_categories = {
          some: {
            categoryId,
          },
        };
      } else if (categoryName) {
        filter.tbl_course_categories = {
          some: {
            tbl_categories: {
              name: categoryName,
            },
          },
        };
      }

      // Lấy các khóa học mới nhất
      const courses = await this.prisma.tbl_courses.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          tbl_instructors: {
            select: {
              instructorId: true,
              instructorName: true,
              profilePicture: true,
            },
          },
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
          _count: {
            select: { tbl_course_enrollments: true },
          },
        },
      });

      // Format lại kết quả trả về
      return courses.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price ? Number(course.price) : 0,
        rating: course.rating ? Number(Number(course.rating).toFixed(1)) : 0,
        enrollments: course._count.tbl_course_enrollments,
        createdAt: course.createdAt,
        isBestSeller: course.isBestSeller,
        isRecommended: course.isRecommended,
        instructor: course.tbl_instructors
          ? {
              instructorId: course.tbl_instructors.instructorId,
              instructorName: course.tbl_instructors.instructorName,
              profilePicture: course.tbl_instructors.profilePicture,
            }
          : null,
        categories: course.tbl_course_categories.map((cc) => ({
          categoryId: cc.categoryId,
          name: cc.tbl_categories?.name,
        })),
      }));
    } catch (error) {
      console.error('Error fetching new courses:', error);
      throw error;
    }
  }

  async getTrendingCourses(
    categoryId?: string,
    categoryName?: string,
    limit = 10,
    days = 30,
  ): Promise<any[]> {
    try {
      // Tính toán ngày bắt đầu để xem xét (X ngày trước)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      categoryName = categoryName?.toUpperCase();

      // Xây dựng filter theo categoryId hoặc categoryName nếu có
      let categoryFilter = {};
      if (categoryId) {
        categoryFilter = {
          tbl_course_categories: {
            some: {
              categoryId,
            },
          },
        };
      } else if (categoryName) {
        categoryFilter = {
          tbl_course_categories: {
            some: {
              tbl_categories: {
                name: categoryName,
              },
            },
          },
        };
      }

      // Lấy các khóa học có nhiều lượt đăng ký trong thời gian gần đây
      const trendingCourses = await this.prisma.tbl_courses.findMany({
        where: {
          approved: 'APPROVED',
          ...categoryFilter,
          tbl_course_enrollments: {
            some: {
              enrolledAt: {
                gte: startDate,
              },
            },
          },
        },
        include: {
          tbl_instructors: {
            select: {
              instructorId: true,
              instructorName: true,
              profilePicture: true,
            },
          },
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
          tbl_course_enrollments: {
            where: {
              enrolledAt: {
                gte: startDate,
              },
            },
            select: {
              courseEnrollmentId: true,
            },
          },
        },
      });

      // Sắp xếp theo số lượng đăng ký trong thời gian gần đây
      const sortedCourses = trendingCourses
        .map((course) => ({
          ...course,
          recentEnrollments: course.tbl_course_enrollments.length,
        }))
        .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
        .slice(0, limit);

      // Format lại kết quả trả về
      return sortedCourses.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price ? Number(course.price) : 0,
        rating: course.rating ? Number(Number(course.rating).toFixed(1)) : 0,
        recentEnrollments: course.recentEnrollments,
        isBestSeller: course.isBestSeller,
        isRecommended: course.isRecommended,
        instructor: course.tbl_instructors
          ? {
              instructorId: course.tbl_instructors.instructorId,
              instructorName: course.tbl_instructors.instructorName,
              profilePicture: course.tbl_instructors.profilePicture,
            }
          : null,
        categories: course.tbl_course_categories.map((cc) => ({
          categoryId: cc.categoryId,
          name: cc.tbl_categories?.name,
        })),
      }));
    } catch (error) {
      console.error('Error fetching trending courses:', error);
      throw error;
    }
  }
}

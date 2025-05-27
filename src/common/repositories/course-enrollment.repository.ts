import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CourseEnrollmentRepository {
  private readonly logger = new Logger(CourseEnrollmentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đăng ký khóa học mới cho người dùng
   */
  async createEnrollment(data: {
    userId: string;
    courseId: string;
    paymentId?: string;
  }): Promise<any> {
    try {
      // Kiểm tra nếu đăng ký đã tồn tại
      const existingEnrollment =
        await this.prisma.tbl_course_enrollments.findFirst({
          where: {
            userId: data.userId,
            courseId: data.courseId,
          },
        });

      if (existingEnrollment) {
        this.logger.log(
          `Người dùng ${data.userId} đã đăng ký khóa học ${data.courseId} trước đó`,
        );
        return existingEnrollment;
      }

      // Tạo đăng ký mới
      const courseEnrollmentId = uuidv4();
      const enrollment = await this.prisma.tbl_course_enrollments.create({
        data: {
          courseEnrollmentId,
          userId: data.userId,
          courseId: data.courseId,
          enrolledAt: new Date(),
        },
      });

      this.logger.log(`Đã tạo đăng ký khóa học mới: ${courseEnrollmentId}`);
      return enrollment;
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo đăng ký khóa học: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lấy danh sách các khóa học mà người dùng đã đăng ký
   */
  async getEnrollmentsByUserId(userId: string): Promise<any[]> {
    try {
      // Lấy danh sách các khóa học kèm thông tin chi tiết
      const enrollments = await this.prisma.tbl_course_enrollments.findMany({
        where: {
          userId,
        },
        include: {
          tbl_courses: {
            select: {
              courseId: true,
              title: true,
              description: true,
              thumbnail: true,
              price: true,
              rating: true,
              tbl_instructors: {
                select: {
                  instructorId: true,
                  instructorName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      });

      // Format lại dữ liệu trả về, đặc biệt là trường rating
      return enrollments.map((enrollment) => ({
        ...enrollment,
        tbl_courses: enrollment.tbl_courses
          ? {
              ...enrollment.tbl_courses,
              rating: enrollment.tbl_courses.rating
                ? Number(Number(enrollment.tbl_courses.rating).toFixed(1))
                : 0,
            }
          : null,
      }));
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách khóa học đã đăng ký: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Kiểm tra xem người dùng đã đăng ký khóa học chưa
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    try {
      const enrollment = await this.prisma.tbl_course_enrollments.findFirst({
        where: {
          userId,
          courseId,
        },
      });

      return !!enrollment;
    } catch (error) {
      this.logger.error(
        `Lỗi khi kiểm tra đăng ký khóa học: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lấy tất cả người dùng đã đăng ký một khóa học
   */
  async getUsersEnrolledInCourse(courseId: string): Promise<any[]> {
    try {
      const enrollments = await this.prisma.tbl_course_enrollments.findMany({
        where: {
          courseId,
        },
        include: {
          tbl_users: {
            select: {
              userId: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      });

      return enrollments;
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách người dùng đăng ký khóa học: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

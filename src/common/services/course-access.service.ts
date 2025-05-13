import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCheckService } from './role-check.service';

@Injectable()
export class CourseAccessService {
  private readonly logger = new Logger(CourseAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleCheckService: RoleCheckService,
  ) {}

  /**
   * Kiểm tra quyền truy cập khóa học của người dùng
   * Người dùng có quyền truy cập nếu:
   * 1. Họ đã mua khóa học (đã đăng ký)
   * 2. Họ là instructor của khóa học
   */
  async checkCourseAccess(userId: string, courseId: string): Promise<{
    hasAccess: boolean;
    isEnrolled: boolean;
    isInstructor: boolean;
  }> {
    try {
      this.logger.log(`Kiểm tra quyền truy cập khóa học ${courseId} cho người dùng ${userId}`);
      
      // Kiểm tra xem người dùng đã đăng ký khóa học chưa
      const enrollment = await this.prisma.tbl_course_enrollments.findFirst({
        where: {
          userId,
          courseId,
        },
      });
      
      const isEnrolled = !!enrollment;
      
      // Kiểm tra xem người dùng có phải là instructor của khóa học không
      const course = await this.prisma.tbl_courses.findUnique({
        where: { courseId },
        include: {
          tbl_instructors: true,
        },
      });
      
      let isInstructor = false;
      
      if (course?.tbl_instructors) {
        isInstructor = course.tbl_instructors.userId === userId;
      }
      
      // Người dùng có quyền truy cập nếu họ đã đăng ký hoặc là instructor
      const hasAccess = isEnrolled || isInstructor;
      
      return {
        hasAccess,
        isEnrolled,
        isInstructor,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra quyền truy cập khóa học: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
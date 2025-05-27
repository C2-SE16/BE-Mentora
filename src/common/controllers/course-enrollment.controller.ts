import { Controller, Get, Param, UseGuards, Request, Logger, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentService } from '../services/course-enrollment.service';

@ApiTags('Course Enrollments')
@Controller('enrollments')
export class CourseEnrollmentController {
  private readonly logger = new Logger(CourseEnrollmentController.name);

  constructor(
    private readonly courseEnrollmentService: CourseEnrollmentService
  ) {}

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách khóa học đã đăng ký của người dùng hiện tại' })
  async getMyEnrollments(@Request() req) {
    try {
      const userId = req.user.userId || req.user.sub;
      this.logger.log(`Lấy danh sách khóa học đã đăng ký của người dùng ${userId}`);
      
      const enrollments = await this.courseEnrollmentService.getUserEnrollments(userId);
      
      return {
        success: true,
        data: enrollments.map(enrollment => ({
          enrollmentId: enrollment.courseEnrollmentId,
          enrolledAt: enrollment.enrolledAt,
          course: enrollment.tbl_courses ? {
            courseId: enrollment.tbl_courses.courseId,
            title: enrollment.tbl_courses.title,
            description: enrollment.tbl_courses.description,
            thumbnail: enrollment.tbl_courses.thumbnail,
            price: enrollment.tbl_courses.price,
            rating: enrollment.tbl_courses.rating,
            instructor: enrollment.tbl_courses.tbl_instructors ? {
              instructorId: enrollment.tbl_courses.tbl_instructors.instructorId,
              instructorName: enrollment.tbl_courses.tbl_instructors.instructorName,
              profilePicture: enrollment.tbl_courses.tbl_instructors.profilePicture,
            } : null
          } : null
        }))
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách khóa học đã đăng ký: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('check/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra xem người dùng đã đăng ký khóa học chưa' })
  async checkEnrollment(@Request() req, @Param('courseId') courseId: string) {
    try {
      const userId = req.user.userId || req.user.sub;
      this.logger.log(`Kiểm tra đăng ký khóa học ${courseId} của người dùng ${userId}`);
      
      const isEnrolled = await this.courseEnrollmentService.checkEnrollmentStatus(userId, courseId);
      
      return {
        success: true,
        data: {
          isEnrolled
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra đăng ký khóa học: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã đăng ký khóa học' })
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    try {
      this.logger.log(`Lấy danh sách người dùng đã đăng ký khóa học ${courseId}`);
      
      const enrollments = await this.courseEnrollmentService.getCourseEnrollments(courseId);
      
      return {
        success: true,
        data: enrollments.map(enrollment => ({
          enrollmentId: enrollment.courseEnrollmentId,
          enrolledAt: enrollment.enrolledAt,
          user: enrollment.tbl_users ? {
            userId: enrollment.tbl_users.userId,
            fullName: enrollment.tbl_users.fullName,
            email: enrollment.tbl_users.email,
            avatar: enrollment.tbl_users.avatar
          } : null
        }))
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách người dùng đã đăng ký: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
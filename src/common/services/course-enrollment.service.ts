import { Injectable, Logger } from '@nestjs/common';
import { CourseEnrollmentRepository } from '../repositories/course-enrollment.repository';

@Injectable()
export class CourseEnrollmentService {
  private readonly logger = new Logger(CourseEnrollmentService.name);

  constructor(
    private readonly courseEnrollmentRepository: CourseEnrollmentRepository
  ) {}

  /**
   * Đăng ký khóa học cho người dùng
   */
  async enrollUserToCourse(data: {
    userId: string;
    courseId: string;
    paymentId?: string;
  }): Promise<any> {
    try {
      this.logger.log(`Đăng ký người dùng ${data.userId} vào khóa học ${data.courseId}`);
      return await this.courseEnrollmentRepository.createEnrollment(data);
    } catch (error) {
      this.logger.error(`Lỗi khi đăng ký khóa học: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy danh sách khóa học đã đăng ký của người dùng
   */
  async getUserEnrollments(userId: string): Promise<any[]> {
    try {
      this.logger.log(`Lấy danh sách khóa học đã đăng ký của người dùng ${userId}`);
      return await this.courseEnrollmentRepository.getEnrollmentsByUserId(userId);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách khóa học đã đăng ký: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Kiểm tra xem người dùng đã đăng ký khóa học chưa
   */
  async checkEnrollmentStatus(userId: string, courseId: string): Promise<boolean> {
    try {
      this.logger.log(`Kiểm tra trạng thái đăng ký khóa học ${courseId} của người dùng ${userId}`);
      return await this.courseEnrollmentRepository.isEnrolled(userId, courseId);
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra trạng thái đăng ký: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy danh sách người dùng đã đăng ký khóa học
   */
  async getCourseEnrollments(courseId: string): Promise<any[]> {
    try {
      this.logger.log(`Lấy danh sách người dùng đã đăng ký khóa học ${courseId}`);
      return await this.courseEnrollmentRepository.getUsersEnrolledInCourse(courseId);
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách người dùng đã đăng ký: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
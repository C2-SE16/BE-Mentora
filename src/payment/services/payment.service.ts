import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaypalService } from './paypal.service';
import { UpdateInstructorPaypalDto } from '../dto/update-instructor-paypal.dto';
import { EmailService } from '../../common/services/email.service';
import { v4 as uuidv4 } from 'uuid';
import { VerifyPaypalDto } from '../dto/verify-paypal.dto';
import { UpdateCoursePriceDto } from '../../common/dto/update-course-price.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private paypalService: PaypalService,
    private emailService: EmailService,
  ) {}

  /**
   * Cập nhật tài khoản PayPal cho instructor
   */
  async updateInstructorPaypalInfo(
    instructorId: string,
    updateDto: UpdateInstructorPaypalDto,
  ) {
    try {
      // Kiểm tra xem instructor có tồn tại không
      const instructor = await this.prisma.tbl_instructors.findUnique({
        where: { instructorId },
        include: {
          tbl_users: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!instructor) {
        throw new NotFoundException('Không tìm thấy instructor');
      }

      // Kiểm tra tính hợp lệ của email PayPal
      const isValid = await this.paypalService.validatePaypalEmail(
        updateDto.paypalEmail,
      );
      if (!isValid) {
        throw new BadRequestException('Email PayPal không hợp lệ');
      }

      // Tạo token xác nhận và thời hạn (24 giờ)
      const verificationToken = uuidv4();
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 24);

      // Cập nhật thông tin PayPal cho instructor với trạng thái chưa xác minh
      const updatedInstructor = await this.prisma.tbl_instructors.update({
        where: { instructorId },
        data: {
          paypalEmail: updateDto.paypalEmail,
          isPaypalVerified: false,
          paypalVerificationToken: verificationToken,
          paypalVerificationTokenExp: tokenExpiration,
          updatedAt: new Date(),
        },
      });

      // Gửi email xác nhận cho instructor và địa chỉ PayPal
      if (instructor.tbl_users?.email) {
        const baseUrl = process.env.APP_URL;
        const verificationUrl = `${baseUrl}/payment/verify-paypal?token=${verificationToken}`;

        try {
          await this.emailService.sendPaypalVerificationEmail(
            instructor.tbl_users.email,
            instructor.instructorName || 'Instructor',
            updateDto.paypalEmail,
            verificationUrl,
          );
        } catch (error) {
          this.logger.error(`Lỗi khi gửi email xác nhận: ${error.message}`);
          // Vẫn tiếp tục vì đã lưu thông tin trong database
        }
      }

      return {
        success: true,
        message:
          'Đã thêm tài khoản PayPal. Vui lòng kiểm tra email để xác nhận.',
        data: {
          instructorId: updatedInstructor.instructorId,
          paypalEmail: updatedInstructor.paypalEmail,
          isVerified: updatedInstructor.isPaypalVerified,
        },
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thông tin PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Xác nhận tài khoản PayPal thông qua token từ email
   */
  async verifyPaypalAccount(verifyDto: VerifyPaypalDto) {
    try {
      const { token } = verifyDto;

      // Tìm instructor với token cần xác nhận
      const instructor = await this.prisma.tbl_instructors.findFirst({
        where: {
          paypalVerificationToken: token,
          paypalVerificationTokenExp: {
            gt: new Date(), // Token chưa hết hạn
          },
        },
      });

      if (!instructor) {
        throw new NotFoundException('Token không hợp lệ hoặc đã hết hạn');
      }

      // Nếu đã xác minh rồi
      if (instructor.isPaypalVerified) {
        return {
          success: true,
          message: 'Tài khoản PayPal đã được xác minh trước đó',
        };
      }

      // Cập nhật trạng thái xác minh
      await this.prisma.tbl_instructors.update({
        where: { instructorId: instructor.instructorId },
        data: {
          isPaypalVerified: true,
          paypalVerificationToken: null, // Xóa token sau khi xác minh
          paypalVerificationTokenExp: null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Tài khoản PayPal đã được xác minh thành công',
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xác minh tài khoản PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy thông tin tài khoản PayPal của instructor
   */
  async getInstructorPaypalInfo(instructorId: string) {
    try {
      console.log('instructorId::', instructorId);
      const instructor = await this.prisma.tbl_instructors.findUnique({
        where: { instructorId },
        select: {
          instructorId: true,
          instructorName: true,
          paypalEmail: true,
          isPaypalVerified: true,
        },
      });
      // const instructor02 = await this.prisma.tbl_users.findUnique({
      //   where: {
      //     userId: instructorId,
      //   },
      // });
      // console.log('instructor::', instructor02);
      if (!instructor) {
        throw new NotFoundException('Không tìm thấy instructor');
      }

      return {
        success: true,
        data: instructor,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thông tin PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tính toán số tiền thanh toán cho instructor dựa trên doanh thu từ các khóa học
   * Lưu ý: Đây là logic đơn giản, bạn cần điều chỉnh theo mô hình doanh thu của mình
   */
  async calculateInstructorPayout(instructorId: string) {
    try {
      // Lấy thông tin về các khóa học của instructor và đơn hàng
      const instructor = await this.prisma.tbl_instructors.findUnique({
        where: { instructorId },
        include: {
          tbl_courses: {
            include: {
              tbl_order_details: true,
            },
          },
        },
      });

      if (!instructor) {
        throw new NotFoundException('Không tìm thấy instructor');
      }

      // Kiểm tra xác minh PayPal trước khi cho phép rút tiền
      if (!instructor.isPaypalVerified) {
        throw new BadRequestException(
          'Tài khoản PayPal chưa được xác minh. Vui lòng xác minh trước khi thực hiện thanh toán.',
        );
      }

      // Tính tổng doanh thu từ các khóa học
      let totalRevenue = 0;

      instructor.tbl_courses.forEach((course) => {
        course.tbl_order_details.forEach((orderDetail) => {
          if (orderDetail.finalPrice) {
            totalRevenue += parseFloat(orderDetail.finalPrice.toString());
          }
        });
      });

      // Tính toán phần trăm doanh thu dành cho instructor (ví dụ: 70%)
      const instructorShare = totalRevenue * 0.7;

      return {
        success: true,
        data: {
          instructorId,
          totalRevenue,
          instructorShare,
          platformFee: totalRevenue - instructorShare,
          paypalEmail: instructor.paypalEmail,
          isPaypalVerified: instructor.isPaypalVerified,
        },
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi tính toán thanh toán cho instructor: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gửi lại email xác nhận tài khoản PayPal
   */
  async resendPaypalVerificationEmail(instructorId: string) {
    try {
      const instructor = await this.prisma.tbl_instructors.findUnique({
        where: { instructorId },
        include: {
          tbl_users: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!instructor) {
        throw new NotFoundException('Không tìm thấy instructor');
      }

      if (instructor.isPaypalVerified) {
        throw new ConflictException('Tài khoản PayPal đã được xác minh');
      }

      if (!instructor.paypalEmail) {
        throw new BadRequestException('Chưa có tài khoản PayPal được đăng ký');
      }

      // Tạo token xác nhận mới
      const verificationToken = uuidv4();
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 24);

      // Cập nhật token xác nhận mới
      await this.prisma.tbl_instructors.update({
        where: { instructorId },
        data: {
          paypalVerificationToken: verificationToken,
          paypalVerificationTokenExp: tokenExpiration,
          updatedAt: new Date(),
        },
      });

      if (instructor.tbl_users?.email) {
        const baseUrl = process.env.APP_URL || 'http://localhost:9090';
        const verificationUrl = `${baseUrl}/payment/verify-paypal?token=${verificationToken}`;

        await this.emailService.sendPaypalVerificationEmail(
          instructor.tbl_users.email,
          instructor.instructorName || 'Instructor',
          instructor.paypalEmail,
          verificationUrl,
        );
      }

      return {
        success: true,
        message:
          'Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư của bạn.',
      };
    } catch (error) {
      this.logger.error(`Lỗi khi gửi lại email xác nhận: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cập nhật giá tiền cho khóa học với điều kiện instructor đã xác minh PayPal
   */
  async updateCoursePrice(userId: string, updateDto: UpdateCoursePriceDto) {
    try {
      // Tìm instructor dựa trên userId
      const instructor = await this.prisma.tbl_instructors.findFirst({
        where: { userId },
      });

      if (!instructor) {
        throw new NotFoundException('Không tìm thấy thông tin instructor');
      }

      // Kiểm tra xem instructor đã xác minh PayPal chưa
      if (!instructor.isPaypalVerified || !instructor.paypalEmail) {
        throw new ForbiddenException(
          'Bạn cần xác minh tài khoản PayPal trước khi đặt giá cho khóa học',
        );
      }

      // Tìm khóa học và kiểm tra quyền sở hữu
      const course = await this.prisma.tbl_courses.findUnique({
        where: { courseId: updateDto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Không tìm thấy khóa học');
      }

      if (course.instructorId !== instructor.instructorId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật khóa học này',
        );
      }

      // Cập nhật giá khóa học
      const updatedCourse = await this.prisma.tbl_courses.update({
        where: { courseId: updateDto.courseId },
        data: {
          price: updateDto.price.toString(), // Chuyển đổi thành string vì prisma schema lưu price là string
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Cập nhật giá khóa học thành công',
        data: {
          courseId: updatedCourse.courseId,
          title: updatedCourse.title,
          price: updatedCourse.price ? Number(updatedCourse.price) : 0,
        },
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật giá khóa học: ${error.message}`);
      throw error;
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  UnauthorizedException,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { UpdateInstructorPaypalDto } from '../dto/update-instructor-paypal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RoleCheckService } from '../../common/services/role-check.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VerifyPaypalDto } from '../dto/verify-paypal.dto';
import { UpdateCoursePriceDto } from '../../common/dto/update-course-price.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly roleCheckService: RoleCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('instructor/:instructorId/paypal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật thông tin tài khoản PayPal cho instructor',
  })
  async updateInstructorPaypalInfo(
    @Param('instructorId') instructorId: string,
    @Body() updateDto: UpdateInstructorPaypalDto,
    @Request() req,
  ) {
    this.logger.log(
      `Yêu cầu cập nhật PayPal: ${JSON.stringify({
        requestedInstructorId: instructorId,
        userRole: req.user.role,
        userInstructorId: req.user.instructorId,
      })}`,
    );

    // Kiểm tra xem người dùng có đúng là instructor này hoặc là admin không
    if (req.user.role !== 'ADMIN' && req.user.instructorId !== instructorId) {
      throw new UnauthorizedException(
        'Bạn không có quyền cập nhật thông tin này',
      );
    }

    return this.paymentService.updateInstructorPaypalInfo(
      instructorId,
      updateDto,
    );
  }

  @Get('instructor/:instructorId/paypal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản PayPal của instructor' })
  async getInstructorPaypalInfo(
    @Param('instructorId') instructorId: string,
    @Request() req,
  ) {
    this.logger.log(
      `Yêu cầu xem PayPal: ${JSON.stringify({
        requestedInstructorId: instructorId,
        userRole: req.user.role,
        userInstructorId: req.user.instructorId,
      })}`,
    );

    // Kiểm tra xem người dùng có đúng là instructor này hoặc là admin không
    if (req.user.role !== 'ADMIN' && req.user.instructorId !== instructorId) {
      throw new UnauthorizedException('Bạn không có quyền xem thông tin này');
    }

    return this.paymentService.getInstructorPaypalInfo(instructorId);
  }

  @Get('instructor/:instructorId/payout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tính toán số tiền thanh toán cho instructor' })
  async calculateInstructorPayout(
    @Param('instructorId') instructorId: string,
    @Request() req,
  ) {
    this.logger.log(
      `Yêu cầu tính toán thanh toán: ${JSON.stringify({
        requestedInstructorId: instructorId,
        userRole: req.user.role,
        userInstructorId: req.user.instructorId,
      })}`,
    );

    // Kiểm tra xem người dùng có đúng là instructor này hoặc là admin không
    if (req.user.role !== 'ADMIN' && req.user.instructorId !== instructorId) {
      throw new UnauthorizedException('Bạn không có quyền xem thông tin này');
    }

    return this.paymentService.calculateInstructorPayout(instructorId);
  }

  @Get('my-instructor-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin instructor của người dùng hiện tại' })
  async getMyInstructorInfo(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    const isInstructor = await this.roleCheckService.isInstructor(userId);
    const instructorId = isInstructor
      ? await this.roleCheckService.getInstructorId(userId)
      : null;

    return {
      success: true,
      data: {
        userId,
        role: req.user.role,
        isInstructorInDatabase: isInstructor,
        instructorId,
      },
    };
  }

  @Get('my-paypal-verification-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Kiểm tra trạng thái xác thực tài khoản PayPal của instructor hiện tại',
  })
  async getMyPaypalVerificationStatus(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    const isInstructor = await this.roleCheckService.isInstructor(userId);

    if (!isInstructor) {
      throw new UnauthorizedException('Bạn không phải là instructor');
    }

    const instructorId = await this.roleCheckService.getInstructorId(userId);

    if (!instructorId) {
      throw new UnauthorizedException('Không tìm thấy thông tin instructor');
    }

    // Lấy thông tin chi tiết về trạng thái xác thực PayPal
    const instructor = await this.prisma.tbl_instructors.findUnique({
      where: { instructorId },
      select: {
        instructorId: true,
        instructorName: true,
        paypalEmail: true,
        isPaypalVerified: true,
        paypalVerificationToken: true,
        paypalVerificationTokenExp: true,
      },
    });

    if (!instructor) {
      throw new UnauthorizedException('Không tìm thấy thông tin instructor');
    }

    const isTokenExpired =
      instructor.paypalVerificationTokenExp &&
      instructor.paypalVerificationTokenExp < new Date();

    return {
      success: true,
      data: {
        instructorId: instructor.instructorId,
        instructorName: instructor.instructorName || undefined,
        paypalEmail: instructor.paypalEmail || undefined,
        isVerified: instructor.isPaypalVerified || false,
        hasPendingVerification: !!(
          instructor.paypalVerificationToken && !isTokenExpired
        ),
        tokenExpired: isTokenExpired || false,
      },
    };
  }

  @Post('my-resend-paypal-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gửi lại email xác nhận tài khoản PayPal cho instructor hiện tại',
  })
  async resendMyPaypalVerification(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    const isInstructor = await this.roleCheckService.isInstructor(userId);

    if (!isInstructor) {
      throw new UnauthorizedException('Bạn không phải là instructor');
    }

    const instructorId = await this.roleCheckService.getInstructorId(userId);

    if (!instructorId) {
      throw new UnauthorizedException('Không tìm thấy thông tin instructor');
    }

    return this.paymentService.resendPaypalVerificationEmail(instructorId);
  }

  @Get('verify-paypal')
  @ApiOperation({ summary: 'Xác minh tài khoản PayPal qua token' })
  async verifyPaypalAccount(@Request() req) {
    const verifyDto: VerifyPaypalDto = { token: req.query.token };
    return this.paymentService.verifyPaypalAccount(verifyDto);
  }

  @Post('course/update-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật giá tiền cho khóa học (yêu cầu xác minh PayPal)',
  })
  async updateCoursePrice(
    @Body() updateDto: UpdateCoursePriceDto,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    this.logger.log(
      `Yêu cầu cập nhật giá khóa học: ${JSON.stringify({
        courseId: updateDto.courseId,
        price: updateDto.price,
        userId: userId,
      })}`,
    );

    return this.paymentService.updateCoursePrice(userId, updateDto);
  }
}

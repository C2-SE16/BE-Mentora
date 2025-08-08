import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from '../services/voucher.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApplyVoucherDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../dto/voucher.dto';
import { UserId } from '../decorators/userid.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../decorators/user-role.decorator';
import { ROLE } from '../constants/role.constant';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get('active-site-voucher')
  async getActiveSiteVoucher() {
    return this.voucherService.getActiveSiteVoucher();
  }

  @Post('create-voucher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.voucherService.createVoucher(createVoucherDto, userId, role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async getVouchers(@UserId() userId: string, @UserRole() userRole: string) {
    if (userRole === ROLE.ADMIN) {
      return this.voucherService.getAllVouchers();
    } else if (userRole === ROLE.INSTRUCTOR) {
      return this.voucherService.getInstructorVouchers(userId);
    } else {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
  }

  @Get('applicable-for-course/:courseId')
  async getApplicableVouchersForCourse(@Param('courseId') courseId: string) {
    return this.voucherService.getApplicableVouchersForCourse(courseId);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyVoucher(
    @UserId() userId: string,
    @Body() applyVoucherDto: ApplyVoucherDto,
  ) {
    return this.voucherService.applyVoucher(userId, applyVoucherDto);
  }

  @Post('apply-to-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  async applyVoucherToAllCourses(
    @UserId() userId: string,
    @Body() data: { code: string },
  ) {
    return this.voucherService.applyVoucherToAllCourses(userId, data.code);
  }

  @Post('discount-courses-info')
  async getDiscountedCoursesInfo(@Body() data: { courseIds: string[] }) {
    return this.voucherService.getDiscountedCoursesInfo(data.courseIds);
  }

  @Delete(':voucherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async deleteVoucher(
    @Param('voucherId') voucherId: string,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ) {
    return this.voucherService.deleteVoucher(voucherId, userId, userRole);
  }

  @Put(':voucherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async updateVoucher(
    @Param('voucherId') voucherId: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ) {
    return this.voucherService.updateVoucher(
      voucherId,
      updateVoucherDto,
      userId,
      userRole,
    );
  }

  @Get(':voucherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async getVoucherById(@Param('voucherId') voucherId: string) {
    return this.voucherService.getVoucherById(voucherId);
  }

  @Patch(':voucherId/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.INSTRUCTOR)
  async toggleVoucherActive(
    @Param('voucherId') voucherId: string,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ) {
    return this.voucherService.toggleVoucherActive(voucherId, userId, userRole);
  }

  @Post('apply-and-save-db')
  @UseGuards(JwtAuthGuard)
  async applyVoucherAndSaveToDB(
    @UserId() userId: string,
    @Body() applyVoucherDto: ApplyVoucherDto,
  ) {
    return this.voucherService.applyVoucherAndSaveToDB(userId, applyVoucherDto);
  }
}

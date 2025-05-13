import { Controller, Get, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseAccessService } from '../services/course-access.service';

@ApiTags('Course Access')
@Controller('course-access')
export class CourseAccessController {
  private readonly logger = new Logger(CourseAccessController.name);

  constructor(
    private readonly courseAccessService: CourseAccessService
  ) {}

  @Get(':courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra quyền truy cập khóa học của người dùng' })
  async checkCourseAccess(@Request() req, @Param('courseId') courseId: string) {
    try {
      const userId = req.user.userId || req.user.sub;
      this.logger.log(`Kiểm tra quyền truy cập khóa học ${courseId} cho người dùng ${userId}`);
      
      const accessInfo = await this.courseAccessService.checkCourseAccess(userId, courseId);
      
      return {
        success: true,
        data: {
          ...accessInfo,
          message: accessInfo.hasAccess 
            ? accessInfo.isInstructor 
              ? 'Bạn là người tạo khóa học này' 
              : 'Bạn đã mua khóa học này'
            : 'Bạn chưa mua khóa học này'
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra quyền truy cập khóa học: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
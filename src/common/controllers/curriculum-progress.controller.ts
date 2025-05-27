import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProgressService } from '../services/progress.service';
import { LectureProgressGuard } from '../guards/lecture-progress.guard';

@Controller('curriculum-progress')
export class CurriculumProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  async getCourseProgress(@Param('courseId') courseId: string, @Req() req) {
    try {
      const userId = req.user.userId;
      const result = await this.progressService.getCourseProgress(userId, courseId);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error getting course progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':curriculumId')
  async checkCurriculumCompletion(
    @Param('curriculumId') curriculumId: string,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.progressService.hasCurriculumCompleted(
        userId,
        curriculumId,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error checking curriculum completion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, LectureProgressGuard)
  @Get('can-proceed/:currentCurriculumId/:nextCurriculumId')
  async canProceedToNextCurriculum(
    @Param('currentCurriculumId') currentCurriculumId: string,
    @Param('nextCurriculumId') nextCurriculumId: string,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.progressService.canProceedToNextCurriculum(
        userId,
        currentCurriculumId,
        nextCurriculumId,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error checking ability to proceed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-access')
  async checkAccessToNextCurriculum(
    @Body() body: { currentCurriculumId: string; nextCurriculumId?: string },
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      const { currentCurriculumId, nextCurriculumId } = body;
      
      const result = await this.progressService.canProceedToNextCurriculum(
        userId,
        currentCurriculumId,
        nextCurriculumId,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error checking access to next curriculum',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 
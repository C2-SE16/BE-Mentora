import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Put,
  Delete,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProgressService } from 'src/common/services/progress.service';
import {
  CreateCurriculumProgressDto,
  CreateLectureProgressDto,
  UpdateCurriculumProgressDto,
  UpdateLectureProgressDto,
} from 'src/common/dto/progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) { }

  @UseGuards(JwtAuthGuard)
  @Post('curriculum')
  async createCurriculumProgress(
    @Body() createCurriculumProgressDto: CreateCurriculumProgressDto,
    @Req() req,
  ) {
    try {
      createCurriculumProgressDto.userId = req.user.userId;
      const result = await this.progressService.createCurriculumProgress(
        createCurriculumProgressDto,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Error creating curriculum progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('lecture')
  async createLectureProgress(
    @Body() createLectureProgressDto: CreateLectureProgressDto,
    @Req() req,
  ) {
    try {
      createLectureProgressDto.userId = req.user.userId;
      const result = await this.progressService.createLectureProgress(
        createLectureProgressDto,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Error creating lecture progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('curriculum')
  async updateCurriculumProgress(
    @Body() updateCurriculumProgressDto: UpdateCurriculumProgressDto,
  ) {
    try {
      const result = await this.progressService.updateCurriculumProgress(
        updateCurriculumProgressDto,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Error updating curriculum progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('lecture')
  async updateLectureProgress(
    @Body() updateLectureProgressDto: UpdateLectureProgressDto,
  ) {
    try {
      const result = await this.progressService.updateLectureProgress(
        updateLectureProgressDto,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Error updating lecture progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserProgress(@Req() req) {
    try {
      const result = await this.progressService.getUserProgress(
        req.user.userId,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Error getting user progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('lecture-completion/:lectureId')
  async checkLectureCompletion(
    @Param('lectureId') lectureId: string,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.progressService.hasCompletedTwoThirds(
        userId,
        lectureId,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error checking lecture completion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('can-proceed/:currentLectureId/:nextLectureId')
  async canProceedToNextLecture(
    @Param('currentLectureId') currentLectureId: string,
    @Param('nextLectureId') nextLectureId: string,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.progressService.canProceedToNextLecture(
        userId,
        currentLectureId,
        nextLectureId,
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
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post, 
  Put,
} from '@nestjs/common';
import { LessonService } from '../services/lesson.service';
import { CreateLessonDto, UpdateLessonDto, CreateEmptyLessonDto, AddLessonContentDto } from '../dto/lesson.dto';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  async createEmptyLesson(@Body() createEmptyLessonDto: CreateEmptyLessonDto) {
    try {
      const lesson = await this.lessonService.createEmptyLesson(createEmptyLessonDto);
      return {
        success: true,
        data: lesson,
        message: 'Bài học trống đã được tạo thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể tạo bài học trống',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':lessonId/content')
  async addLessonContent(
    @Param('lessonId') lessonId: string,
    @Body() contentData: AddLessonContentDto
  ) {
    try {
      const lesson = await this.lessonService.addLessonContent(lessonId, contentData);
      return {
        success: true,
        data: lesson,
        message: 'Nội dung bài học đã được thêm thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể thêm nội dung bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':lessonId')
  async getLessonById(@Param('lessonId') lessonId: string) {
    try {
      const lesson = await this.lessonService.getLessonById(lessonId);
      return {
        success: true,
        data: lesson,
        message: 'Lấy thông tin bài học thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy thông tin bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('module/:moduleId')
  async getLessonsByModuleId(@Param('moduleId') moduleId: string) {
    try {
      const lessons = await this.lessonService.getLessonsByModuleId(moduleId);
      return {
        success: true,
        data: lessons,
        message: 'Lấy danh sách bài học thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy danh sách bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':lessonId')
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    try {
      const lesson = await this.lessonService.updateLesson(
        lessonId,
        updateLessonDto,
      );
      return {
        success: true,
        data: lesson,
        message: 'Cập nhật bài học thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể cập nhật bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':lessonId')
  @HttpCode(HttpStatus.OK)
  async deleteLesson(@Param('lessonId') lessonId: string) {
    try {
      await this.lessonService.deleteLesson(lessonId);
      return {
        success: true,
        message: 'Xóa bài học thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể xóa bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reorder')
  async reorderLessons(
    @Body('moduleId') moduleId: string,
    @Body('lessonIds') lessonIds: string[],
  ) {
    try {
      const lessons = await this.lessonService.reorderLessons(moduleId, lessonIds);
      return {
        success: true,
        data: lessons,
        message: 'Sắp xếp lại bài học thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể sắp xếp lại bài học',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 
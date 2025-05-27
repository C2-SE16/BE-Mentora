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
import { LectureService } from '../services/lecture.service';
import { CreateLectureDto, UpdateLectureDto } from '../dto/lecture.dto';

@Controller('lectures')
export class LectureController {
  constructor(private readonly lectureService: LectureService) { }

  @Post()
  async createLecture(@Body() createLectureDto: CreateLectureDto) {
    try {
      const lecture = await this.lectureService.createLecture(createLectureDto);
      return {
        success: true,
        data: lecture,
        message: 'Lecture đã được tạo thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể tạo lecture',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':lectureId')
  async getLectureById(@Param('lectureId') lectureId: string) {
    try {
      const lecture = await this.lectureService.getLectureById(lectureId);
      return {
        success: true,
        data: lecture,
        message: 'Lấy thông tin lecture thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy thông tin lecture',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':lectureId')
  async updateLecture(
    @Param('lectureId') lectureId: string,
    @Body() updateLectureDto: UpdateLectureDto,
  ) {
    try {
      // Kiểm tra và loại bỏ giá trị duration bất thường trước khi gửi đến service
      if (updateLectureDto.duration !== undefined) {
        // Nếu duration quá lớn (lớn hơn 1000 giây ~ 16 phút), coi là bất thường
        if (updateLectureDto.duration > 1000) {
          console.log(`LectureController: Phát hiện duration bất thường (${updateLectureDto.duration} giây), loại bỏ khỏi dữ liệu cập nhật`);
          delete updateLectureDto.duration;
        }
      }

      const lecture = await this.lectureService.updateLecture(
        lectureId,
        updateLectureDto,
      );

      // Nếu cập nhật title hoặc description, cập nhật lại curriculum
      if (updateLectureDto.title || updateLectureDto.description) {
        await this.lectureService.syncCurriculumWithLecture(lectureId);
      }

      return {
        success: true,
        data: lecture,
        message: 'Cập nhật lecture thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể cập nhật lecture',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':lectureId')
  @HttpCode(HttpStatus.OK)
  async deleteLecture(@Param('lectureId') lectureId: string) {
    try {
      await this.lectureService.deleteLecture(lectureId);
      return {
        success: true,
        message: 'Xóa lecture thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể xóa lecture',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 
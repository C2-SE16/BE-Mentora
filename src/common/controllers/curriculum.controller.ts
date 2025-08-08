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
import { CurriculumService } from '../services/curriculum.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateEmptyCurriculumDto } from '../dto/curriculum.dto';

@Controller('curricula')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  async createEmptyCurriculum(@Body() createEmptyCurriculumDto: CreateEmptyCurriculumDto) {
    try {
      const curriculum = await this.curriculumService.createEmptyCurriculum(createEmptyCurriculumDto);
      return {
        success: true,
        data: curriculum,
        message: 'Curriculum đã được tạo thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể tạo curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':curriculumId')
  async getCurriculumById(@Param('curriculumId') curriculumId: string) {
    try {
      const curriculum = await this.curriculumService.getCurriculumWithContent(curriculumId);
      return {
        success: true,
        data: curriculum,
        message: 'Lấy thông tin curriculum thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy thông tin curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('module/:moduleId')
  async getCurriculaByModuleId(@Param('moduleId') moduleId: string) {
    try {
      const curricula = await this.curriculumService.getCurriculaByModuleId(moduleId);
      return {
        success: true,
        data: curricula,
        message: 'Lấy danh sách curriculum thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy danh sách curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':curriculumId')
  async updateCurriculum(
    @Param('curriculumId') curriculumId: string,
    @Body() updateCurriculumDto: UpdateCurriculumDto,
  ) {
    try {
      const curriculum = await this.curriculumService.updateCurriculum(
        curriculumId,
        updateCurriculumDto,
      );
      return {
        success: true,
        data: curriculum,
        message: 'Cập nhật curriculum thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể cập nhật curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':curriculumId')
  @HttpCode(HttpStatus.OK)
  async deleteCurriculum(@Param('curriculumId') curriculumId: string) {
    try {
      await this.curriculumService.deleteCurriculum(curriculumId);
      return {
        success: true,
        message: 'Xóa curriculum thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể xóa curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reorder')
  async reorderCurricula(
    @Body('moduleId') moduleId: string,
    @Body('curriculumIds') curriculumIds: string[],
  ) {
    try {
      const curricula = await this.curriculumService.reorderCurricula(moduleId, curriculumIds);
      return {
        success: true,
        data: curricula,
        message: 'Sắp xếp lại curriculum thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể sắp xếp lại curriculum',
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 
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
import { ReviewService } from 'src/common/services/review.service';
import { CreateReviewDto } from 'src/common/dto/comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DiscussingService } from 'src/common/services/discussing.service';
import {
  CreateDiscussingDto,
  UpdateDiscussingDto,
} from 'src/common/dto/discussing.dto';

@Controller('discussing')
export class DiscussingController {
  constructor(private readonly discussingService: DiscussingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createDiscussing(@Body() dto: CreateDiscussingDto, @Req() req) {
    try {
      dto.userId = req.user.userId;
      const discussing = await this.discussingService.createDiscussing(dto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Tạo discussing thành công',
        data: discussing,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('curriculum/:curriculumId')
  async getAllByCurriculumId(@Param('curriculumId') curriculumId: string) {
    try {
      const discussions =
        await this.discussingService.getAllByCurriculumId(curriculumId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Lấy danh sách discussing thành công',
        data: discussions,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':discussingId')
  @UseGuards(JwtAuthGuard)
  async updateDiscussing(
    @Param('discussingId') discussingId: string,
    @Body() dto: UpdateDiscussingDto,
    @Req() req,
  ) {
    try {
      const discussing = await this.discussingService.updateDiscussing(
        discussingId,
        dto,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Cập nhật discussing thành công',
        data: discussing,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':discussingId')
  @UseGuards(JwtAuthGuard)
  async deleteDiscussing(@Param('discussingId') discussingId: string) {
    try {
      const result =
        await this.discussingService.deleteDiscussing(discussingId);
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

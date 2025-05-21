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
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    try {
      const userId = req.user.userId;
      return await this.reviewService.createCourseReview({
        ...createReviewDto,
        userId,
      });
    } catch (error) {
      throw new HttpException(
        'Error creating review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':reviewId')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: CreateReviewDto,
  ) {
    try {
      console.log('vao controller: ' + reviewId);
      return await this.reviewService.updateCourseReview(
        reviewId,
        updateReviewDto,
      );
    } catch (error) {
      throw new HttpException(
        'Error updating review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':reviewId')
  async deleteReview(@Param('reviewId') reviewId: string) {
    try {
      return await this.reviewService.deleteCourseReview(reviewId);
    } catch (error) {
      throw new HttpException(
        'Error deleting review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('course/:courseId')
  async getReviewsFromCourseId(
    @Param('courseId') courseId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      return await this.reviewService.getAllReviewFromCourseId(
        courseId,
        Number(page),
        Number(limit),
      );
    } catch (error) {
      throw new HttpException(
        'Error getting reviews',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

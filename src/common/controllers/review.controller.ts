import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
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
      return await this.reviewService.createCourse({
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
}

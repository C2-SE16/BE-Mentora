import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from 'src/common/services/review.service';
import { CreateReviewDto } from 'src/common/dto/comment.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    try {
      return await this.reviewService.createCourse(createReviewDto);
    } catch (error) {
      throw new HttpException(
        'Error creating review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

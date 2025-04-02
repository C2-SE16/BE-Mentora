import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from 'src/common/dto/comment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCourse(body: CreateReviewDto) {
    const review = await this.prismaService.tbl_course_reviews.create({
      data: {
        reviewId: uuidv4(),
        courseId: body.courseId,
        userId: body.userId,
        rating: body.rating ? Number(body.rating) : 0,
        comment: body.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return {
      reviewId: review.courseId,
      courseId: review.courseId,
      userId: review.userId,
      rating: review.rating ? Number(review.rating) : 0,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.reviewId,
    };
  }
}

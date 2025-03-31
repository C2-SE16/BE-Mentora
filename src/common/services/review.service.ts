import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from 'src/common/dto/comment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  createCourse(body: CreateReviewDto) {
    return this.prismaService.tbl_course_reviews.create({
      data: {
        reviewId: uuidv4(),
        courseId: body.courseId,
        userId: body.userId,
        rating: body.rating,
        comment: body.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

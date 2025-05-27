import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReviewDto } from 'src/common/dto/comment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { validate as isUUID } from 'uuid';
@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCourseReview(body: CreateReviewDto) {
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
      reviewId: review.reviewId,
      courseId: review.courseId,
      userId: review.userId,
      rating: review.rating ? Number(review.rating) : 0,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async updateCourseReview(reviewId: string, body: CreateReviewDto) {
    try {
      if (!isUUID(reviewId)) {
        throw new Error(`Invalid UUID format: ${reviewId}`);
      }
      const newReview = await this.prismaService.tbl_course_reviews.update({
        where: { reviewId: reviewId },
        data: {
          rating: body.rating ?? undefined,
          comment: body.comment ?? undefined,
          updatedAt: new Date(),
        },
      });
      return {
        ...newReview,
        rating: newReview.rating ? Number(newReview.rating) : 0,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        console.error(`Không tìm thấy review với ID: ${reviewId}`);
        throw new HttpException(
          `Không tìm thấy review với ID: ${reviewId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        `Lỗi cập nhật review: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteCourseReview(reviewId: string) {
    try {
      if (!isUUID(reviewId)) {
        throw new Error(`Invalid review ID: ${reviewId}`);
      }

      const deletedReview = await this.prismaService.tbl_course_reviews.delete({
        where: { reviewId: reviewId },
      });
      return {
        message: `Successfully deleted review`,
        deletedReview: {
          reviewId: deletedReview.reviewId,
          courseId: deletedReview.courseId,
          userId: deletedReview.userId,
        },
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error(`Review with ID: ${reviewId} not found!`);
      }
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async getAllReviewFromCourseId(
    courseId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [rawReviews, total] = await this.prismaService.$transaction([
        this.prismaService.tbl_course_reviews.findMany({
          where: { courseId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            tbl_users: true,
          },
        }),
        this.prismaService.tbl_course_reviews.count({
          where: { courseId },
        }),
      ]);

      const reviews = rawReviews.map((review) => ({
        ...review,
        rating: review.rating ? Number(review.rating) : 0,
        tbl_users: {
          ...review.tbl_users,
          password: undefined,
          role: undefined,
        },
      }));

      const ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      for (const { rating } of reviews) {
        const rt = Number(rating);
        if (rt >= 1 && rt <= 5) {
          ratingCount[rt]++;
        }
      }

      return {
        reviews,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        ratingCount,
      };
    } catch (error) {
      throw new Error('Failed to fetch reviews');
    }
  }
}

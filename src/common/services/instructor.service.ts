import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from '../dto/create-instructor.dto';
import {
  InstructorDetailEntity,
  InstructorUserEntity,
  InstructorCourseEntity,
  InstructorStatisticsEntity,
} from '../../entities/instructor.entity';

@Injectable()
export class InstructorService {
  constructor(private prisma: PrismaService) {}

  async checkIsInstructor(userId: string) {
    const instructor = await this.prisma.tbl_instructors.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!instructor) {
      return {
        isInstructor: false,
        instructorId: null,
      };
    }

    return {
      isInstructor: true,
      instructorId: instructor.instructorId,
    };
  }

  async becomeInstructor(
    userId: string,
    createInstructorDto: CreateInstructorDto,
  ) {
    // Kiểm tra xem người dùng đã là instructor chưa
    const instructorCheck = await this.checkIsInstructor(userId);
    if (instructorCheck.isInstructor) {
      throw new ConflictException('User is already an instructor');
    }

    // Tạo instructor mới
    return this.prisma.tbl_instructors.create({
      data: {
        instructorId: crypto.randomUUID(),
        userId: userId,
        instructorName: createInstructorDto.instructorName,
        bio: createInstructorDto.bio,
        profilePicture: createInstructorDto.profilePicture,
        experience: createInstructorDto.experience,
        isVerified: false,
        average_rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getInstructorById(
    instructorId: string,
  ): Promise<InstructorDetailEntity> {
    try {
      const instructor = await this.prisma.tbl_instructors.findUnique({
        where: {
          instructorId: instructorId,
        },
        include: {
          tbl_users: {
            select: {
              userId: true,
              email: true,
              fullName: true,
              avatar: true,
              role: true,
              facebookLink: true,
              linkedinLink: true,
              websiteLink: true,
              youtubeLink: true,
              description: true,
              title: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          tbl_courses: {
            where: {
              approved: 'APPROVED',
            },
            include: {
              tbl_course_reviews: {
                select: {
                  rating: true,
                },
              },
              tbl_course_enrollments: true,
              tbl_course_categories: {
                include: {
                  tbl_categories: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      // Tính toán thống kê
      const totalCourses = instructor.tbl_courses.length;
      const totalStudents = instructor.tbl_courses.reduce(
        (sum, course) => sum + course.tbl_course_enrollments.length,
        0,
      );

      // Tính rating trung bình từ tất cả reviews của các khóa học
      const allReviews = instructor.tbl_courses.flatMap(
        (course) => course.tbl_course_reviews,
      );
      const averageRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, review) => sum + Number(review.rating), 0) /
            allReviews.length
          : 0;

      const userEntity = instructor.tbl_users
        ? new InstructorUserEntity(instructor.tbl_users)
        : null;

      const courseEntities = instructor.tbl_courses.map(
        (course) =>
          new InstructorCourseEntity({
            courseId: course.courseId,
            title: course.title || '',
            description: course.description,
            thumbnail: course.thumbnail,
            price: course.price ? Number(course.price) : 0,
            rating: course.rating ? Number(course.rating) : 0,
            durationTime: course.durationTime,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            enrollmentCount: course.tbl_course_enrollments.length,
            reviewCount: course.tbl_course_reviews.length,
            
          }),
      );

      const statisticsEntity = new InstructorStatisticsEntity({
        totalCourses,
        totalStudents,
        totalReviews: allReviews.length,
        averageRating: Number(averageRating.toFixed(1)),
      });

      return new InstructorDetailEntity({
        instructorId: instructor.instructorId,
        userId: instructor.userId,
        instructorName: instructor.instructorName,
        bio: instructor.bio,
        profilePicture: instructor.profilePicture,
        experience: instructor.experience,
        averageRating: Number(averageRating.toFixed(1)),
        isVerified: instructor.isVerified,
        paypalEmail: instructor.paypalEmail,
        isPaypalVerified: instructor.isPaypalVerified,
        createdAt: instructor.createdAt,
        updatedAt: instructor.updatedAt,
        user: userEntity,
        courses: courseEntities,
        statistics: statisticsEntity,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting instructor by ID:', error);
      throw new Error('Failed to get instructor information');
    }
  }
}

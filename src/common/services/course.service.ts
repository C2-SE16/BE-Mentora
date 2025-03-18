import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from '../dto/course.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, PrismaClient } from '@prisma/client';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';

const prisma = new PrismaClient();
// import { SearchCourseDto } from '../dto/search-course.dto';
import { Decimal } from '@prisma/client/runtime/library'; // Nếu bạn dùng Prisma
interface SearchCourseParams {
  query?: string;
  page?: number;
  limit?: number;
  minRating?: number;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
}
@Injectable()
export class CourseService {
  constructor(private readonly prismaService: PrismaService) {}

  createCourse(body: CreateCourseDto) {
    return this.prismaService.tbl_courses.create({
      data: {
        courseId: uuidv4(),
        title: body.title,
        description: body.description,
        overview: body.overview,
        durationTime: body.durationTime,
        price: body.price,
        instructorId: body.instructorId,
        approved: 'APPROVED',
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  getCourse() {
    return this.prismaService.tbl_courses.findMany();
  }

  getCourseById(courseId: string) {
    return this.prismaService.tbl_courses.findUnique({
      where: {
        courseId: courseId,
      },
    });
  }

  updateCourse(courseId: string, body: CreateCourseDto) {
    return this.prismaService.tbl_courses.update({
      where: {
        courseId: courseId,
      },
      data: {
        title: body.title,
        description: body.description,
        overview: body.overview,
        durationTime: body.durationTime,
        price: body.price,
        updatedAt: new Date(),
      },
    });
  }

  deleteCourse(courseId: string) {
    return this.prismaService.tbl_courses.delete({
      where: {
        courseId: courseId,
      },
    });
  }

  async createSimpleCourse(createCourseDto: CreateSimpleCourseDto) {
    try {
      // Lấy một instructor từ database
      const instructor = await this.prismaService.tbl_instructors.findFirst({
        where: {
          isVerified: true,
        },
      });

      if (!instructor) {
        throw new Error('No verified instructor found');
      }

      // Tạo khóa học mới với instructorId từ database
      const newCourse = await this.prismaService.tbl_courses.create({
        data: {
          courseId: uuidv4(),
          title: createCourseDto.title,
          instructorId: instructor.instructorId,
          approved: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Chỉ tạo liên kết với category nếu categoryId được cung cấp
      if (createCourseDto.categoryId) {
        await this.prismaService.tbl_course_categories.create({
          data: {
            courseCategoryId: uuidv4(),
            courseId: newCourse.courseId,
            categoryId: createCourseDto.categoryId,
          },
        });
      }

      // Trả về khóa học đã tạo kèm thông tin category và instructor
      return await this.prismaService.tbl_courses.findUnique({
        where: {
          courseId: newCourse.courseId,
        },
        include: {
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
          tbl_instructors: true,
        },
      });
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async getCourseWithDetails(courseId: string) {
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId: courseId },
      include: {
        tbl_course_reviews: true,
        tbl_course_learning_objectives: true,
        tbl_course_requirements: true,
        tbl_course_target_audience: true,
        tbl_modules: {
          include: {
            tbl_lessons: {
              include: {
                tbl_lesson_progess: true,
              },
            },
          },
        },
      },
    });

    if (!course) return null;

    return {
      courseId: course.courseId,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description,
      overview: course.overview,
      durationTime: course.durationTime,
      price: course.price ? Number(course.price) : 0,
      approved: course.approved,
      rating: course.rating ? Number(course.rating) : 0,
      comment: course.comment,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      reviews: course.tbl_course_reviews,
      learningObjectives: course.tbl_course_learning_objectives.map(
        (objective) => ({
          objectiveId: objective.objectiveId,
          courseId: objective.courseId,
          description: objective.description,
          orderIndex: objective.orderIndex,
          createdAt: objective.createdAt,
          updatedAt: objective.updatedAt,
        }),
      ),

      requirements: course.tbl_course_requirements.map((requirement) => ({
        requirementId: requirement.requirementId,
        courseId: requirement.courseId,
        description: requirement.description,
        orderIndex: requirement.orderIndex,
        createdAt: requirement.createdAt,
        updatedAt: requirement.updatedAt,
      })),

      targetAudience: course.tbl_course_target_audience.map((audience) => ({
        audienceId: audience.audienceId,
        courseId: audience.courseId,
        description: audience.description,
        orderIndex: audience.orderIndex,
        createdAt: audience.createdAt,
        updatedAt: audience.updatedAt,
      })),
      modules: course.tbl_modules.map((module) => ({
        moduleId: module.moduleId,
        courseId: module.courseId,
        title: module.title,
        orderIndex: module.orderIndex,
        description: module.description,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        lessons: module.tbl_lessons.map((lesson) => ({
          lessonId: lesson.lessonId,
          moduleId: lesson.moduleId,
          title: lesson.title,
          contentType: lesson.contentType,
          contentUrl: lesson.contentUrl,
          duration: lesson.duration,
          orderIndex: lesson.orderIndex,
          description: lesson.description,
          isFree: lesson.isFree,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
          progress: lesson.tbl_lesson_progess,
        })),
      })),
  async searchCourses(params: SearchCourseParams) {
    const {
      query,
      page = 1,
      limit = 10,
      minRating,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
    } = params;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.tbl_coursesWhereInput = {};

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (minRating) {
      whereClause.rating = { gte: minRating };
    }

    if (categoryId) {
      whereClause.tbl_course_categories = {
        some: { categoryId },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};

      if (minPrice !== undefined) {
        whereClause.price.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        whereClause.price.lte = maxPrice;
      }
    }

    // Đếm tổng số kết quả
    const totalCount = await this.prismaService.tbl_courses.count({
      where: whereClause,
    });

    // Lấy danh sách khóa học
    const courses = await this.prismaService.tbl_courses.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      include: {
        tbl_instructors: true,
        tbl_course_reviews: {
          select: {
            rating: true,
          },
        },
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
      },
    });

    // Format the response
    const formattedCourses = courses.map((course) => {
      const reviews = course.tbl_course_reviews || [];
      const totalRating = reviews.reduce(
        (sum, review) =>
          sum +
          (review.rating instanceof Decimal
            ? review.rating.toNumber()
            : review.rating || 0),
        0,
      );
      const averageRating =
        reviews.length > 0 ? totalRating / reviews.length : course.rating || 0;

      // Get instructor name
      const instructor = course.tbl_instructors
        ? course.tbl_instructors.userId || 'Unknown Instructor'
        : 'Unknown Instructor';

      return {
        id: course.courseId,
        title: course.title,
        description: course.description,
        price:
          course.price instanceof Decimal
            ? course.price.toNumber()
            : course.price,
        discountPrice:
          course.price instanceof Decimal
            ? course.price.toNumber()
            : course.price,
        // Use a default thumbnail path since the property doesn't exist
        thumbnail: `/courses/${course.courseId}.jpg`,
        instructor,
        instructorAvatar:
          course.tbl_instructors?.profilePicture || '/avatars/default.jpg',
        rating: averageRating,
        ratingCount: reviews.length,
        categories: course.tbl_course_categories.map((cc) => ({
          id: cc.tbl_categories?.categoryId,
          name: cc.tbl_categories?.categoryType,
        })),
      };
    });

    return {
      courses: formattedCourses,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

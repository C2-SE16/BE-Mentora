import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from '../dto/course.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDetailsDto } from '../dto/update-course-details.dto';

// import { SearchCourseDto } from '../dto/search-course.dto';
import { Decimal } from '@prisma/client/runtime/library'; // Nếu bạn dùng Prisma
import { COURSE_APPROVE_STATUS } from '../constants/course.constant';
import { ROLE } from '../constants/role.constant';
import { HomepageCourse } from '../interfaces/homepage-course.interface';
import {
  HomepageCourseEntity,
  HomepageCoursesResponseEntity,
  HomepageMentorEntity,
  HomepageTopicEntity,
} from 'src/entities/homepage-course.entity';
import { formatDate } from '../utils/formatDate.util';
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
        tbl_instructors: {
          include: {
            tbl_users: true,
          },
        },
        tbl_course_target_audience: true,
        tbl_modules: {
          include: {
            tbl_curricula: {
              include: {
                tbl_lectures: {
                  include: {
                    tbl_lecture_progress: true,
                  },
                },
                tbl_quizzes: {
                  include: {
                    tbl_questions: {
                      include: {
                        tbl_answers: true,
                      },
                    },
                  },
                },
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
      reviews: course.tbl_course_reviews.map((review) => ({
        reviewId: review.reviewId,
        courseId: review.courseId,
        userId: review.userId,
        rating: review.rating ? Number(review.rating) : 0,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      instructor: course.tbl_instructors
        ? {
            instructorId: course.tbl_instructors.instructorId,
            userId: course.tbl_instructors.userId,
            bio: course.tbl_instructors.bio,
            profilePicture: course.tbl_instructors.profilePicture,
            experience: course.tbl_instructors.experience,
            averageRating: course.tbl_instructors.average_rating
              ? Number(course.tbl_instructors.average_rating)
              : 0,
            isVerified: course.tbl_instructors.isVerified,
            createdAt: course.tbl_instructors.createdAt,
            updatedAt: course.tbl_instructors.updatedAt,
            user: course.tbl_instructors.tbl_users
              ? {
                  userId: course.tbl_instructors.tbl_users.userId,
                  email: course.tbl_instructors.tbl_users.email,
                  firstName: course.tbl_instructors.tbl_users.firstName,
                  lastName: course.tbl_instructors.tbl_users.lastName,
                  avatar: course.tbl_instructors.tbl_users.avatar,
                  role: course.tbl_instructors.tbl_users.role,
                  createdAt: course.tbl_instructors.tbl_users.createdAt,
                  updatedAt: course.tbl_instructors.tbl_users.updatedAt,
                }
              : null,
          }
        : null,
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
        curricula: module.tbl_curricula.map((curriculum) => ({
          curriculumId: curriculum.curriculumId,
          moduleId: curriculum.moduleId,
          title: curriculum.title,
          orderIndex: curriculum.orderIndex,
          type: curriculum.type,
          description: curriculum.description,
          createdAt: curriculum.createdAt,
          updatedAt: curriculum.updatedAt,
          lectures: curriculum.tbl_lectures.map((lecture) => ({
            lectureId: lecture.lectureId,
            curriculumId: lecture.curriculumId,
            title: lecture.title,
            description: lecture.description,
            videoUrl: lecture.videoUrl,
            duration: lecture.duration,
            isFree: lecture.isFree,
            createdAt: lecture.createdAt,
            updatedAt: lecture.updatedAt,
            progress: lecture.tbl_lecture_progress,
          })),
          quizzes: curriculum.tbl_quizzes.map((quiz) => ({
            quizId: quiz.quizId,
            curriculumId: quiz.curriculumId,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit,
            isFree: quiz.isFree,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
            questions: quiz.tbl_questions.map((question) => ({
              questionId: question.questionId,
              quizId: question.quizId,
              questionText: question.questionText,
              questionType: question.questionType,
              orderIndex: question.orderIndex,
              points: question.points,
              createdAt: question.createdAt,
              updatedAt: question.updatedAt,
              answers: question.tbl_answers.map((answer) => ({
                answerId: answer.answerId,
                questionId: answer.questionId,
                answerText: answer.answerText,
                isCorrect: answer.isCorrect,
                explanation: answer.explanation,
                createdAt: answer.createdAt,
                updatedAt: answer.updatedAt,
              })),
            })),
          })),
        })),
      })),
    };
  }

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

  async updateCourseDetails(courseId: string, body: UpdateCourseDetailsDto) {
    const { learningObjectives, requirements, targetAudience } = body;

    // Cập nhật learning objectives
    await this.prismaService.tbl_course_learning_objectives.deleteMany({
      where: { courseId },
    });
    await this.prismaService.tbl_course_learning_objectives.createMany({
      data: learningObjectives.map((obj, index) => ({
        objectiveId: uuidv4(),
        courseId,
        description: obj,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    // Cập nhật requirements
    await this.prismaService.tbl_course_requirements.deleteMany({
      where: { courseId },
    });
    await this.prismaService.tbl_course_requirements.createMany({
      data: requirements.map((req, index) => ({
        requirementId: uuidv4(),
        courseId,
        description: req,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    // Cập nhật target audience
    await this.prismaService.tbl_course_target_audience.deleteMany({
      where: { courseId },
    });
    await this.prismaService.tbl_course_target_audience.createMany({
      data: targetAudience.map((aud, index) => ({
        audienceId: uuidv4(),
        courseId,
        description: aud,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    return this.getCourseWithDetails(courseId);
  }

  async updateLearningObjectives(
    courseId: string,
    learningObjectives: string[],
  ) {
    // Xóa tất cả mục tiêu hiện có
    await this.prismaService.tbl_course_learning_objectives.deleteMany({
      where: { courseId },
    });

    // Tạo lại tất cả với orderIndex mới
    await this.prismaService.tbl_course_learning_objectives.createMany({
      data: learningObjectives.map((obj, index) => ({
        objectiveId: uuidv4(),
        courseId,
        description: obj,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    return this.getCourseWithDetails(courseId);
  }

  async updateRequirements(courseId: string, requirements: string[]) {
    await this.prismaService.tbl_course_requirements.deleteMany({
      where: { courseId },
    });
    await this.prismaService.tbl_course_requirements.createMany({
      data: requirements.map((req, index) => ({
        requirementId: uuidv4(),
        courseId,
        description: req,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    return this.getCourseWithDetails(courseId);
  }

  async updateTargetAudience(courseId: string, targetAudience: string[]) {
    await this.prismaService.tbl_course_target_audience.deleteMany({
      where: { courseId },
    });
    await this.prismaService.tbl_course_target_audience.createMany({
      data: targetAudience.map((aud, index) => ({
        audienceId: uuidv4(),
        courseId,
        description: aud,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });

    return this.getCourseWithDetails(courseId);
  }

  async getCourseDetails(courseId: string) {
    const learningObjectives =
      await this.prismaService.tbl_course_learning_objectives.findMany({
        where: { courseId },
      });

    const requirements =
      await this.prismaService.tbl_course_requirements.findMany({
        where: { courseId },
      });

    const targetAudience =
      await this.prismaService.tbl_course_target_audience.findMany({
        where: { courseId },
      });

    return {
      learningObjectives,
      requirements,
      targetAudience,
    };
  }

  async getHomepageCourses(): Promise<HomepageCoursesResponseEntity> {
    try {
      const recommendedCourses = await this.prismaService.tbl_courses.findMany({
        where: {
          approved: COURSE_APPROVE_STATUS.APPROVED,
          isRecommended: true,
        },
        take: 4,
        include: {
          tbl_instructors: {
            include: {
              tbl_users: true,
            },
          },
          tbl_course_reviews: true,
        },
      });

      const bestSellerCourses = await this.prismaService.tbl_courses.findMany({
        where: {
          approved: COURSE_APPROVE_STATUS.APPROVED,
          isBestSeller: true,
        },
        take: 4,
        include: {
          tbl_instructors: {
            include: {
              tbl_users: true,
            },
          },
          tbl_course_reviews: true,
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
        },
      });

      const popularTopics = await this.prismaService.tbl_categories.findMany({
        take: 8,
        include: {
          tbl_course_categories: {
            where: {
              tbl_courses: {
                approved: COURSE_APPROVE_STATUS.APPROVED,
              },
            },
            include: {
              tbl_courses: true,
            },
          },
        },
      });

      const formattedTopics = popularTopics.map(
        (topic) =>
          new HomepageTopicEntity({
            id: topic.categoryId,
            name: topic.categoryType,
            courseCount: topic.tbl_course_categories.length,
          }),
      );

      const popularMentors = await this.prismaService.tbl_instructors.findMany({
        where: {
          isVerified: true,
          tbl_courses: {
            some: {
              approved: COURSE_APPROVE_STATUS.APPROVED,
            },
          },
        },
        take: 4,
        include: {
          tbl_users: true,
          tbl_courses: {
            where: {
              approved: COURSE_APPROVE_STATUS.APPROVED,
            },
            take: 1,
          },
        },
        orderBy: {
          average_rating: 'desc',
        },
      });

      const formattedMentors = popularMentors.map(
        (mentor) =>
          new HomepageMentorEntity({
            id: mentor.instructorId,
            name: `${mentor.tbl_users?.firstName || ''} ${mentor.tbl_users?.lastName || ''}`.trim(),
            role: mentor.tbl_users?.role || ROLE.INSTRUCTOR,
            avatar: mentor.profilePicture || mentor.tbl_users?.avatar || '',
            courseCount: mentor.tbl_courses.length,
            rating: mentor.average_rating?.toNumber() || 0,
          }),
      );

      return {
        recommendedCourses: recommendedCourses.map((course) =>
          this.formatCourseForHomepage(course),
        ),
        bestSellerCourses: bestSellerCourses.map((course) =>
          this.formatCourseForHomepage(course),
        ),
        topics: formattedTopics,
        mentors: formattedMentors,
      };
    } catch (error) {
      console.log('Error getting homepage courses:', error);
      throw error;
    }
  }

  private formatCourseForHomepage(
    course: HomepageCourse,
  ): HomepageCourseEntity {
    // Calculate average rating
    const reviews = course.tbl_course_reviews || [];
    const totalReviews = reviews.length;

    let averageRating = 0;
    if (course.rating) {
      if (typeof course.rating.toNumber === 'function') {
        averageRating = Number(course.rating.toNumber().toFixed(1));
      } else {
        averageRating = Number(Number(course.rating).toFixed(1));
      }
    }

    // Get instructor name
    const instructor = course.tbl_instructors
      ? `${course.tbl_instructors.tbl_users?.firstName || ''} ${course.tbl_instructors.tbl_users?.lastName || ''}`.trim()
      : 'Unknown Instructor';

    // Calculate prices
    const currentPrice = course.price?.toNumber() || 100000;
    const originalPrice = Math.round(currentPrice * 1.2); // Example discount calculation

    // Get categories
    const categories =
      course.tbl_course_categories?.map((cc) => ({
        id: cc.tbl_categories?.categoryId,
        name: cc.tbl_categories?.categoryType,
      })) || [];

    return new HomepageCourseEntity({
      id: course.courseId,
      title: course.title || 'Khóa học: Chưa có tiêu đề',
      instructor: instructor,
      rating: averageRating,
      reviews: totalReviews,
      currentPrice: `₫${currentPrice.toLocaleString()}`,
      originalPrice: `₫${originalPrice.toLocaleString()}`,
      isBestSeller: course.isBestSeller || false,
      image: course.thumbnail || '',
      updatedAt: course.updatedAt,
      updatedDate: formatDate(course.updatedAt),
      totalHours: Math.round(course.durationTime || 600) / 60 || 10,
      description: course.description || 'Không có mô tả khóa học',
      categories: categories,
    });
  }
}

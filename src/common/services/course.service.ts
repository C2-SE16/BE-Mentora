import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from '../dto/course.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDetailsDto } from '../dto/update-course-details.dto';
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
import { ElasticsearchService } from './elasticsearch.service';
import { SearchCourseDto } from '../dto/search-course.dto';
import { CourseSearchResult } from '../interfaces/course.interface';
import { UpdateCourseBasicDto } from '../dto/update-course-basic.dto';
import { GetCoursesQueryDto } from '../dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

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

  async getCourseById(courseId: string) {
    const course = await this.prismaService.tbl_courses.findUnique({
      where: {
        courseId: courseId,
      },
      include: {
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
        tbl_instructors: {
          include: {
            tbl_users: true,
          },
        },
        tbl_course_reviews: {
          include: {
            tbl_users: true,
          },
        },
      },
    });

    if (!course) return null;

    return {
      courseId: course.courseId,
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
      thumbnail: course.thumbnail,
      categories: course.tbl_course_categories.map((category) => ({
        categoryId: category.categoryId,
        courseId: category.courseId,
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
                  fullName: course.tbl_instructors.tbl_users.fullName,
                  avatar: course.tbl_instructors.tbl_users.avatar,
                  role: course.tbl_instructors.tbl_users.role,
                  createdAt: course.tbl_instructors.tbl_users.createdAt,
                  updatedAt: course.tbl_instructors.tbl_users.updatedAt,
                }
              : null,
          }
        : null,
      reviews: course.tbl_course_reviews.map((review) => ({
        reviewId: review.reviewId,
        courseId: review.courseId,
        user: review.tbl_users
          ? {
              userId: review.tbl_users.userId,
              email: review.tbl_users.email,
              fullName: review.tbl_users.fullName,
              avatar: review.tbl_users.avatar,
              role: review.tbl_users.role,
              createdAt: review.tbl_users.createdAt,
              updatedAt: review.tbl_users.updatedAt,
            }
          : null,
        rating: review.rating ? Number(review.rating) : 0,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
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

  async createSimpleCourse(
    createCourseDto: CreateSimpleCourseDto,
    userId: string,
  ) {
    try {
      // Tìm instructor dựa trên userId
      const instructor = await this.prismaService.tbl_instructors.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!instructor) {
        throw new Error('Instructor not found for this user');
      }

      // Tạo khóa học mới với instructorId từ instructor tìm được
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
        tbl_course_reviews: {
          take: 4,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            tbl_users: true,
          },
        },
        tbl_course_learning_objectives: true,
        tbl_course_requirements: true,
        tbl_instructors: {
          include: {
            tbl_users: true,
          },
        },
        tbl_course_target_audience: true,
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
        tbl_modules: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            tbl_curricula: {
              orderBy: {
                orderIndex: 'asc',
              },
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
        tbl_course_enrollments: {
          include: {
            tbl_users: true,
          },
        },
        tbl_voucher_courses: {
          where: {
            isActive: true,
            tbl_vouchers: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
          include: {
            tbl_vouchers: true,
          },
          orderBy: { discountAmount: 'desc' },
        },
      },
    });

    if (!course) return null;

    // Lấy voucher tốt nhất (nếu có) - giống như trong getCoursesByInstructorId
    const bestVoucherCourse = course.tbl_voucher_courses[0];
    const originalPrice = course.price ? Number(course.price) : 0;
    const currentPrice = bestVoucherCourse
      ? Number(bestVoucherCourse.finalPrice)
      : originalPrice;

    return {
      courseId: course.courseId,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description,
      overview: course.overview,
      durationTime: course.durationTime,
      price: originalPrice,
      currentPrice: currentPrice,
      originalPrice: originalPrice,
      hasDiscount: !!bestVoucherCourse,
      approved: course.approved,
      rating: course.rating ? Number(course.rating) : 0,
      comment: course.comment,
      thumbnail: course.thumbnail,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      categories: course.tbl_course_categories.map((category) => ({
        categoryId: category.tbl_categories?.categoryId,
        name: category.tbl_categories?.name,
        description: category.tbl_categories?.description,
      })),
      // Thêm thông tin voucher đã áp dụng
      appliedVoucher: bestVoucherCourse
        ? {
            code: bestVoucherCourse.tbl_vouchers?.code,
            discountAmount: Number(bestVoucherCourse.discountAmount),
            discountType: bestVoucherCourse.tbl_vouchers?.discountType,
            finalPrice: Number(bestVoucherCourse.finalPrice),
          }
        : null,
      // Thêm tất cả vouchers available cho course này
      availableVouchers: course.tbl_voucher_courses.map((vc) => ({
        code: vc.tbl_vouchers?.code,
        discountAmount: Number(vc.discountAmount),
        discountType: vc.tbl_vouchers?.discountType,
        finalPrice: Number(vc.finalPrice),
        startDate: vc.tbl_vouchers?.startDate,
        endDate: vc.tbl_vouchers?.endDate,
      })),
      reviews: course.tbl_course_reviews.map((review) => ({
        reviewId: review.reviewId,
        courseId: review.courseId,
        user: review.tbl_users
          ? {
              userId: review.tbl_users.userId,
              email: review.tbl_users.email,
              fullName: review.tbl_users.fullName,
              avatar: review.tbl_users.avatar,
              role: review.tbl_users.role,
              createdAt: review.tbl_users.createdAt,
              updatedAt: review.tbl_users.updatedAt,
            }
          : null,
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
                  fullName: course.tbl_instructors.tbl_users.fullName,
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
      enrollments: course.tbl_course_enrollments.map((enrollment) => ({
        userId: enrollment.userId,
        courseEnrollmentId: enrollment.courseEnrollmentId,
        enrolledAt: enrollment.enrolledAt,
        courseId: enrollment.courseId,
        user: enrollment.tbl_users
          ? {
              userId: enrollment.tbl_users.userId,
              fullName: enrollment.tbl_users.fullName,
              avatar: enrollment.tbl_users.avatar,
            }
          : null,
      })),
    };
  }

  // Phương thức tìm kiếm sử dụng Elasticsearch
  async searchCourses(searchDto: SearchCourseDto, userId?: string) {
    const { page = 1, limit = 10 } = searchDto;

    const { total, results } = await this.elasticsearchService.searchCourses(
      searchDto,
      userId,
    );

    if (results.length === 0) {
      return {
        courses: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const courseIds = results.map(
      (result) => (result as unknown as CourseSearchResult).courseId,
    );

    const courses = await this.prismaService.tbl_courses.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        tbl_instructors: true,
        tbl_course_categories: {
          include: {
            tbl_categories: true,
          },
        },
        tbl_course_reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Sắp xếp kết quả theo thứ tự từ Elasticsearch
    const orderedCourses = courseIds
      .map((id) => courses.find((course) => course.courseId === id))
      .filter(Boolean);

    const formattedCourses = orderedCourses.map((course) => ({
      ...course,
      price: course?.price ? Number(course.price) : 0,
      rating: course?.rating ? Number(Number(course.rating).toFixed(1)) : 0,
      tbl_instructors: course?.tbl_instructors
        ? {
            ...course.tbl_instructors,
            average_rating: course.tbl_instructors.average_rating
              ? Number(Number(course.tbl_instructors.average_rating).toFixed(1))
              : 0,
          }
        : null,
    }));
    return {
      courses: formattedCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

  async getCoursesByInstructorId(instructorId: string) {
    try {
      const courses = await this.prismaService.tbl_courses.findMany({
        where: {
          instructorId: instructorId,
        },
        include: {
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
          tbl_instructors: {
            include: {
              tbl_users: true,
            },
          },
          tbl_course_reviews: true,
          tbl_course_enrollments: {
            include: {
              tbl_users: true,
            },
          },
          tbl_voucher_courses: {
            where: {
              isActive: true,
              tbl_vouchers: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
            include: {
              tbl_vouchers: true,
            },
            orderBy: { discountAmount: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return courses.map((course) => {
        // Lấy voucher tốt nhất (nếu có)
        const bestVoucherCourse = course.tbl_voucher_courses[0];

        return {
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          overview: course.overview,
          durationTime: course.durationTime,
          price: course.price ? Number(course.price) : 0,
          // Thêm thông tin giá sau khi áp dụng voucher
          currentPrice: bestVoucherCourse
            ? Number(bestVoucherCourse.finalPrice)
            : Number(course.price || 0),
          originalPrice: Number(course.price || 0),
          hasDiscount: !!bestVoucherCourse,
          approved: course.approved,
          rating: course.rating ? Number(course.rating) : 0,
          thumbnail: course.thumbnail,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          categories: course.tbl_course_categories.map((category) => ({
            categoryId: category.categoryId,
            name: category.tbl_categories?.name,
          })),
          instructor: course.tbl_instructors
            ? {
                instructorId: course.tbl_instructors.instructorId,
                name: course.tbl_instructors.tbl_users?.fullName,
                avatar: course.tbl_instructors.tbl_users?.avatar,
              }
            : null,
          reviewCount: course.tbl_course_reviews.length,
          // Thêm thông tin voucher đã áp dụng
          appliedVoucher: bestVoucherCourse
            ? {
                code: bestVoucherCourse.tbl_vouchers?.code,
                discountAmount: Number(bestVoucherCourse.discountAmount),
                discountType: bestVoucherCourse.tbl_vouchers?.discountType,
                finalPrice: Number(bestVoucherCourse.finalPrice),
              }
            : null,
          enrollments: course.tbl_course_enrollments.map((enrollment) => ({
            userId: enrollment.userId,
            courseEnrollmentId: enrollment.courseEnrollmentId,
            enrolledAt: enrollment.enrolledAt,
            courseId: enrollment.courseId,
            user: enrollment.tbl_users
              ? {
                  userId: enrollment.tbl_users.userId,
                  fullName: enrollment.tbl_users.fullName,
                  avatar: enrollment.tbl_users.avatar,
                }
              : null,
          })),
        };
      });
    } catch (error) {
      console.error('Error fetching courses by instructor ID:', error);
      throw error;
    }
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
          tbl_voucher_courses: {
            where: {
              isActive: true,
              tbl_vouchers: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
            include: {
              tbl_vouchers: true,
            },
            orderBy: { discountAmount: 'desc' },
          },
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
          tbl_voucher_courses: {
            where: {
              isActive: true,
              tbl_vouchers: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
            include: {
              tbl_vouchers: true,
            },
            orderBy: { discountAmount: 'desc' },
          },
        },
      });

      const newCourses = await this.prismaService.tbl_courses.findMany({
        where: {
          approved: COURSE_APPROVE_STATUS.APPROVED,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)), // 7 days ago
          },
        },
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
          tbl_course_enrollments: true,
          tbl_voucher_courses: {
            where: {
              isActive: true,
              tbl_vouchers: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
            include: {
              tbl_vouchers: true,
            },
            orderBy: { discountAmount: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc', // Ưu tiên theo thời gian tạo
        },
        take: 10, // Lấy nhiều hơn để có thể lọc
      });

      const sortedNewCourses = newCourses
        .sort((a, b) => {
          // Tạo một "điểm" ưu tiên từ rating và số lượt mua
          const scoreA =
            (a.rating?.toNumber() || 0) * 0.7 +
            (a.tbl_course_enrollments.length || 0) * 0.3;
          const scoreB =
            (b.rating?.toNumber() || 0) * 0.7 +
            (b.tbl_course_enrollments.length || 0) * 0.3;
          return scoreB - scoreA; // Sắp xếp giảm dần
        })
        .slice(0, 4);

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
            name: topic.name,
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
            name: mentor.tbl_users?.fullName || '',
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
        newCourses: sortedNewCourses.map((course) =>
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

  async getAllHomepageCourses(offset: number = 0, limit: number = 10) {
    try {
      // Lấy tổng số khóa học đã được APPROVED
      const totalCount = await this.prismaService.tbl_courses.count({
        where: {
          approved: COURSE_APPROVE_STATUS.APPROVED,
        },
      });

      // Lấy khóa học theo offset và limit
      const courses = await this.prismaService.tbl_courses.findMany({
        where: {
          approved: COURSE_APPROVE_STATUS.APPROVED,
        },
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
          tbl_voucher_courses: {
            where: {
              isActive: true,
              tbl_vouchers: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
            include: {
              tbl_vouchers: true,
            },
            orderBy: { discountAmount: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      return {
        courses: courses.map((course) => this.formatCourseForHomepage(course)),
        totalCount,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit,
      };
    } catch (error) {
      console.error('Error getting all homepage courses:', error);
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

    const bestVoucherCourse = course.tbl_voucher_courses?.[0];

    // Calculate prices with voucher
    const originalPrice = course.price?.toNumber() || 100000;
    const currentPrice = bestVoucherCourse
      ? Number(bestVoucherCourse.finalPrice)
      : originalPrice;

    // Get categories
    const categories =
      course.tbl_course_categories?.map((cc) => ({
        id: cc.tbl_categories?.categoryId,
        name: cc.tbl_categories?.name,
      })) || [];

    return new HomepageCourseEntity({
      id: course.courseId,
      title: course.title || 'Khóa học: Chưa có tiêu đề',
      instructor: instructor,
      rating: averageRating,
      reviews: totalReviews,
      currentPrice: `${currentPrice.toLocaleString()}₫`,
      originalPrice: bestVoucherCourse
        ? `${originalPrice.toLocaleString()}₫`
        : undefined,
      hasDiscount: !!bestVoucherCourse,
      discountPercentage: bestVoucherCourse
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : undefined,
      appliedVoucher: bestVoucherCourse
        ? {
            code: bestVoucherCourse.tbl_vouchers?.code,
            discountAmount: Number(bestVoucherCourse.discountAmount),
            discountType: bestVoucherCourse.tbl_vouchers?.discountType,
          }
        : undefined,
      isBestSeller: course.isBestSeller || false,
      image: course.thumbnail || '',
      createdAt: course.createdAt || new Date(),
      updatedAt: course.updatedAt,
      updatedDate: formatDate(course.updatedAt),
      totalHours: Math.round(course.durationTime || 600) / 60 || 10,
      description: course.description || 'Không có mô tả khóa học',
      categories: categories,
    });
  }

  async getCoursesByUserId(userId: string) {
    try {
      // Tìm instructor dựa trên userId
      const instructor = await this.prismaService.tbl_instructors.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!instructor) {
        throw new Error('Instructor not found for this user');
      }

      // Lấy khóa học dựa trên instructorId
      return this.getCoursesByInstructorId(instructor.instructorId);
    } catch (error) {
      console.error('Error fetching courses by user ID:', error);
      throw error;
    }
  }

  async updateCourseBasicInfo(courseId: string, body: UpdateCourseBasicDto) {
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return this.prismaService.tbl_courses.update({
      where: { courseId },
      data: {
        title: body.title,
        description: body.description,
        updatedAt: new Date(),
      },
    });
  }

  async getCourses(query: GetCoursesQueryDto) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.tbl_coursesWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              description: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [courses, total] = await Promise.all([
      this.prismaService.tbl_courses.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        include: {
          tbl_instructors: {
            include: {
              tbl_users: {
                select: {
                  userId: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
          tbl_course_categories: {
            include: {
              tbl_categories: {
                select: {
                  categoryId: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.tbl_courses.count({ where }),
    ]);

    const formattedCourses = courses.map((course) => ({
      courseId: course.courseId,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price ? Number(course.price) : 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      user: course.tbl_instructors?.tbl_users
        ? {
            userId: course.tbl_instructors.tbl_users.userId,
            fullName: course.tbl_instructors.tbl_users.fullName,
            avatar: course.tbl_instructors.tbl_users.avatar,
          }
        : null,
      category: course.tbl_course_categories[0]?.tbl_categories
        ? {
            categoryId:
              course.tbl_course_categories[0].tbl_categories.categoryId,
            name: course.tbl_course_categories[0].tbl_categories.name,
          }
        : null,
    }));

    return {
      data: formattedCourses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCourseStatus(courseId: string, approved: string) {
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return this.prismaService.tbl_courses.update({
      where: { courseId },
      data: {
        approved: approved as 'PENDING' | 'APPROVED' | 'REJECTED',
        updatedAt: new Date(),
      },
    });
  }

  async getCoursesByCategory(categoryId: string) {
    try {
      const courses = await this.prismaService.tbl_categories.findUnique({
        where: { categoryId },
        include: {
          tbl_course_categories: {
            include: {
              tbl_courses: {
                include: {
                  tbl_instructors: {
                    include: {
                      tbl_users: true,
                    },
                  },
                  tbl_course_reviews: true,
                },
              },
            },
          },
        },
      });

      if (!courses) {
        throw new Error('Category not found');
      }

      return {
        success: true,
        data: courses.tbl_course_categories
          .filter((cc) => cc.tbl_courses !== null)
          .map((cc) => {
            const course = cc.tbl_courses!;
            return {
              courseId: course.courseId,
              title: course.title,
              description: course.description,
              overview: course.overview,
              durationTime: course.durationTime,
              price: course.price ? Number(course.price) : 0,
              approved: course.approved,
              rating: course.rating ? Number(course.rating) : 0,
              thumbnail: course.thumbnail,
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
              instructor: course.tbl_instructors
                ? {
                    instructorId: course.tbl_instructors.instructorId,
                    name: course.tbl_instructors.tbl_users?.fullName,
                    avatar: course.tbl_instructors.tbl_users?.avatar,
                  }
                : null,
              reviewCount: course.tbl_course_reviews.length,
            };
          }),
        message: 'Lấy danh sách khóa học theo danh mục thành công',
      };
    } catch (error) {
      throw new Error('Không thể lấy danh sách khóa học theo danh mục');
    }
  }
}

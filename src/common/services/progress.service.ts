import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateCurriculumProgressDto,
  CreateLectureProgressDto,
  UpdateCurriculumProgressDto,
  UpdateLectureProgressDto,
} from 'src/common/dto/progress.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { validate as isUUID } from 'uuid';
@Injectable()
export class ProgressService {
  constructor(private readonly prismaService: PrismaService) { }

  async createCurriculumProgress(body: CreateCurriculumProgressDto) {
    // Kiểm tra user tồn tại
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId: body.userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra curriculum tồn tại
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId: body.curriculumId },
    });
    if (!curriculum) {
      throw new HttpException('Curriculum not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra progress đã tồn tại chưa
    const existingProgress =
      await this.prismaService.tbl_curriculum_progress.findFirst({
        where: {
          userId: body.userId,
          curriculumId: body.curriculumId,
        },
      });
    if (existingProgress) {
      throw new HttpException('Progress already exists', HttpStatus.CONFLICT);
    }

    const progress = await this.prismaService.tbl_curriculum_progress.create({
      data: {
        progressId: uuidv4(),
        userId: body.userId,
        curriculumId: body.curriculumId,
        status: body.status,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return {
      progress,
    };
  }

  async createLectureProgress(body: CreateLectureProgressDto) {
    // Kiểm tra user tồn tại
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId: body.userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra lecture tồn tại
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId: body.lectureId },
      include: {
        tbl_curricula: true
      }
    });
    if (!lecture) {
      throw new HttpException('Lecture not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra progress đã tồn tại chưa
    const existingProgress =
      await this.prismaService.tbl_lecture_progress.findFirst({
        where: {
          userId: body.userId,
          lectureId: body.lectureId,
        },
      });
    if (existingProgress) {
      throw new HttpException('Progress already exists', HttpStatus.CONFLICT);
    }

    const progress = await this.prismaService.tbl_lecture_progress.create({
      data: {
        progressId: uuidv4(),
        userId: body.userId,
        lectureId: body.lectureId,
        status: body.status,
        lastPosition: body.lastPosition,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Kiểm tra và cập nhật tiến độ curriculum
    if (lecture.tbl_curricula) {
      const curriculumId = lecture.tbl_curricula.curriculumId;

      // Kiểm tra tiến độ curriculum hiện tại
      const curriculumProgress = await this.prismaService.tbl_curriculum_progress.findFirst({
        where: {
          userId: body.userId,
          curriculumId: curriculumId
        }
      });

      if (curriculumProgress) {
        // Cập nhật tiến độ curriculum hiện có nếu chưa hoàn thành
        if (curriculumProgress.status !== 'COMPLETED') {
          await this.prismaService.tbl_curriculum_progress.update({
            where: {
              progressId: curriculumProgress.progressId
            },
            data: {
              status: 'IN_PROGRESS',
              updatedAt: new Date()
            }
          });
        }
      } else {
        // Tạo mới tiến độ curriculum nếu chưa tồn tại
        await this.prismaService.tbl_curriculum_progress.create({
          data: {
            progressId: uuidv4(),
            userId: body.userId,
            curriculumId: curriculumId,
            status: 'IN_PROGRESS',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    return {
      progress,
    };
  }

  async updateCurriculumProgress(body: UpdateCurriculumProgressDto) {
    const progress = await this.prismaService.tbl_curriculum_progress.update({
      where: {
        progressId: body.progressId,
      },
      data: {
        status: body.status,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        updatedAt: new Date(),
      },
    });
    return {
      progress,
    };
  }

  async updateLectureProgress(body: UpdateLectureProgressDto) {
    const progress = await this.prismaService.tbl_lecture_progress.update({
      where: {
        progressId: body.progressId,
      },
      data: {
        status: body.status,
        lastPosition: body.lastPosition,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        updatedAt: new Date(),
      },
      include: {
        tbl_lectures: {
          include: {
            tbl_curricula: true
          }
        }
      }
    });

    // Nếu bài học đã hoàn thành, cập nhật tiến độ curriculum
    if (body.status === 'COMPLETED' && progress.tbl_lectures?.tbl_curricula) {
      const curriculumId = progress.tbl_lectures.tbl_curricula.curriculumId;

      // Kiểm tra tiến độ curriculum hiện tại
      const curriculumProgress = await this.prismaService.tbl_curriculum_progress.findFirst({
        where: {
          userId: progress.userId,
          curriculumId: curriculumId
        }
      });

      if (curriculumProgress) {
        // Cập nhật tiến độ curriculum hiện có
        await this.prismaService.tbl_curriculum_progress.update({
          where: {
            progressId: curriculumProgress.progressId
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        // Tạo mới tiến độ curriculum nếu chưa tồn tại
        await this.prismaService.tbl_curriculum_progress.create({
          data: {
            progressId: uuidv4(),
            userId: progress.userId,
            curriculumId: curriculumId,
            status: 'COMPLETED',
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    return {
      progress,
    };
  }

  async getUserProgress(userId: string) {
    // Kiểm tra user tồn tại
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Lấy tất cả curriculum progress của user
    const curriculumProgress =
      await this.prismaService.tbl_curriculum_progress.findMany({
        where: { userId },
        include: {
          tbl_curricula: true,
        },
      });

    return {
      curriculumProgress,
    };
  }

  /**
   * Kiểm tra liệu người dùng đã hoàn thành ít nhất 2/3 thời lượng video của bài học chưa
   * @param userId ID của người dùng
   * @param lectureId ID của bài giảng
   * @returns Object chứa thông tin về trạng thái hoàn thành
   */
  async hasCompletedTwoThirds(userId: string, lectureId: string) {
    // Kiểm tra bài giảng tồn tại và có video
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
      include: {
        tbl_curricula: true
      }
    });
    if (!lecture) {
      throw new HttpException('Lecture not found', HttpStatus.NOT_FOUND);
    }

    if (!lecture.videoUrl || !lecture.duration) {
      // Nếu không phải video hoặc không có thời lượng, cho phép chuyển tiếp
      return {
        canProceed: true,
        message: 'Bài học không phải dạng video hoặc không có thời lượng',
        progress: null
      };
    }

    // Kiểm tra tiến độ của người dùng
    const progress = await this.prismaService.tbl_lecture_progress.findFirst({
      where: {
        userId,
        lectureId,
      },
    });

    if (!progress) {
      return {
        canProceed: false,
        message: 'Bạn chưa bắt đầu học bài này',
        progress: null
      };
    }

    // Tính tỉ lệ hoàn thành
    const totalDuration = lecture.duration;
    const lastPosition = progress.lastPosition || 0;
    const completionRatio = lastPosition / totalDuration;

    // Cần hoàn thành ít nhất 2/3 thời lượng
    const canProceed = completionRatio >= 2 / 3;

    // Nếu đã hoàn thành đủ 2/3 thời lượng và trạng thái chưa là COMPLETED, cập nhật trạng thái
    if (canProceed && progress.status !== 'COMPLETED') {
      await this.prismaService.tbl_lecture_progress.update({
        where: { progressId: progress.progressId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Cập nhật tiến độ curriculum nếu có
      if (lecture.tbl_curricula) {
        const curriculumId = lecture.tbl_curricula.curriculumId;

        // Kiểm tra tiến độ curriculum hiện tại
        const curriculumProgress = await this.prismaService.tbl_curriculum_progress.findFirst({
          where: {
            userId: userId,
            curriculumId: curriculumId
          }
        });

        if (curriculumProgress) {
          // Cập nhật tiến độ curriculum hiện có
          await this.prismaService.tbl_curriculum_progress.update({
            where: {
              progressId: curriculumProgress.progressId
            },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              updatedAt: new Date()
            }
          });
        } else {
          // Tạo mới tiến độ curriculum nếu chưa tồn tại
          await this.prismaService.tbl_curriculum_progress.create({
            data: {
              progressId: uuidv4(),
              userId: userId,
              curriculumId: curriculumId,
              status: 'COMPLETED',
              completedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    }

    return {
      canProceed,
      message: canProceed ?
        'Đã hoàn thành đủ 2/3 thời lượng bài học' :
        `Bạn cần hoàn thành ít nhất ${Math.ceil(totalDuration * 2 / 3)} giây của bài học (đã học ${lastPosition} / ${totalDuration} giây)`,
      progress,
      completionRatio,
      requiredDuration: Math.ceil(totalDuration * 2 / 3),
      currentDuration: lastPosition
    };
  }

  /**
   * Kiểm tra liệu người dùng đã hoàn thành quiz của bài học chưa
   * @param userId ID của người dùng
   * @param quizId ID của quiz
   * @returns Object chứa thông tin về trạng thái hoàn thành
   */
  async hasCompletedQuiz(userId: string, quizId: string) {
    // Kiểm tra quiz tồn tại
    const quiz = await this.prismaService.tbl_quizzes.findUnique({
      where: { quizId },
      include: {
        tbl_curricula: true
      }
    });

    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra các lần thử làm quiz của người dùng
    const attempts = await this.prismaService.tbl_quiz_attempts.findMany({
      where: {
        userId,
        quizId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Nếu không có lần thử nào
    if (!attempts || attempts.length === 0) {
      return {
        canProceed: false,
        message: 'Bạn chưa hoàn thành bài kiểm tra này',
        attempts: [],
        isPassed: false
      };
    }

    // Kiểm tra lần thử gần nhất có đạt điểm đỗ không
    const latestAttempt = attempts[0];
    const isPassed = latestAttempt.isPassed;

    // Nếu đã vượt qua bài kiểm tra, cập nhật tiến độ curriculum
    if (isPassed && quiz.tbl_curricula) {
      const curriculumId = quiz.tbl_curricula.curriculumId;

      // Kiểm tra tiến độ curriculum hiện tại
      const curriculumProgress = await this.prismaService.tbl_curriculum_progress.findFirst({
        where: {
          userId: userId,
          curriculumId: curriculumId
        }
      });

      if (curriculumProgress) {
        // Cập nhật tiến độ curriculum hiện có
        await this.prismaService.tbl_curriculum_progress.update({
          where: {
            progressId: curriculumProgress.progressId
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        // Tạo mới tiến độ curriculum nếu chưa tồn tại
        await this.prismaService.tbl_curriculum_progress.create({
          data: {
            progressId: uuidv4(),
            userId: userId,
            curriculumId: curriculumId,
            status: 'COMPLETED',
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    return {
      canProceed: isPassed,
      message: isPassed
        ? 'Đã hoàn thành bài kiểm tra với kết quả đạt yêu cầu'
        : `Bạn chưa vượt qua bài kiểm tra này. Điểm yêu cầu: ${quiz.passingScore}, điểm của bạn: ${latestAttempt.score}`,
      attempts,
      latestAttempt,
      isPassed
    };
  }

  /**
   * Kiểm tra liệu người dùng đã hoàn thành bài học (video hoặc quiz) chưa
   * @param userId ID của người dùng
   * @param curriculumId ID của curriculum
   * @returns Object chứa thông tin về trạng thái hoàn thành
   */
  async hasCurriculumCompleted(userId: string, curriculumId: string) {
    // Kiểm tra curriculum tồn tại
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId },
      include: {
        tbl_lectures: true,
        tbl_quizzes: true,
      },
    });

    if (!curriculum) {
      throw new HttpException('Curriculum not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra loại curriculum
    if (curriculum.type === 'LECTURE') {
      // Nếu là bài giảng video
      if (curriculum.tbl_lectures && curriculum.tbl_lectures.length > 0) {
        const lecture = curriculum.tbl_lectures[0];
        return await this.hasCompletedTwoThirds(userId, lecture.lectureId);
      }
    } else if (curriculum.type === 'QUIZ') {
      // Nếu là quiz
      if (curriculum.tbl_quizzes && curriculum.tbl_quizzes.length > 0) {
        const quiz = curriculum.tbl_quizzes[0];
        return await this.hasCompletedQuiz(userId, quiz.quizId);
      }
    }

    // Trường hợp curriculum không có nội dung
    return {
      canProceed: true,
      message: 'Không có nội dung cần hoàn thành',
    };
  }

  /**
   * Kiểm tra liệu người dùng có thể chuyển sang bài học tiếp theo hay không
   * @param userId ID của người dùng 
   * @param currentLectureId ID của bài học hiện tại
   * @param nextLectureId ID của bài học tiếp theo (nếu có)
   * @returns Object chứa thông tin về khả năng chuyển tiếp
   */
  async canProceedToNextLecture(userId: string, currentLectureId: string, nextLectureId?: string) {
    // Kiểm tra hoàn thành bài học hiện tại
    const currentProgress = await this.hasCompletedTwoThirds(userId, currentLectureId);

    if (!currentProgress.canProceed) {
      return currentProgress;
    }

    // Nếu không cung cấp nextLectureId hoặc đã hoàn thành bài hiện tại, cho phép chuyển tiếp
    if (!nextLectureId) {
      return {
        canProceed: true,
        message: 'Đã hoàn thành bài học hiện tại',
        currentProgress
      };
    }

    return {
      canProceed: true,
      message: 'Có thể chuyển sang bài học tiếp theo',
      currentProgress
    };
  }

  /**
   * Kiểm tra liệu người dùng có thể chuyển sang bài học tiếp theo hay không (dựa trên curriculum)
   * @param userId ID của người dùng 
   * @param currentCurriculumId ID của curriculum hiện tại
   * @param nextCurriculumId ID của curriculum tiếp theo (nếu có)
   * @returns Object chứa thông tin về khả năng chuyển tiếp
   */
  async canProceedToNextCurriculum(userId: string, currentCurriculumId: string, nextCurriculumId?: string) {
    // Kiểm tra hoàn thành curriculum hiện tại
    const currentProgress = await this.hasCurriculumCompleted(userId, currentCurriculumId);

    if (!currentProgress.canProceed) {
      return currentProgress;
    }

    // Nếu không cung cấp nextCurriculumId hoặc đã hoàn thành curriculum hiện tại, cho phép chuyển tiếp
    if (!nextCurriculumId) {
      return {
        canProceed: true,
        message: 'Đã hoàn thành bài học hiện tại',
        currentProgress
      };
    }

    return {
      canProceed: true,
      message: 'Có thể chuyển sang bài học tiếp theo',
      currentProgress
    };
  }

  /**
   * Lấy tiến trình của tất cả curriculum trong một khóa học
   * @param userId ID của người dùng
   * @param courseId ID của khóa học
   * @returns Danh sách tiến trình của các curriculum trong khóa học
   */
  async getCourseProgress(userId: string, courseId: string) {
    // Kiểm tra user tồn tại
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra course tồn tại
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Lấy tất cả modules trong course
    const modules = await this.prismaService.tbl_modules.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        tbl_curricula: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tbl_lectures: true,
            tbl_quizzes: true,
          },
        },
      },
    });

    // Lấy tất cả curriculum progress của user
    const curriculumProgress = await this.prismaService.tbl_curriculum_progress.findMany({
      where: { userId },
    });

    // Tạo map để dễ dàng tra cứu
    const progressMap = new Map();
    curriculumProgress.forEach(progress => {
      progressMap.set(progress.curriculumId, progress);
    });

    // Tính toán tiến độ cho từng module và curriculum
    const result = await Promise.all(
      modules.map(async (module) => {
        const curriculaWithProgress = await Promise.all(
          module.tbl_curricula.map(async (curriculum) => {
            // Lấy progress hiện tại từ map
            const progress = progressMap.get(curriculum.curriculumId);

            // Tạo đối tượng kết quả cơ bản
            const curriculumResult = {
              curriculumId: curriculum.curriculumId,
              title: curriculum.title,
              orderIndex: curriculum.orderIndex,
              type: curriculum.type,
              description: curriculum.description,
              progress: {
                status: progress ? progress.status : 'NOT_STARTED',
                completedAt: progress ? progress.completedAt : null,
                progressId: progress ? progress.progressId : null
              }
            };

            // Thêm thông tin chi tiết dựa vào loại curriculum
            if (curriculum.type === 'LECTURE' && curriculum.tbl_lectures && curriculum.tbl_lectures.length > 0) {
              curriculumResult['lecture'] = {
                lectureId: curriculum.tbl_lectures[0].lectureId,
                title: curriculum.tbl_lectures[0].title,
                description: curriculum.tbl_lectures[0].description,
                videoUrl: curriculum.tbl_lectures[0].videoUrl,
                articleContent: curriculum.tbl_lectures[0].articleContent,
                duration: curriculum.tbl_lectures[0].duration,
                isFree: curriculum.tbl_lectures[0].isFree
              };
            } else if (curriculum.type === 'QUIZ' && curriculum.tbl_quizzes && curriculum.tbl_quizzes.length > 0) {
              curriculumResult['quiz'] = {
                quizId: curriculum.tbl_quizzes[0].quizId,
                title: curriculum.tbl_quizzes[0].title,
                description: curriculum.tbl_quizzes[0].description,
                passingScore: curriculum.tbl_quizzes[0].passingScore,
                timeLimit: curriculum.tbl_quizzes[0].timeLimit,
                isFree: curriculum.tbl_quizzes[0].isFree
              };
            }

            // Nếu chưa có progress, kiểm tra trạng thái hiện tại
            if (!progress) {
              try {
                const curriculumStatus = await this.hasCurriculumCompleted(userId, curriculum.curriculumId);
                curriculumResult.progress.status = curriculumStatus.canProceed ? 'COMPLETED' : 'NOT_STARTED';
              } catch (error) {
                // Nếu có lỗi, giữ nguyên trạng thái NOT_STARTED
              }
            }

            return curriculumResult;
          })
        );

        // Tính tiến độ cho module
        const totalCurricula = module.tbl_curricula.length;
        const completedCurricula = curriculaWithProgress.filter(
          c => c.progress.status === 'COMPLETED'
        ).length;
        const progressPercentage = totalCurricula > 0
          ? Math.round((completedCurricula / totalCurricula) * 100)
          : 0;

        return {
          moduleId: module.moduleId,
          title: module.title,
          orderIndex: module.orderIndex,
          description: module.description,
          totalCurricula,
          completedCurricula,
          progressPercentage,
          curricula: curriculaWithProgress
        };
      })
    );

    // Tính tiến độ tổng thể của khóa học
    const totalCurricula = result.reduce((total, module) => total + module.totalCurricula, 0);
    const completedCurricula = result.reduce((total, module) => total + module.completedCurricula, 0);
    const overallProgressPercentage = totalCurricula > 0
      ? Math.round((completedCurricula / totalCurricula) * 100)
      : 0;

    return {
      courseId,
      totalCurricula,
      completedCurricula,
      overallProgressPercentage,
      modules: result
    };
  }
}

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
    });
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
}

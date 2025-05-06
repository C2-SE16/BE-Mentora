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
  constructor(private readonly prismaService: PrismaService) {}

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
}

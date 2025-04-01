import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLectureDto, UpdateLectureDto } from '../dto/lecture.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LectureService {
  constructor(private readonly prismaService: PrismaService) {}

  async createLecture(createLectureDto: CreateLectureDto) {
    // Kiểm tra xem curriculum có tồn tại không
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId: createLectureDto.curriculumId },
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum with ID ${createLectureDto.curriculumId} not found`);
    }

    // Kiểm tra xem curriculum có phải loại LECTURE không
    if (curriculum.type !== 'LECTURE') {
      throw new Error(`Curriculum with ID ${createLectureDto.curriculumId} is not a lecture type`);
    }

    return this.prismaService.tbl_lectures.create({
      data: {
        lectureId: uuidv4(),
        curriculumId: createLectureDto.curriculumId,
        title: createLectureDto.title,
        description: createLectureDto.description,
        videoUrl: createLectureDto.videoUrl,
        articleContent: createLectureDto.articleContent,
        duration: createLectureDto.duration,
        isFree: createLectureDto.isFree,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getLectureById(lectureId: string) {
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!lecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    return lecture;
  }

  async updateLecture(lectureId: string, updateLectureDto: UpdateLectureDto) {
    // Kiểm tra xem lecture có tồn tại không
    const existingLecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!existingLecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    return this.prismaService.tbl_lectures.update({
      where: { lectureId },
      data: {
        title: updateLectureDto.title,
        description: updateLectureDto.description,
        videoUrl: updateLectureDto.videoUrl,
        articleContent: updateLectureDto.articleContent,
        duration: updateLectureDto.duration,
        isFree: updateLectureDto.isFree,
        updatedAt: new Date(),
      },
    });
  }

  async deleteLecture(lectureId: string) {
    // Kiểm tra xem lecture có tồn tại không
    const existingLecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!existingLecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    // Xóa tất cả lecture progress liên quan
    await this.prismaService.tbl_lecture_progress.deleteMany({
      where: { lectureId },
    });

    // Sau đó xóa lecture
    return this.prismaService.tbl_lectures.delete({
      where: { lectureId },
    });
  }

  // Phương thức mới để đồng bộ thông tin từ lecture sang curriculum
  async syncCurriculumWithLecture(lectureId: string) {
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!lecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    if (!lecture.curriculumId) {
      throw new NotFoundException(`Lecture with ID ${lectureId} has no associated curriculum`);
    }

    // Chỉ cập nhật updatedAt để theo dõi thời gian thay đổi
    await this.prismaService.tbl_curricula.update({
      where: { curriculumId: lecture.curriculumId! },
      data: {
        updatedAt: new Date(),
      },
    });
  }
} 
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CreateEmptyLessonDto } from '../dto/lesson.dto';
import { v4 as uuidv4 } from 'uuid';
import { lesson_enum } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(private readonly prismaService: PrismaService) {}

  async createLesson(createLessonDto: CreateLessonDto) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId: createLessonDto.moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${createLessonDto.moduleId} not found`);
    }

    return this.prismaService.tbl_lessons.create({
      data: {
        lessonId: uuidv4(),
        moduleId: createLessonDto.moduleId,
        title: createLessonDto.title,
        contentType: createLessonDto.contentType,
        contentUrl: createLessonDto.contentUrl,
        duration: createLessonDto.duration,
        orderIndex: createLessonDto.orderIndex,
        description: createLessonDto.description,
        isFree: createLessonDto.isFree || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getLessonById(lessonId: string) {
    const lesson = await this.prismaService.tbl_lessons.findUnique({
      where: { lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }

  async getLessonsByModuleId(moduleId: string) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return this.prismaService.tbl_lessons.findMany({
      where: { moduleId },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async updateLesson(lessonId: string, updateLessonDto: UpdateLessonDto) {
    // Kiểm tra xem lesson có tồn tại không
    const existingLesson = await this.prismaService.tbl_lessons.findUnique({
      where: { lessonId },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prismaService.tbl_lessons.update({
      where: { lessonId },
      data: {
        title: updateLessonDto.title,
        contentType: updateLessonDto.contentType,
        contentUrl: updateLessonDto.contentUrl,
        duration: updateLessonDto.duration,
        orderIndex: updateLessonDto.orderIndex,
        description: updateLessonDto.description,
        isFree: updateLessonDto.isFree,
        updatedAt: new Date(),
      },
    });
  }

  async deleteLesson(lessonId: string) {
    // Kiểm tra xem lesson có tồn tại không
    const existingLesson = await this.prismaService.tbl_lessons.findUnique({
      where: { lessonId },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Xóa tất cả các tiến trình học tập liên quan đến bài học này
    await this.prismaService.tbl_lesson_progess.deleteMany({
      where: { lessonId },
    });

    // Sau đó xóa bài học
    return this.prismaService.tbl_lessons.delete({
      where: { lessonId },
    });
  }

  async reorderLessons(moduleId: string, lessonIds: string[]) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Cập nhật thứ tự của các bài học
    const updatePromises = lessonIds.map((lessonId, index) => {
      return this.prismaService.tbl_lessons.update({
        where: { lessonId },
        data: { orderIndex: index },
      });
    });

    await Promise.all(updatePromises);

    return this.getLessonsByModuleId(moduleId);
  }

  async createEmptyLesson(createEmptyLessonDto: CreateEmptyLessonDto) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId: createEmptyLessonDto.moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${createEmptyLessonDto.moduleId} not found`);
    }

    // Tạo lesson trống với thông tin cơ bản
    return this.prismaService.tbl_lessons.create({
      data: {
        lessonId: uuidv4(),
        moduleId: createEmptyLessonDto.moduleId,
        title: createEmptyLessonDto.title,
        contentType: 'VIDEO', // Giá trị mặc định
        orderIndex: createEmptyLessonDto.orderIndex,
        isFree: createEmptyLessonDto.isFree || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async addLessonContent(
    lessonId: string, 
    contentData: { 
      contentUrl: string; 
      contentType: lesson_enum; 
      description?: string; 
      duration?: number 
    }
  ) {
    // Kiểm tra xem lesson có tồn tại không
    const existingLesson = await this.prismaService.tbl_lessons.findUnique({
      where: { lessonId },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Cập nhật nội dung cho lesson
    return this.prismaService.tbl_lessons.update({
      where: { lessonId },
      data: {
        contentUrl: contentData.contentUrl,
        contentType: contentData.contentType,
        description: contentData.description,
        duration: contentData.duration,
        updatedAt: new Date(),
      },
    });
  }
} 
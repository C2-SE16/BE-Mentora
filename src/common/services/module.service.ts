import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from '../dto/module.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ModuleService {
  constructor(private readonly prismaService: PrismaService) {}

  async createModule(createModuleDto: CreateModuleDto) {
    // Kiểm tra xem khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId: createModuleDto.courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${createModuleDto.courseId} not found`);
    }

    return this.prismaService.tbl_modules.create({
      data: {
        moduleId: uuidv4(),
        courseId: createModuleDto.courseId,
        title: createModuleDto.title,
        orderIndex: createModuleDto.orderIndex,
        description: createModuleDto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getModuleById(moduleId: string) {
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
      include: {
        tbl_curricula: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return module;
  }

  async getModulesByCourseId(courseId: string) {
    // Kiểm tra xem khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prismaService.tbl_modules.findMany({
      where: { courseId },
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        tbl_curricula: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async updateModule(moduleId: string, updateModuleDto: UpdateModuleDto) {
    // Kiểm tra xem module có tồn tại không
    const existingModule = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return this.prismaService.tbl_modules.update({
      where: { moduleId },
      data: {
        title: updateModuleDto.title,
        orderIndex: updateModuleDto.orderIndex,
        description: updateModuleDto.description,
        updatedAt: new Date(),
      },
    });
  }

  async deleteModule(moduleId: string) {
    // Kiểm tra xem module có tồn tại không
    const existingModule = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Xóa tất cả curricula thuộc module này trước
    await this.prismaService.tbl_curricula.deleteMany({
      where: { moduleId },
    });

    // Sau đó xóa module
    return this.prismaService.tbl_modules.delete({
      where: { moduleId },
    });
  }

  async reorderModules(courseId: string, moduleIds: string[]) {
    // Kiểm tra xem khóa học có tồn tại không
    const course = await this.prismaService.tbl_courses.findUnique({
      where: { courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Cập nhật thứ tự của các module
    const updatePromises = moduleIds.map((moduleId, index) => {
      return this.prismaService.tbl_modules.update({
        where: { moduleId },
        data: { orderIndex: index },
      });
    });

    await Promise.all(updatePromises);

    return this.getModulesByCourseId(courseId);
  }
} 
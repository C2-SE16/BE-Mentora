import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  CreateDiscussingDto,
  UpdateDiscussingDto,
} from 'src/common/dto/discussing.dto';

@Injectable()
export class DiscussingService {
  constructor(private readonly prismaService: PrismaService) {}
  async createDiscussing(dto: CreateDiscussingDto) {
    try {
      if (!dto.userId) {
        throw new Error('UserId là bắt buộc');
      }
      console.log('dto', dto);

      const discussing = await this.prismaService.tbl_disscussing.create({
        data: {
          userId: dto.userId,
          curriculumId: dto.curriculumId,
          title: dto.title,
          content: dto.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('discussing', discussing);
      return discussing;
    } catch (error) {
      throw new Error('Không thể tạo discussing');
    }
  }

  // Lấy tất cả discussing theo curriculum id
  async getAllByCurriculumId(curriculumId: string) {
    try {
      const discussions = await this.prismaService.tbl_disscussing.findMany({
        where: {
          curriculumId: curriculumId,
        },
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
          curricula: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return discussions;
    } catch (error) {
      throw new Error('Không thể lấy danh sách discussing');
    }
  }

  // Cập nhật discussing
  async updateDiscussing(discussingId: string, dto: UpdateDiscussingDto) {
    try {
      // Kiểm tra discussing có tồn tại không
      const existingDiscussing =
        await this.prismaService.tbl_disscussing.findUnique({
          where: { discussingId },
        });

      if (!existingDiscussing) {
        throw new Error('Discussing không tồn tại');
      }

      const updatedDiscussing = await this.prismaService.tbl_disscussing.update(
        {
          where: { discussingId },
          data: {
            title: dto.title,
            content: dto.content,
            updatedAt: new Date(),
          },
          include: {
            user: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
            curricula: true,
          },
        },
      );

      return updatedDiscussing;
    } catch (error) {
      throw new Error('Không thể cập nhật discussing');
    }
  }

  // Xóa discussing
  async deleteDiscussing(discussingId: string) {
    try {
      // Kiểm tra discussing có tồn tại không
      const existingDiscussing =
        await this.prismaService.tbl_disscussing.findUnique({
          where: { discussingId },
        });

      if (!existingDiscussing) {
        throw new Error('Discussing không tồn tại');
      }

      await this.prismaService.tbl_disscussing.delete({
        where: { discussingId },
      });

      return { message: 'Xóa discussing thành công' };
    } catch (error) {
      throw new Error('Không thể xóa discussing');
    }
  }
}

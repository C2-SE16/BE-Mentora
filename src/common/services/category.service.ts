import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateCategoryDto } from '../dto/category/create-category.dto';
import { UpdateCategoryDto } from '../dto/category/update-category.dto';
import { PaginationDto } from '../dto/common/pagination.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.prismaService.tbl_categories.create({
        data: {
          categoryId: uuidv4(),
          name: createCategoryDto.name,
          description: createCategoryDto.description,
        },
      });

      return {
        success: true,
        message: 'Tạo danh mục thành công',
        data: category,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể tạo danh mục',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const [categories, total] = await Promise.all([
        this.prismaService.tbl_categories.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prismaService.tbl_categories.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Lấy danh sách danh mục thành công',
        data: {
          data: categories,
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy danh sách danh mục',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.prismaService.tbl_categories.findUnique({
        where: { categoryId: id },
      });

      if (!category) {
        throw new HttpException(
          {
            success: false,
            message: 'Không tìm thấy danh mục',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Lấy thông tin danh mục thành công',
        data: category,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy thông tin danh mục',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const category = await this.prismaService.tbl_categories.update({
        where: { categoryId: id },
        data: {
          name: updateCategoryDto.name,
          description: updateCategoryDto.description,
        },
      });

      return {
        success: true,
        message: 'Cập nhật danh mục thành công',
        data: category,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể cập nhật danh mục',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      await this.prismaService.tbl_categories.delete({
        where: { categoryId: id },
      });

      return {
        success: true,
        message: 'Xóa danh mục thành công',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Không thể xóa danh mục',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy category theo ID
   * @param categoryId ID của category cần lấy
   * @returns Thông tin của category
   */
  async getCategoryById(categoryId: string) {
    try {
      const category = await this.prismaService.tbl_categories.findUnique({
        where: {
          categoryId,
        },
      });
      return category;
    } catch (error) {
      console.error(`Error fetching category with ID ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách khóa học theo category
   * @param categoryId ID của category
   * @returns Danh sách khóa học thuộc category
   */
  async getCoursesByCategory(categoryId: string) {
    try {
      const coursesInCategory =
        await this.prismaService.tbl_course_categories.findMany({
          where: {
            categoryId,
          },
          include: {
            tbl_courses: true,
          },
        });

      const formattedCoursesInCategory = coursesInCategory.map((item) => {
        if (!item.tbl_courses) return item;

        const formattedCourse = {
          ...item,
          tbl_courses: {
            ...item.tbl_courses,
            price: item.tbl_courses.price
              ? Number(item.tbl_courses.price)
              : 0,
            rating: item.tbl_courses.rating
              ? Number(Number(item.tbl_courses.rating).toFixed(1))
              : 0,
          },
        };

        return formattedCourse;
      });


      return formattedCoursesInCategory;
    } catch (error) {
      console.error(
        `Error fetching courses for category ${categoryId}:`,
        error,
      );
      throw error;
    }
  }
}

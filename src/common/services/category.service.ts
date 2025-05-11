import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CategoryService {
  /**
   * Lấy tất cả categories từ database
   * @returns Danh sách tất cả categories
   */
  async getAllCategories() {
    try {
      const categories = await prisma.tbl_categories.findMany();
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Lấy category theo ID
   * @param categoryId ID của category cần lấy
   * @returns Thông tin của category
   */
  async getCategoryById(categoryId: string) {
    try {
      const category = await prisma.tbl_categories.findUnique({
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
      const coursesInCategory = await prisma.tbl_course_categories.findMany({
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

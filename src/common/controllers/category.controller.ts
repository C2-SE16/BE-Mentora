import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { CategoryService } from '../services/category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    try {
      const categories = await this.categoryService.getAllCategories();
      return {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully',
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:categoryId')
  async getCategoryById(@Param('categoryId') categoryId: string) {
    try {
      const category = await this.categoryService.getCategoryById(categoryId);
      
      if (!category) {
        throw new HttpException({
          success: false,
          message: 'Category not found',
        }, HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        data: category,
        message: 'Category retrieved successfully',
      };
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      
      throw new HttpException({
        success: false,
        message: 'Failed to retrieve category',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:categoryId/courses')
  async getCoursesByCategory(@Param('categoryId') categoryId: string) {
    try {
      const courses = await this.categoryService.getCoursesByCategory(categoryId);
      
      return {
        success: true,
        data: courses,
        message: 'Courses retrieved successfully',
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'Failed to retrieve courses for this category',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 
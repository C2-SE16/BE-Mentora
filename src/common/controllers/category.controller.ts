import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/category/create-category.dto';
import { UpdateCategoryDto } from '../dto/category/update-category.dto';
import { PaginationDto } from '../dto/common/pagination.dto';
import { Roles } from '../decorators/roles.decorator';
import { role_enum } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.categoryService.findAll(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Get(':id/courses')
  async getCoursesByCategory2(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('minRating') minRating?: number,
  ) {
    return this.categoryService.getCoursesByCategory(id, {
      page,
      limit,
      minRating,
    });
  }

  @Get(':id/rating-counts')
  async getCoursesCountByRating(@Param('id') id: string) {
    return await this.categoryService.getCoursesCountByRating(id);
  }

  @Get('/:categoryId')
  async getCategoryById(@Param('categoryId') categoryId: string) {
    try {
      const category = await this.categoryService.getCategoryById(categoryId);

      if (!category) {
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: category,
        message: 'Category retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve category',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:categoryId/courses')
  async getCoursesByCategory(@Param('categoryId') categoryId: string) {
    try {
      const courses =
        await this.categoryService.getCoursesByCategory(categoryId);
      return {
        success: true,
        courses,
        message: 'Courses retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve courses for this category',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

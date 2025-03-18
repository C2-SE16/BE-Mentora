
import { Body, Controller, Delete, Get, Param, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';


@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  @Get('search')
  async searchCourses(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('minRating') minRating?: number,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.courseService.searchCourses({
      query,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      minRating: minRating ? +minRating : undefined,
      categoryId,
      sortBy,
      sortOrder,
      minPrice: minPrice ? +minPrice : undefined,
      maxPrice: maxPrice ? +maxPrice : undefined,
    });
  }
  @Post('/create')
  createCourse(@Body() body: CreateCourseDto) {
    return this.courseService.createCourse(body);
  }

  @Post('create-simple')
  async createSimpleCourse(@Body() createCourseDto: CreateSimpleCourseDto) {
    try {
      const course = await this.courseService.createSimpleCourse(createCourseDto);
      return {
        success: true,
        data: course,
        message: 'Course created successfully',
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'Failed to create course',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    try {
      const course = await this.courseService.getCourseById(courseId);
      
      if (!course) {
        throw new HttpException({
          success: false,
          message: 'Course not found',
        }, HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        data: course,
        message: 'Course retrieved successfully',
      };
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      
      throw new HttpException({
        success: false,
        message: 'Failed to retrieve course',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/:courseId')
  updateCourse(@Param('courseId') courseId: string, @Body() body: CreateCourseDto) {
    return this.courseService.updateCourse(courseId, body);
  }

  @Get()
  getCourse() {
    return this.courseService.getCourse();
  }

  @Delete('/:courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return this.courseService.deleteCourse(courseId);
  }
  
}

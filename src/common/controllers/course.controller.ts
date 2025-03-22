import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Query, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new HttpException({
          success: false,
          message: 'Failed to create course',
          error: error.message,
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new HttpException({
        success: false,
        message: 'Unknown error occurred',
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
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        success: false,
        message: 'Failed to retrieve course',
        error: (error as Error).message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/:courseId')
  async updateCourse(
    @Param('courseId') courseId: string, 
    @Body() body: CreateCourseDto
  ) {
    try {
      const updatedCourse = await this.courseService.updateCourse(courseId, body);
      return {
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException({
        success: false,
        message: 'Failed to update course',
        error: (error as Error).message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  getCourse() {
    return this.courseService.getCourse();
  }

  @Delete('/:courseId')    
  async deleteCourse(@Param('courseId') courseId: string) {
  try {
    await this.courseService.deleteCourse(courseId);
    return {
      success: true,
      message: 'Course deleted successfully',
    };
  } catch (error: unknown) {
    throw new HttpException({
      success: false,
      message: 'Failed to delete course',
      error: (error as Error).message,
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
    
  @Get('/detail/:courseId')
  getCourseDetail(@Param('courseId') courseId: string) {
    console.log('controller get detail');
    return this.courseService.getCourseWithDetails(courseId);
  
  }
}

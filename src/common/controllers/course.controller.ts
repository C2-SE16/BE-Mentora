import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';
// import { SearchCourseDto } from '../dto/search-course.dto';
// import { SearchCourseDto } from '../dto/search-course.dto';

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

  @Post('/:courseId')
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: CreateCourseDto,
  ) {
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

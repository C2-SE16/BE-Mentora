import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
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

  @Get('/detail/:courseId')
  getCourseDetail(@Param('courseId') courseId: string) {
    return this.courseService.getCourseWithDetails(courseId);
  }
}

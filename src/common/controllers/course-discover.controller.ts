import { Controller, Get, Query } from '@nestjs/common';
import { CourseDiscoverService } from '../services/course-discover.service';

@Controller('courses-discover')
export class CourseDiscoverController {
  constructor(private readonly courseDiscoverService: CourseDiscoverService) {}

  @Get('popular')
  async getPopularCourses(
    @Query('categoryId') categoryId?: string,
    @Query('categoryName') categoryName?: string,
    @Query('limit') limit = 10,
  ) {
    return this.courseDiscoverService.getPopularCourses(
      categoryId,
      categoryName,
      limit,
    );
  }

  @Get('new')
  async getNewCourses(
    @Query('categoryId') categoryId?: string,
    @Query('categoryName') categoryName?: string,
    @Query('limit') limit = 10,
  ) {
    return this.courseDiscoverService.getNewCourses(
      categoryId,
      categoryName,
      limit,
    );
  }

  @Get('trending')
  async getTrendingCourses(
    @Query('categoryId') categoryId?: string,
    @Query('categoryName') categoryName?: string,
    @Query('limit') limit = 10,
    @Query('days') days = 30,
  ) {
    return this.courseDiscoverService.getTrendingCourses(
      categoryId,
      categoryName,
      limit,
      days,
    );
  }
}

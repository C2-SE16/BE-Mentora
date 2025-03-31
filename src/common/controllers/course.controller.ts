import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDetailsDto } from '../dto/update-course-details.dto';

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
      const course =
        await this.courseService.createSimpleCourse(createCourseDto);
      return {
        success: true,
        data: course,
        message: 'Course created successfully',
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new HttpException(
          {
            success: false,
            message: 'Failed to create course',
            error: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: 'Unknown error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('homepage')
  @HttpCode(HttpStatus.OK)
  async getHomepageCourses() {
    try {
      return await this.courseService.getHomepageCourses();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get homepage courses',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    try {
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        throw new HttpException(
          {
            success: false,
            message: 'Course not found',
          },
          HttpStatus.NOT_FOUND,
        );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve course',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId')
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: CreateCourseDto,
  ) {
    try {
      const updatedCourse = await this.courseService.updateCourse(
        courseId,
        body,
      );
      return {
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update course',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete course',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId/details')
  async updateCourseDetails(
    @Param('courseId') courseId: string,
    @Body() body: UpdateCourseDetailsDto,
  ) {
    try {
      const updatedDetails = await this.courseService.updateCourseDetails(
        courseId,
        body,
      );
      return {
        success: true,
        data: updatedDetails,
        message: 'Course details updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update course details',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId/learning-objectives')
  async updateLearningObjectives(
    @Param('courseId') courseId: string,
    @Body('learningObjectives') learningObjectives: string[],
  ) {
    try {
      const updatedObjectives =
        await this.courseService.updateLearningObjectives(
          courseId,
          learningObjectives,
        );
      return {
        success: true,
        data: updatedObjectives,
        message: 'Learning objectives updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update learning objectives',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId/requirements')
  async updateRequirements(
    @Param('courseId') courseId: string,
    @Body('requirements') requirements: string[],
  ) {
    try {
      const updatedRequirements = await this.courseService.updateRequirements(
        courseId,
        requirements,
      );
      return {
        success: true,
        data: updatedRequirements,
        message: 'Requirements updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update requirements',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId/target-audience')
  async updateTargetAudience(
    @Param('courseId') courseId: string,
    @Body('targetAudience') targetAudience: string[],
  ) {
    try {
      const updatedAudience = await this.courseService.updateTargetAudience(
        courseId,
        targetAudience,
      );
      return {
        success: true,
        data: updatedAudience,
        message: 'Target audience updated successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update target audience',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:courseId/details')
  async getCourseDetails(@Param('courseId') courseId: string) {
    try {
      const details = await this.courseService.getCourseDetails(courseId);
      if (!details) {
        throw new HttpException(
          {
            success: false,
            message: 'Details not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: details,
        message: 'Course details retrieved successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve course details',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/detail/:courseId')
  getCourseDetail(@Param('courseId') courseId: string) {
    console.log('controller get detail');
    return this.courseService.getCourseWithDetails(courseId);
  }
}

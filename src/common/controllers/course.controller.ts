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
  ValidationPipe,
  UseGuards,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';
import { CreateSimpleCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDetailsDto } from '../dto/update-course-details.dto';
import { SearchCourseDto } from '../dto/search-course.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateCourseBasicDto } from '../dto/update-course-basic.dto';
import { GetCoursesQueryDto } from '../dto/course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('search')
  async searchCourses(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchCourseDto,
  ) {
    return this.courseService.searchCourses(searchDto);
  }

  @Post('/create')
  createCourse(@Body() body: CreateCourseDto) {
    return this.courseService.createCourse(body);
  }

  @Post('create-simple')
  @UseGuards(JwtAuthGuard)
  async createSimpleCourse(
    @Body() createCourseDto: CreateSimpleCourseDto,
    @GetUser() user,
  ) {
    try {
      const course = await this.courseService.createSimpleCourse(
        createCourseDto,
        user.userId,
      );
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

  @Get('homepage/all')
  @HttpCode(HttpStatus.OK)
  async getAllHomepageCourses(
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    try {
      return await this.courseService.getAllHomepageCourses(offset, limit);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get all homepage courses',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('/:courseId/status')
  @UseGuards(JwtAuthGuard)
  async updateCourseStatus(
    @Param('courseId') courseId: string,
    @Body('approved') approved: string,
  ) {
    try {
      console.log(approved);
      const course = await this.courseService.getCourseById(courseId);
      console.log(course);
      if (!course) {
        throw new HttpException(
          {
            success: false,
            message: 'Course not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedCourse = await this.courseService.updateCourseStatus(
        courseId,
        approved,
      );

      return {
        success: true,
        data: updatedCourse,
        message: 'Course status updated successfully',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update course status',
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
  async getCourses(@Query() query: GetCoursesQueryDto) {
    return this.courseService.getCourses(query);
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
  async getCourseDetail(@Param('courseId') courseId: string) {
    try {
      const courseDetails =
        await this.courseService.getCourseWithDetails(courseId);

      if (!courseDetails) {
        throw new HttpException(
          {
            success: false,
            message: 'Không tìm thấy khóa học',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: courseDetails,
        message: 'Lấy thông tin khóa học thành công',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Không thể lấy thông tin khóa học',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/instructor/my-courses')
  @UseGuards(JwtAuthGuard)
  async getCoursesByInstructor(@GetUser() user) {
    try {
      const courses = await this.courseService.getCoursesByUserId(user.userId);
      return {
        success: true,
        data: courses,
        message: 'Courses retrieved successfully',
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve instructor courses',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:courseId/basic-info')
  @UseGuards(JwtAuthGuard)
  async updateCourseBasicInfo(
    @Param('courseId') courseId: string,
    @Body() body: UpdateCourseBasicDto,
    @GetUser() user,
  ) {
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

      // Kiểm tra xem người dùng có phải là instructor của course không
      if (
        course.instructor &&
        course.instructor.user &&
        course.instructor.user.userId !== user.userId
      ) {
        throw new HttpException(
          {
            success: false,
            message: 'You are not authorized to update this course',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const updatedCourse = await this.courseService.updateCourseBasicInfo(
        courseId,
        body,
      );

      return {
        success: true,
        data: updatedCourse,
        message: 'Course basic information updated successfully',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update course basic information',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('category/:categoryId')
  async getCoursesByCategory(@Param('categoryId') categoryId: string) {
    return this.courseService.getCoursesByCategory(categoryId);
  }
}

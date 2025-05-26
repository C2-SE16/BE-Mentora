import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InstructorService } from '../services/instructor.service';
import { CreateInstructorDto } from '../dto/create-instructor.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('check')
  async checkIsInstructor(@Request() req) {
    const result = await this.instructorService.checkIsInstructor(
      req.user.userId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async becomeInstructor(
    @Request() req,
    @Body() createInstructorDto: CreateInstructorDto,
  ) {
    return this.instructorService.becomeInstructor(
      req.user.userId,
      createInstructorDto,
    );
  }

  @Get(':instructorId')
  async getInstructorById(@Param('instructorId') instructorId: string) {
    try {
      return await this.instructorService.getInstructorById(instructorId);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to get instructor information',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

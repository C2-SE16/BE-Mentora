import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InstructorService } from '../services/instructor.service';
import { CreateInstructorDto } from '../dto/create-instructor.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('check')
  async checkIsInstructor(@Request() req) {
    const isInstructor = await this.instructorService.checkIsInstructor(req.user.userId);
    return { isInstructor };
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async becomeInstructor(@Request() req, @Body() createInstructorDto: CreateInstructorDto) {
    return this.instructorService.becomeInstructor(req.user.userId, createInstructorDto);
  }
} 
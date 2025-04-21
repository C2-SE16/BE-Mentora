import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dto/update-user-profile.dto';
import { UserProfileEntity } from 'src/entities/user-profile.entity';
import { PublicInstructorGuard } from '../guards/public-instructor.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUserProfile(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileEntity> {
    return this.userService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PublicInstructorGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}

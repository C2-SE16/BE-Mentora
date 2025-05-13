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
  Query,
  Delete,
  Post,
  Put,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dto/update-user-profile.dto';
import { UserProfileEntity } from 'src/entities/user-profile.entity';
import { PublicInstructorGuard } from '../guards/public-instructor.guard';
import {
  GetUsersQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../dto/user-management.dto';
import { role_enum } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateUserProfile(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileEntity> {
    return this.userService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PublicInstructorGuard)
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.getUsers(query);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(id, updateRoleDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role_enum.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Get(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUserByIdAdmin(@Param('id') id: string) {
    return this.userService.getUserByIdAdmin(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserByAdmin(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserAdminDto,
  ) {
    return this.userService.updateUserByAdmin(id, updateUserDto);
  }

  @Delete(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUserByAdmin(@Param('id') id: string) {
    return this.userService.deleteUserByAdmin(id);
  }
}

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user-profile.dto';
import { UserProfileEntity } from 'src/entities/user-profile.entity';
import {
  GetUsersQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../dto/user-management.dto';
import { role_enum, Prisma } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prismaService.tbl_users.findUnique({
      where: {
        userId,
      },
    });

    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }

    const updateUser = await this.prismaService.tbl_users.update({
      where: { userId },
      data: {
        fullName: updateUserDto.fullName,
        avatar: updateUserDto.avatar,
        title: updateUserDto.title,
        description: updateUserDto.description,
        websiteLink: updateUserDto.websiteLink,
        facebookLink: updateUserDto.facebookLink,
        youtubeLink: updateUserDto.youtubeLink,
        linkedinLink: updateUserDto.linkedinLink,
        updatedAt: new Date(),
      },
    });

    return new UserProfileEntity(updateUser);
  }

  async getUserById(id: string) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: {
        userId: id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserProfileEntity(user);
  }

  async getUsers(query: GetUsersQueryDto) {
    const { search, role, page = '1', limit = '10' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Prisma.tbl_usersWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            fullName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      this.prismaService.tbl_users.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          email: true,
          fullName: true,
          avatar: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prismaService.tbl_users.count({ where }),
    ]);

    return {
      users: users.map((user) => new UserProfileEntity(user)),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  async updateUserRole(userId: string, updateRoleDto: UpdateUserRoleDto) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.tbl_users.update({
      where: { userId },
      data: { role: updateRoleDto.role },
    });

    return new UserProfileEntity(updatedUser);
  }

  async updateUserStatus(userId: string, updateStatusDto: UpdateUserStatusDto) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.tbl_users.update({
      where: { userId },
      data: { isEmailVerified: updateStatusDto.status === 'active' },
    });

    return new UserProfileEntity(updatedUser);
  }

  async deleteUser(userId: string) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prismaService.tbl_users.delete({
      where: { userId },
    });

    return { message: 'User deleted successfully' };
  }

  async getUserByIdAdmin(id: string) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: {
        userId: id,
      },
      include: {
        tbl_instructors: {
          include: {
            tbl_courses: {
              include: {
                tbl_course_categories: {
                  include: {
                    tbl_categories: true,
                  },
                },
                tbl_instructors: {
                  include: {
                    tbl_users: true,
                  },
                },
              },
            },
          },
        },
        tbl_course_enrollments: {
          include: {
            tbl_courses: {
              include: {
                tbl_course_categories: {
                  include: {
                    tbl_categories: true,
                  },
                },
                tbl_instructors: {
                  include: {
                    tbl_users: true,
                  },
                },
              },
            },
          },
        },
        tbl_course_reviews: {
          include: {
            tbl_courses: {
              include: {
                tbl_course_categories: {
                  include: {
                    tbl_categories: true,
                  },
                },
                tbl_instructors: {
                  include: {
                    tbl_users: true,
                  },
                },
              },
            },
          },
        },
        tbl_payment: true,
        tbl_favorites: {
          include: {
            tbl_courses: {
              include: {
                tbl_course_categories: {
                  include: {
                    tbl_categories: true,
                  },
                },
                tbl_instructors: {
                  include: {
                    tbl_users: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prismaService.tbl_users.findFirst({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prismaService.tbl_users.create({
      data: {
        userId: uuidv4(),
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        role: createUserDto.role,
        avatar: createUserDto.avatar,
        title: createUserDto.title,
        description: createUserDto.description,
        websiteLink: createUserDto.websiteLink,
        facebookLink: createUserDto.facebookLink,
        youtubeLink: createUserDto.youtubeLink,
        linkedinLink: createUserDto.linkedinLink,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return new UserProfileEntity(user);
  }

  async updateUserByAdmin(userId: string, updateUserDto: UpdateUserAdminDto) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (updateUserDto.email !== user.email) {
      const existingUser = await this.prismaService.tbl_users.findFirst({
        where: {
          email: updateUserDto.email,
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    let hashedPassword = user.password;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prismaService.tbl_users.update({
      where: { userId },
      data: {
        email: updateUserDto.email,
        password: hashedPassword,
        fullName: updateUserDto.fullName,
        role: updateUserDto.role,
        isEmailVerified: updateUserDto.isEmailVerified,
        avatar: updateUserDto.avatar,
        title: updateUserDto.title,
        description: updateUserDto.description,
        websiteLink: updateUserDto.websiteLink,
        facebookLink: updateUserDto.facebookLink,
        youtubeLink: updateUserDto.youtubeLink,
        linkedinLink: updateUserDto.linkedinLink,
        updatedAt: new Date(),
      },
    });

    return new UserProfileEntity(updatedUser);
  }

  async deleteUserByAdmin(userId: string) {
    const user = await this.prismaService.tbl_users.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.prismaService.$transaction([
      this.prismaService.tbl_course_enrollments.deleteMany({
        where: { userId },
      }),
      this.prismaService.tbl_course_reviews.deleteMany({
        where: { userId },
      }),
      this.prismaService.tbl_payment.deleteMany({
        where: { userId },
      }),
      this.prismaService.tbl_favorites.deleteMany({
        where: { userId },
      }),
      this.prismaService.tbl_instructors.deleteMany({
        where: { userId },
      }),
    ]);

    await this.prismaService.tbl_users.delete({
      where: { userId },
    });

    return { message: 'Xóa người dùng thành công' };
  }
}

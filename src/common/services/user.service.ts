import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user-profile.dto';
import { UserProfileEntity } from 'src/entities/user-profile.entity';

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
}

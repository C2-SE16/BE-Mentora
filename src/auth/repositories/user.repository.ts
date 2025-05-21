import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { role_enum, tbl_users } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<tbl_users | null> {
    return this.prisma.tbl_users.findFirst({
      where: {
        email,
      },
    });
  }

  async createUser(
    email: string,
    hashedPassword: string,
    fullName: string,
    avatar?: string,
    isEmailVerified?: boolean,
    verificationEmailToken?: string,
    verificationEmailTokenExp?: Date,
    role: role_enum = role_enum.STUDENT,
  ): Promise<tbl_users> {
    return this.prisma.tbl_users.create({
      data: {
        userId: uuidv4(),
        email,
        password: hashedPassword,
        fullName,
        avatar,
        role,
        isEmailVerified,
        verificationEmailToken,
        verificationEmailTokenExp,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findById(userId: string): Promise<tbl_users | null> {
    return this.prisma.tbl_users.findUnique({
      where: {
        userId,
      },
    });
  }
}

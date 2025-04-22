import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from '../dto/create-instructor.dto';

@Injectable()
export class InstructorService {
  constructor(private prisma: PrismaService) {}

  async checkIsInstructor(userId: string): Promise<boolean> {
    const instructor = await this.prisma.tbl_instructors.findFirst({
      where: {
        userId: userId,
      },
    });

    return !!instructor;
  }

  async becomeInstructor(userId: string, createInstructorDto: CreateInstructorDto) {
    // Kiểm tra xem người dùng đã là instructor chưa
    const isInstructor = await this.checkIsInstructor(userId);
    if (isInstructor) {
      throw new ConflictException('User is already an instructor');
    }

    // Tạo instructor mới
    return this.prisma.tbl_instructors.create({
      data: {
        instructorId: crypto.randomUUID(),
        userId: userId,
        instructorName: createInstructorDto.instructorName,
        bio: createInstructorDto.bio,
        profilePicture: createInstructorDto.profilePicture,
        experience: createInstructorDto.experience,
        isVerified: false,
        average_rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
 
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateCourseEnrollmentDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID của khóa học',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty({
    description: 'ID của giao dịch thanh toán (nếu có)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false
  })
  @IsOptional()
  @IsUUID()
  paymentId?: string;
}

export class CourseEnrollmentQueryDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID của khóa học',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;
} 
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateCoursePriceDto {
  @ApiProperty({
    description: 'Id của khóa học',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Id khóa học là bắt buộc' })
  @IsString()
  courseId: string;

  @ApiProperty({
    description: 'Giá của khóa học (đơn vị: USD)',
    example: 29.99,
  })
  @IsNotEmpty({ message: 'Giá khóa học là bắt buộc' })
  @IsNumber({}, { message: 'Giá khóa học phải là số' })
  @Min(0, { message: 'Giá khóa học phải lớn hơn hoặc bằng 0' })
  price: number;
} 
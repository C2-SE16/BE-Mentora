import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCourseBasicDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
} 
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateLectureDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  curriculumId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  articleContent?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateLectureDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  articleContent?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class LectureResponseDto {
  lectureId: string;
  curriculumId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  articleContent?: string;
  duration?: number;
  isFree?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { lesson_enum } from '@prisma/client';

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsNotEmpty()
  @IsEnum(lesson_enum)
  contentType: lesson_enum;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(lesson_enum)
  contentType?: lesson_enum;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class LessonResponseDto {
  lessonId: string;
  moduleId: string;
  title: string;
  contentType: lesson_enum;
  contentUrl?: string;
  duration?: number;
  orderIndex: number;
  description?: string;
  isFree?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AddLessonContentDto {
  @IsNotEmpty()
  @IsString()
  contentUrl: string;

  @IsNotEmpty()
  @IsEnum(lesson_enum)
  contentType: lesson_enum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  duration?: number;
}

export class CreateEmptyLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
} 
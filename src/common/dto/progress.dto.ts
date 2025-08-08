import { progress_enum } from '@prisma/client';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateCurriculumProgressDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  curriculumId: string;

  @IsEnum(progress_enum)
  @IsOptional()
  status?: progress_enum;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

export class CreateLectureProgressDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  lectureId: string;

  @IsEnum(progress_enum)
  @IsOptional()
  status?: progress_enum;

  @IsNumber()
  @IsOptional()
  lastPosition?: number;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

export class UpdateCurriculumProgressDto {
  @IsUUID()
  @IsNotEmpty()
  progressId: string;

  @IsEnum(progress_enum)
  @IsOptional()
  status?: progress_enum;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

export class UpdateLectureProgressDto {
  @IsUUID()
  @IsNotEmpty()
  progressId: string;

  @IsEnum(progress_enum)
  @IsOptional()
  status?: progress_enum;

  @IsNumber()
  @IsOptional()
  lastPosition?: number;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

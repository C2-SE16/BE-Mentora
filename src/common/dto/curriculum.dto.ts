import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { curriculum_enum } from '@prisma/client';

export class CreateCurriculumDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsNotEmpty()
  @IsEnum(curriculum_enum)
  type: curriculum_enum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCurriculumDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(curriculum_enum)
  type?: curriculum_enum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CurriculumResponseDto {
  curriculumId: string;
  moduleId: string;
  type: string;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
  title?: string;
  description?: string;
  content?: any;
}

export class CreateEmptyCurriculumDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsNotEmpty()
  @IsEnum(curriculum_enum)
  type: curriculum_enum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;

  @IsOptional()
  @IsString()
  description?: string;
} 
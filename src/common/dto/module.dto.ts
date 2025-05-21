import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ModuleResponseDto {
  moduleId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 
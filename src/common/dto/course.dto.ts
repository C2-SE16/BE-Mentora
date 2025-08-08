import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(250)
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  durationTime: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsUUID()
  instructorId: string;
}

export class CreateSearchHistoryDto {
  @IsNotEmpty()
  content: string;
}

export enum CourseSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCoursesQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CourseSortBy)
  sortBy?: CourseSortBy = CourseSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

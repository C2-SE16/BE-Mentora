import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  reviewId: string;

  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  comment?: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsNotEmpty()
  updatedAt: string;
}

export class UpdateReviewDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  comment?: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsNotEmpty()
  updatedAt: string;
}

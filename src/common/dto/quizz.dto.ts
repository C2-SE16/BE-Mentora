import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  curriculumId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

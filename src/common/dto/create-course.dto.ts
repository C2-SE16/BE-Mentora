import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSimpleCourseDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSimpleCourseDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
} 
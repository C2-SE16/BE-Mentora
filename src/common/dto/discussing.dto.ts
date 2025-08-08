import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDiscussingDto {
  @IsString()
  @IsNotEmpty()
  curriculumId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  userId: string;
}

export class UpdateDiscussingDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;
}

import { IsString, IsOptional } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  @IsOptional()
  instructorName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  experience?: string;
} 
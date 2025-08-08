import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { role_enum } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(role_enum)
  @IsNotEmpty()
  role: role_enum;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  websiteLink?: string;

  @IsString()
  @IsOptional()
  facebookLink?: string;

  @IsString()
  @IsOptional()
  youtubeLink?: string;

  @IsString()
  @IsOptional()
  linkedinLink?: string;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { role_enum } from '@prisma/client';

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(role_enum)
  role?: role_enum;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(role_enum)
  role: role_enum;
}

export class UpdateUserStatusDto {
  @IsString()
  status: 'active' | 'inactive';
}

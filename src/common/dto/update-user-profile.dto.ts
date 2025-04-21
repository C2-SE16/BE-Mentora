import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Website link không hợp lệ' })
  @MaxLength(255)
  websiteLink?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Facebook link không hợp lệ' })
  @MaxLength(255)
  facebookLink?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Youtube link không hợp lệ' })
  @MaxLength(255)
  youtubeLink?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'LinkedIn link không hợp lệ' })
  @MaxLength(255)
  linkedinLink?: string;
}

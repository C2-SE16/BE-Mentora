import { IsOptional, IsString } from 'class-validator';

export class UploadImageDto {
  @IsOptional()
  @IsString()
  folder?: string;
}

export class UploadBase64ImageDto {
  @IsString()
  base64Image: string;

  @IsOptional()
  @IsString()
  folder?: string;
}

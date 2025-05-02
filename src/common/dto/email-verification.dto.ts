import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}

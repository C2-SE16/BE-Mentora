import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { LoginResponseEntity } from '../entities/auth.entity';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from 'src/common/dto/email-verification.dto';
import { EmailVerificationResponseEntity } from 'src/entities/email-verification.entity';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseEntity> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<LoginResponseEntity> {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query() verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponseEntity> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Body() resendDto: ResendVerificationDto,
  ): Promise<EmailVerificationResponseEntity> {
    return this.authService.resendVerificationEmail(resendDto);
  }
}

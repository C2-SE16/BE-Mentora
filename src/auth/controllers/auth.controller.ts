import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import {
  LoginResponseEntity,
  PasswordResetResponseEntity,
} from '../entities/auth.entity';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from 'src/common/dto/email-verification.dto';
import { EmailVerificationResponseEntity } from 'src/entities/email-verification.entity';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserId } from 'src/common/decorators/userid.decorator';

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

  @Post('send-verification-email')
  async resendVerificationEmail(
    @Body() resendDto: ResendVerificationDto,
  ): Promise<EmailVerificationResponseEntity> {
    return this.authService.resendVerificationEmail(resendDto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @UserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}

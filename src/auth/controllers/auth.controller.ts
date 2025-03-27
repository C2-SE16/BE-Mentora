import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import {
  LoginResponseEntity,
} from '../entities/auth.entity';

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

  //   @UseGuards(JwtAuthGuard)
  //   @Post('logout')
  //   async logout(@Req() req): Promise<LogoutResponseEntity> {
  //     return this.authService.logout(req.user.userId);
  //   }
}

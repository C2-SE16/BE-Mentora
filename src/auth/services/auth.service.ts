import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import {
  LoginResponseEntity,
  LogoutResponseEntity,
  PasswordResetResponseEntity,
  RegisterResponseEntity,
  UserEntity,
} from '../entities/auth.entity';
import { EmailService } from 'src/common/services/email.service';
import { ConfigService } from '@nestjs/config';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from 'src/common/dto/email-verification.dto';
import { EmailVerificationResponseEntity } from 'src/entities/email-verification.entity';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/password.dto';
import { generateVerificationToken } from 'src/common/utils/generateVerificationToken.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Login a user with email and password
   * @param loginDto The login credentials
   * @returns User data and access token
   */
  async login(loginDto: LoginDto): Promise<LoginResponseEntity> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email chưa được xác thực');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Generate JWT token
    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Create UserEntity object with user data
    const userEntity = new UserEntity(user);

    // Return login response entity
    return new LoginResponseEntity({
      user: userEntity,
      accessToken,
    });
  }

  /**
   * Register a new user
   * @param registerDto The registration data
   * @returns User data and access token
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseEntity> {
    const { email, password, fullName, avatar, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const newUser = await this.userRepository.createUser(
        email,
        hashedPassword,
        fullName,
        avatar,
        false, // isEmailVerified
        verificationToken,
        verificationTokenExpiry,
        role,
      );

      await this.emailService.sendVerificationEmail(email, verificationToken);

      // Generate JWT token
      const payload = {
        sub: newUser.userId,
        email: newUser.email,
        role: newUser.role,
      };

      const accessToken = this.jwtService.sign(payload);

      // Create UserEntity object with new user data
      const userEntity = new UserEntity(newUser);

      // Return register response entity
      return new RegisterResponseEntity({
        user: userEntity,
        accessToken,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Get user profile by ID
   * @param userId User ID
   * @returns User data without password
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user entity
    return new UserEntity(user);
  }

  async logout(userId: string) {
    return new LogoutResponseEntity({ message: 'Logged out successfully' });
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponseEntity> {
    const { token } = verifyEmailDto;

    const user = await this.prisma.tbl_users.findFirst({
      where: {
        verificationEmailToken: token,
        verificationEmailTokenExp: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.tbl_users.update({
      where: {
        userId: user.userId,
      },
      data: {
        isEmailVerified: true,
        verificationEmailToken: null,
        verificationEmailTokenExp: null,
      },
    });

    return new EmailVerificationResponseEntity({
      message: 'Email verified successfully',
      success: true,
    });
  }

  async resendVerificationEmail(resendDto: ResendVerificationDto) {
    const { email } = resendDto;

    const user = await this.prisma.tbl_users.findFirst({
      where: {
        email,
        isEmailVerified: false,
      },
    });

    if (!user) {
      throw new BadRequestException('Email not found or already verified');
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.tbl_users.update({
      where: {
        userId: user.userId,
      },
      data: {
        verificationEmailToken: verificationToken,
        verificationEmailTokenExp: verificationTokenExpiry,
      },
    });

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return new EmailVerificationResponseEntity({
      message: 'Verification email sent successfully',
      success: true,
    });
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return new PasswordResetResponseEntity({
        message: 'Email không tồn tại',
        success: false,
      });
    }

    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 giờ

    await this.prisma.tbl_users.update({
      where: { userId: user.userId },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExp: resetTokenExpiry,
      },
    });

    await this.emailService.sendResetPasswordEmail(email, resetToken);

    return new PasswordResetResponseEntity({
      message: 'Email đã được gửi đến bạn',
      success: true,
    });
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    const { token, password } = resetPasswordDto;

    const user = await this.prisma.tbl_users.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const hashedPassword = await hashPassword(password);

    await this.prisma.tbl_users.update({
      where: { userId: user.userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExp: null,
      },
    });

    return new PasswordResetResponseEntity({
      message: 'Mật khẩu đã được đặt lại thành công',
      success: true,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordResetResponseEntity> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.tbl_users.findUnique({
      where: { userId },
    });

    const isPasswordValid = await comparePassword(
      currentPassword,
      user?.password || '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.tbl_users.update({
      where: { userId },
      data: {
        password: hashedPassword,
      },
    });

    return new PasswordResetResponseEntity({
      message: 'Mật khẩu đã được cập nhật thành công',
      success: true,
    });
  }
}

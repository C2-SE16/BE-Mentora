import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import {
  LoginResponseEntity,
  LogoutResponseEntity,
  RegisterResponseEntity,
  UserEntity,
} from '../entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login a user with email and password
   * @param loginDto The login credentials
   * @returns User data and access token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
  async register(registerDto: RegisterDto) {
    const { email, password, fullName, avatar, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const newUser = await this.userRepository.createUser(
        email,
        hashedPassword,
        fullName,
        avatar,
        role,
      );

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
}

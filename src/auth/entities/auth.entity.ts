import { Exclude, Expose, Type } from 'class-transformer';
import { role_enum } from '@prisma/client';

export class UserEntity {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: role_enum | null;
  avatar: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  @Exclude()
  password: string | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class LoginResponseEntity {
  @Expose()
  @Type(() => UserEntity)
  user: UserEntity;

  @Expose()
  accessToken: string;

  constructor(partial: Partial<LoginResponseEntity>) {
    Object.assign(this, partial);
  }
}

export class RegisterResponseEntity extends LoginResponseEntity {
  constructor(partial: Partial<RegisterResponseEntity>) {
    super(partial);
  }
}

export class LogoutResponseEntity {
  @Expose()
  message: string;

  constructor(partial: Partial<LogoutResponseEntity>) {
    Object.assign(this, partial);
  }
}

export class PasswordResetResponseEntity {
  message: string;
  success: boolean;

  constructor(partial: Partial<PasswordResetResponseEntity>) {
    Object.assign(this, partial);
  }
}

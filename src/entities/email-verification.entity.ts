import { Expose } from 'class-transformer';

export class EmailVerificationResponseEntity {
  @Expose()
  message: string;

  @Expose()
  success: boolean;

  constructor(partial: Partial<EmailVerificationResponseEntity>) {
    Object.assign(this, partial);
  }
}

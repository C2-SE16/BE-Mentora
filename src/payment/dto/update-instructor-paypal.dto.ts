import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInstructorPaypalDto {
  @ApiProperty({
    description: 'Email tài khoản PayPal của instructor',
    example: 'instructor@example.com',
  })
  @IsNotEmpty({ message: 'Email PayPal là bắt buộc' })
  @IsEmail({}, { message: 'Email PayPal không hợp lệ' })
  @IsString()
  paypalEmail: string;
} 
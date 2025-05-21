import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaypalDto {
  @ApiProperty({
    description: 'Token xác nhận PayPal',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Token xác nhận là bắt buộc' })
  @IsString()
  token: string;
} 
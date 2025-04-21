import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class RemoveFromCartDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class GetCartDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
} 
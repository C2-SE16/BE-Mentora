import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  // @IsNotEmpty()
  // @IsString()
  // userId: string;
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

export interface DiscountedCourseInfo {
  courseId: string;
  title: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface AppliedVoucherInCart {
  code: string;
  voucherId: string;
  discountedCourses: DiscountedCourseInfo[];
}

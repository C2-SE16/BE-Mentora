import { IsNotEmpty, IsString, IsUUID, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class RemoveFromCartDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class GetCartDto {
  @IsOptional()
  @IsString()
  userId?: string;
}

export class SelectCartItemsDto {
  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsNotEmpty()
  @IsArray()
  @IsUUID(undefined, { each: true })
  selectedCourseIds: string[];
}

export class GetSelectedCartItemsDto {
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CartItemDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
  
  @IsOptional()
  @IsBoolean()
  selected?: boolean = false;
}

export class UpdateCartItemStatusDto {
  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsNotEmpty()
  @IsArray()
  items: CartItemDto[];
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

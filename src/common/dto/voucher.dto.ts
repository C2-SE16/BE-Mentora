import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  VoucherDiscountTypeEnum,
  VoucherScopeEnum,
} from '../constants/voucher.constant';
import { ROLE } from '../constants/role.constant';

export class CreateVoucherDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(VoucherScopeEnum)
  scope: VoucherScopeEnum;

  @IsEnum(VoucherDiscountTypeEnum)
  discountType: VoucherDiscountTypeEnum;

  @IsNumber()
  discountValue: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsNumber()
  @IsOptional()
  maxUsage?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  // @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  courseIds?: string; // if scope is SPECIFIC_COURSES

  @IsUUID()
  @IsOptional()
  categoryId?: string; // if scope is CATEGORY

  @IsString()
  @IsOptional()
  creatorRole?: string = ROLE.INSTRUCTOR;
}

export class ApplyVoucherDto {
  @IsString()
  code: string;

  @IsString()
  courseIds: string; // list of course ids in cart

  @IsBoolean()
  @IsOptional()
  applyToAllCourses?: boolean;
}

export interface VoucherInfo {
  voucherId: string;
  code: string;
  description?: string;
  scope: string;
  courseId?: string;
  creatorId?: string;
  creatorRole?: string;
  categoryId?: string;
  discountType: string;
  discountValue: number;
  maxDiscount?: number;
  startDate: Date | string;
  endDate: Date | string;
  maxUsage?: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class UpdateVoucherDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(VoucherDiscountTypeEnum)
  @IsOptional()
  discountType?: VoucherDiscountTypeEnum;

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @IsOptional()
  maxUsage?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  courseIds?: string;
}

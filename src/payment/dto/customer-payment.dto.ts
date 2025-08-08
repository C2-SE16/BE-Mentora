import { IsNotEmpty, IsString, IsUrl, IsOptional, IsArray, IsUUID } from 'class-validator';

export class InitiateCustomerPaymentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  returnUrl: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  cancelUrl: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  selectedCourseIds?: string[];
}

export class CaptureCustomerPaymentDto {
  @IsNotEmpty()
  @IsString()
  token: string;
  
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class PaypalWebhookDto {
  @IsNotEmpty()
  event_type: string;
  
  @IsNotEmpty()
  resource: any;
} 
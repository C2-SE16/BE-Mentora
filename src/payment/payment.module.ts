import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaypalService } from './services/paypal.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EmailService } from '../common/services/email.service';
import { RoleCheckService } from '../common/services/role-check.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerPaymentService } from './services/customer-payment.service';
import { CustomerPaymentController } from './controllers/customer-payment.controller';
import { RedisModule } from '../common/cache/redis.module';
import { CartModule } from '../common/modules/cart.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    CartModule,
    CommonModule
  ],
  controllers: [
    PaymentController,
    CustomerPaymentController
  ],
  providers: [
    PaymentService, 
    PaypalService, 
    EmailService, 
    RoleCheckService,
    RolesGuard,
    CustomerPaymentService
  ],
  exports: [
    PaymentService, 
    PaypalService,
    CustomerPaymentService
  ],
})
export class PaymentModule {} 
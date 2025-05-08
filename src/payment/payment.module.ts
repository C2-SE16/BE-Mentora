import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaypalService } from './services/paypal.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EmailService } from '../common/services/email.service';
import { RoleCheckService } from '../common/services/role-check.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaypalService, EmailService, RoleCheckService, RolesGuard],
  exports: [PaymentService, PaypalService],
})
export class PaymentModule {} 
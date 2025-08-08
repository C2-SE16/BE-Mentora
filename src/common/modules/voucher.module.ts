import { Module } from '@nestjs/common';
import { VoucherController } from '../controllers/voucher.controller';
import { VoucherService } from '../services/voucher.service';
import { RoleCheckService } from '../services/role-check.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VoucherController],
  providers: [VoucherService, RoleCheckService],
  exports: [VoucherService],
})
export class VoucherModule {}

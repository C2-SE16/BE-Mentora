import { Module } from '@nestjs/common';
import { VoucherController } from '../controllers/voucher.controller';
import { VoucherService } from '../services/voucher.service';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}

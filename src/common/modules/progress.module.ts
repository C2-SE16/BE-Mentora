import { Module } from '@nestjs/common';
import { ProgressController } from '../controllers/progress.controller';
import { ProgressService } from '../services/progress.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

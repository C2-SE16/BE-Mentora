import { Module } from '@nestjs/common';
import { DiscussingController } from 'src/common/controllers/discussing.controller';
import { DiscussingService } from 'src/common/services/discussing.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  controllers: [DiscussingController],
  providers: [DiscussingService, PrismaService],
  exports: [DiscussingService],
})
export class DiscussingModule {}

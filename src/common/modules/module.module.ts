import { Module } from '@nestjs/common';
import { ModuleController } from '../controllers/module.controller';
import { ModuleService } from '../services/module.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {} 
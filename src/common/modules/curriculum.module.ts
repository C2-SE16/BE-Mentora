import { Module } from '@nestjs/common';
import { CurriculumController } from '../controllers/curriculum.controller';
import { CurriculumService } from '../services/curriculum.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {} 
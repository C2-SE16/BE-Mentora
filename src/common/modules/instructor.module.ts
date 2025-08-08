import { Module } from '@nestjs/common';
import { InstructorService } from '../services/instructor.service';
import { InstructorController } from '../controllers/instructor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorController],
  providers: [InstructorService],
  exports: [InstructorService],
})
export class InstructorModule {} 
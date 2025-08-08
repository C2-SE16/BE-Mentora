import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizzController } from 'src/common/controllers/quizz.controller';
import { QuizzService } from 'src/common/services/quizz.service';

@Module({
  imports: [PrismaModule],
  controllers: [QuizzController],
  providers: [QuizzService],
  exports: [QuizzService],
})
export class QuizzModule {}

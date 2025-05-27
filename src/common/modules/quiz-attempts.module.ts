import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizAttemptController } from 'src/common/controllers/quiz-attempts.controller';
import { QuizAttemptService } from 'src/common/services/quiz-attempts.service';
import { ProgressModule } from './progress.module';

@Module({
  imports: [PrismaModule, ProgressModule],
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}

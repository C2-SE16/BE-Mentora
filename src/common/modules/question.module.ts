import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestionController } from 'src/common/controllers/question.controller';
import { QuestionService } from 'src/common/services/question.service';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}

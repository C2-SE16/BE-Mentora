import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Put,
  Delete,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from 'src/common/dto/question.dto';
import { QuestionService } from 'src/common/services/question.service';

interface ImportQuestionsDto {
  text: string;
  quizId: string;
  options: {
    questionSeparator: string;
    answerSeparator: string;
    correctAnswerPrefix: string;
  };
}

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}
  //   @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questionService.createQuestion(dto);
  }

  @Put(':questionId')
  update(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.updateQuestionAndAnswer(questionId, dto);
  }

  @Delete(':questionId')
  delete(@Param('questionId') questionId: string) {
    return this.questionService.deleteQuestion(questionId);
  }

  @Get('/quiz/:quizId')
  getByQuizId(@Param('quizId') quizId: string) {
    return this.questionService.getQuestionsByQuizId(quizId);
  }

  @Post('import')
  async importQuestions(@Body() dto: ImportQuestionsDto) {
    try {
      return await this.questionService.importQuestionsFromText(
        dto.text,
        dto.quizId,
        dto.options,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to import questions',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

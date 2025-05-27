import { Controller, Post, Body, Param, Get, Put } from '@nestjs/common';
import { QuizAttemptService } from 'src/common/services/quiz-attempts.service';

@Controller('quiz-attempts')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  @Post('start')
  async start(@Body() body: { userId: string; quizId: string }) {
    return this.quizAttemptService.startQuizAttempt(
      body.userId,
      body.quizId,
      [],
    );
  }

  @Post(':attemptId/answer')
  answer(
    @Param('attemptId') attemptId: string,
    @Body() body: { questionId: string; selectedAnswerId: string | string[] },
  ) {
    return this.quizAttemptService.saveAnswer(
      attemptId,
      body.questionId,
      body.selectedAnswerId,
    );
  }

  @Post(':attemptId/submit')
  submit(@Param('attemptId') attemptId: string) {
    return this.quizAttemptService.submitAttempt(attemptId);
  }

  @Get(':attemptId/result')
  getResult(@Param('attemptId') attemptId: string) {
    return this.quizAttemptService.getResult(attemptId);
  }

  @Put(':attemptId/cache')
  cacheProgress(
    @Param('attemptId') attemptId: string,
    @Body()
    body: { answers: Record<string, string | string[]>; timeLeft: number },
  ) {
    return this.quizAttemptService.cacheProgress(
      attemptId,
      body.answers,
      body.timeLeft,
    );
  }

  @Get(':attemptId/cache')
  getProgress(@Param('attemptId') attemptId: string) {
    return this.quizAttemptService.getResult(attemptId);
  }

  @Get('quiz/:quizId')
  getQuizAttemptsByQuizId(@Param('quizId') quizId: string) {
    return this.quizAttemptService.getQuizAttemptsByQuizId(quizId);
  }
}

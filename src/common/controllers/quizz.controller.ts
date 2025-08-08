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
import { CreateQuizDto } from 'src/common/dto/quizz.dto';
import { QuizzService } from 'src/common/services/quizz.service';
@Controller('quizzes')
export class QuizzController {
  constructor(private readonly quizzService: QuizzService) {}
  //   @UseGuards(JwtAuthGuard)
  @Post()
  createQuizz(@Body() dto: CreateQuizDto) {
    return this.quizzService.createQuizz(dto);
  }

  @Get('/:quizId')
  async getCourseById(@Param('quizId') quizId: string) {
    try {
      const quiz = await this.quizzService.getQuizzById(quizId);
      if (!quiz) {
        throw new HttpException(
          {
            success: false,
            message: 'quiz not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: quiz,
        message: 'quiz retrieved successfully',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve quiz',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/:quizId/time')
  async getQuizTime(@Param('quizId') quizId: string) {
    try {
      const timeLimit = await this.quizzService.getQuizTime(quizId);

      return {
        success: true,
        timeLimit: timeLimit,
        message: 'quiz retrieved successfully',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve quiz time',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/:quizId/test-attempt')
  async getQuizQuestionsForAttempt(@Param('quizId') quizId: string) {
    try {
      const quiz = await this.quizzService.getQuizQuestionsForAttempt(quizId);
      if (!quiz) {
        throw new HttpException(
          {
            success: false,
            message: 'quiz not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: quiz,
        message: 'quiz retrieved successfully',
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve quiz',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('/:quizId')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: Partial<CreateQuizDto>,
  ) {
    try {
      const updated = await this.quizzService.updateQuiz(quizId, dto);
      return {
        success: true,
        data: updated,
        message: 'Quiz updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update quiz',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string) {
    try {
      await this.quizzService.deleteQuiz(quizId);
      return {
        success: true,
        message: 'Quiz deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete quiz',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

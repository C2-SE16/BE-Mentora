import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from 'src/common/dto/quizz.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class QuizzService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQuizz(createQuizDto: CreateQuizDto) {
    const quizz = await this.prismaService.tbl_quizzes.create({
      data: {
        quizId: uuidv4(),
        ...createQuizDto,
      },
    });
    return quizz;
  }

  async getQuizzById(quizId: string) {
    const quiz = await this.prismaService.tbl_quizzes.findUnique({
      where: {
        quizId: quizId,
      },
      include: {
        tbl_questions: {
          include: {
            tbl_answers: true,
          },
        },
      },
    });
    return quiz;
  }

  async getQuizTime(quizId: string) {
    const quiz = await this.prismaService.tbl_quizzes.findUnique({
      where: {
        quizId: quizId,
      },
    });
    return quiz?.timeLimit;
  }

  async updateQuiz(quizId: string, updateDto: Partial<CreateQuizDto>) {
    return this.prismaService.tbl_quizzes.update({
      where: { quizId },
      data: updateDto,
    });
  }

  async deleteQuiz(quizId: string) {
    const questions = await this.prismaService.tbl_questions.findMany({
      where: { quizId },
      select: { questionId: true },
    });

    const questionIds = questions.map((q) => q.questionId);

    if (questionIds.length > 0) {
      await this.prismaService.tbl_answers.deleteMany({
        where: {
          questionId: { in: questionIds },
        },
      });

      await this.prismaService.tbl_questions.deleteMany({
        where: {
          questionId: { in: questionIds },
        },
      });
    }

    await this.prismaService.tbl_quizzes.delete({
      where: { quizId },
    });
  }
  async getQuizQuestionsForAttempt(quizId: string) {
    const quiz = await this.prismaService.tbl_quizzes.findUnique({
      where: {
        quizId,
      },
      include: {
        tbl_questions: {
          include: {
            tbl_answers: {
              select: {
                answerId: true,
                answerText: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    return {
      quizId: quiz.quizId,
      title: quiz.title,
      questions: quiz.tbl_questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        answers: q.tbl_answers.map((a) => ({
          answerId: a.answerId,
          answerText: a.answerText,
        })),
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  AnswerDto,
} from 'src/common/dto/question.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { tbl_questions, tbl_answers } from '@prisma/client';

interface ImportQuestionOptions {
  questionSeparator: string; // Ký hiệu phân biệt các câu hỏi
  answerSeparator: string; // Ký hiệu phân biệt các đáp án
  correctAnswerPrefix: string; // Tiền tố để đánh dấu đáp án đúng
}

type QuestionWithAnswers = tbl_questions & {
  tbl_answers: tbl_answers[];
};

@Injectable()
export class QuestionService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQuestion(dto: CreateQuestionDto) {
    const { answers, ...questionData } = dto;

    const formattedAnswers = answers.map((answer) => ({
      ...answer,
      answerId: uuidv4(),
    }));

    return this.prismaService.tbl_questions.create({
      data: {
        ...questionData,
        questionId: uuidv4(),
        tbl_answers: {
          create: formattedAnswers,
        },
      },
      include: {
        tbl_answers: true,
      },
    });
  }

  async updateQuestionAndAnswer(questionId: string, dto: UpdateQuestionDto) {
    const { answers, ...questionUpdate } = dto;

    const updatedQuestion = await this.prismaService.tbl_questions.update({
      where: { questionId },
      data: {
        ...questionUpdate,
      },
    });

    if (answers) {
      await this.prismaService.tbl_answers.deleteMany({
        where: { questionId },
      });

      await this.prismaService.tbl_answers.createMany({
        data: answers.map((ans) => ({
          ...ans,
          answerId: ans.answerId ?? uuidv4(),
          questionId,
        })),
      });
    }

    return {
      ...updatedQuestion,
      answers: await this.prismaService.tbl_answers.findMany({
        where: { questionId },
      }),
    };
  }

  async deleteQuestion(questionId: string) {
    // Xoá toàn bộ đáp án trước
    await this.prismaService.tbl_answers.deleteMany({
      where: { questionId },
    });

    // Sau đó xoá câu hỏi
    await this.prismaService.tbl_questions.delete({
      where: { questionId },
    });

    return { message: 'Question and related answers deleted successfully' };
  }

  async getQuestionsByQuizId(quizId: string) {
    return this.prismaService.tbl_questions.findMany({
      where: { quizId },
      include: { tbl_answers: true },
    });
  }

  async importQuestionsFromText(
    text: string,
    quizId: string,
    options: ImportQuestionOptions,
  ) {
    const questions = text
      .split(options.questionSeparator)
      .filter((q) => q.trim());
    const importedQuestions: QuestionWithAnswers[] = [];

    for (const questionText of questions) {
      const [questionContent, ...answersText] = questionText
        .split(options.answerSeparator)
        .map((item) => item.trim())
        .filter((item) => item);

      const answers: AnswerDto[] = answersText.map((answerText) => {
        const isCorrect = answerText.startsWith(options.correctAnswerPrefix);
        const answerContent = isCorrect
          ? answerText.slice(options.correctAnswerPrefix.length).trim()
          : answerText;

        return {
          answerText: answerContent,
          isCorrect,
        };
      });

      const questionData: CreateQuestionDto = {
        quizId,
        questionText: questionContent,
        questionType: 'MULTIPLE_CHOICE',
        orderIndex: importedQuestions.length + 1,
        answers,
      };

      const createdQuestion = await this.createQuestion(questionData);
      importedQuestions.push(createdQuestion as QuestionWithAnswers);
    }

    return importedQuestions;
  }
}

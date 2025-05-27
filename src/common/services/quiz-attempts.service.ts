import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';

export interface AttemptCache {
  startTime: number;
  quizId: string;
  userId: string;
  questions: any[];
  answers: Record<string, string | string[]>;
  timeLeft?: number;
}

@Injectable()
export class QuizAttemptService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) { }

  private getKey(attemptId: string): string {
    return `quiz-attempt:${attemptId}`;
  }

  async startQuizAttempt(userId: string, quizId: string, questions: any[]) {
    const attemptId = uuidv4();
    const key = this.getKey(attemptId);

    if (!Array.isArray(questions)) {
      throw new Error('Danh sách câu hỏi phải là một mảng');
    }

    const quiz = await this.prisma.tbl_quizzes.findUnique({
      where: { quizId },
      include: {
        tbl_questions: {
          include: {
            tbl_answers: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra');
    }

    const attemptData: AttemptCache = {
      startTime: Date.now(),
      quizId,
      userId,
      questions: quiz.tbl_questions.map((q) => ({
        ...q,
        quiz: {
          passingScore: quiz.passingScore,
        },
      })),
      answers: {},
    };

    await this.cacheManager.set(key, attemptData);
    return { attemptId, startTime: Date.now() };
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswers: string | string[],
  ) {
    console.log('=== saveAnswer ===');
    console.log('attemptId:', attemptId);
    console.log('questionId:', questionId);
    console.log('selectedAnswers:', selectedAnswers);

    const key = this.getKey(attemptId);
    const attempt = await this.cacheManager.get<AttemptCache>(key);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');

    // Validate questionId exists
    const question = attempt.questions.find((q) => q.questionId === questionId);
    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    console.log('Question type:', question.questionType);
    console.log('Question answers:', question.tbl_answers);

    // Validate selected answers
    if (
      !selectedAnswers ||
      (Array.isArray(selectedAnswers) && selectedAnswers.length === 0)
    ) {
      throw new Error('Vui lòng chọn ít nhất một đáp án');
    }

    // Convert selectedAnswers to array for consistent handling
    const selectedAnswerIds = Array.isArray(selectedAnswers)
      ? selectedAnswers
      : [selectedAnswers];
    console.log('Selected answer IDs:', selectedAnswerIds);

    // Validate answer type matches question type
    if (
      question.questionType === 'SINGLE_CHOICE' &&
      selectedAnswerIds.length > 1
    ) {
      throw new Error('Câu hỏi chỉ cho phép chọn một đáp án');
    }

    // Validate selected answers exist in question's answers
    const validAnswerIds = question.tbl_answers.map((a) => a.answerId);
    const invalidAnswers = selectedAnswerIds.filter(
      (id) => !validAnswerIds.includes(id),
    );
    if (invalidAnswers.length > 0) {
      throw new Error('Có đáp án không hợp lệ');
    }

    // Lưu đáp án vào cache - luôn lưu đáp án mới nhất
    attempt.answers[questionId] =
      selectedAnswerIds.length === 1 ? selectedAnswerIds[0] : selectedAnswerIds;
    await this.cacheManager.set(key, attempt);

    console.log('Saved answers:', attempt.answers);
    return { success: true };
  }

  private calculateScore(attempt: AttemptCache): {
    score: number;
    correctAnswersCount: number;
  } {
    console.log('=== calculateScore ===');
    console.log('Total questions:', attempt.questions.length);
    console.log('User answers:', attempt.answers);

    let score = 0;
    let correctAnswersCount = 0;
    const totalQuestions = attempt.questions.length;

    if (!attempt.questions || !Array.isArray(attempt.questions)) {
      return { score: 0, correctAnswersCount: 0 };
    }

    for (const question of attempt.questions) {
      if (!question || !question.tbl_answers) continue;

      console.log('\nProcessing question:', question.questionId);
      console.log('Question type:', question.questionType);

      const correctAnswers = question.tbl_answers
        .filter((a) => a.isCorrect)
        .map((a) => a.answerId);

      console.log('Correct answers:', correctAnswers);

      const userAnswers = attempt.answers[question.questionId];
      if (!userAnswers) {
        console.log('No answer for this question');
        continue;
      }

      let isCorrect = false;
      const userAnswerIds = Array.isArray(userAnswers)
        ? userAnswers
        : [userAnswers];
      console.log('User answers:', userAnswerIds);

      switch (question.questionType) {
        case 'SINGLE_CHOICE':
          isCorrect =
            correctAnswers.length === 1 &&
            correctAnswers[0] === userAnswerIds[0];
          break;
        case 'MULTIPLE_CHOICE':
          // Kiểm tra xem tất cả đáp án đúng đều được chọn và không có đáp án sai nào được chọn
          const allCorrectAnswersSelected = correctAnswers.every((ans) =>
            userAnswerIds.includes(ans),
          );
          const noWrongAnswersSelected = userAnswerIds.every((ans) =>
            correctAnswers.includes(ans),
          );
          isCorrect = allCorrectAnswersSelected && noWrongAnswersSelected;
          break;
        case 'TRUE_FALSE':
          isCorrect =
            correctAnswers.length === 1 &&
            correctAnswers[0] === userAnswerIds[0];
          break;
      }

      console.log('Is correct:', isCorrect);
      if (isCorrect) {
        correctAnswersCount++;
      }
    }

    // Tính điểm theo phần trăm: (số câu đúng / tổng số câu) * 100
    const percentageScore = Math.round(
      (correctAnswersCount / totalQuestions) * 100,
    );

    console.log('\nFinal results:');
    console.log('Correct answers count:', correctAnswersCount);
    console.log('Total questions:', totalQuestions);
    console.log('Percentage score:', percentageScore);

    return { score: percentageScore, correctAnswersCount };
  }

  async submitAttempt(attemptId: string) {
    console.log('=== submitAttempt ===');
    console.log('attemptId:', attemptId);

    const key = this.getKey(attemptId);
    const attempt = await this.cacheManager.get<AttemptCache>(key);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');

    console.log('Attempt data:', {
      userId: attempt.userId,
      quizId: attempt.quizId,
      questionsCount: attempt.questions.length,
      answersCount: Object.keys(attempt.answers).length,
    });

    if (
      !attempt.questions ||
      !Array.isArray(attempt.questions) ||
      attempt.questions.length === 0
    ) {
      throw new Error(
        'Dữ liệu bài kiểm tra không hợp lệ: thiếu hoặc sai định dạng câu hỏi',
      );
    }

    // Check time limit
    const timeLimit = 3600000; // 1 hour in milliseconds
    const timeSpent = Date.now() - attempt.startTime;
    console.log('Time spent:', timeSpent, 'ms');

    if (timeSpent > timeLimit) {
      throw new Error('Đã hết thời gian làm bài');
    }

    const { score, correctAnswersCount } = this.calculateScore(attempt);
    const totalQuestions = attempt.questions.length;
    const passingScore = attempt.questions[0]?.quiz?.passingScore || 70;

    console.log('\nQuiz results:');
    console.log('Score:', score);
    console.log('Correct answers:', correctAnswersCount);
    console.log('Total questions:', totalQuestions);
    console.log('Passing score:', passingScore);

    // Tạo bản ghi attempt trong database
    const quizAttempt = await this.prisma.tbl_quiz_attempts.create({
      data: {
        attemptId,
        userId: attempt.userId,
        quizId: attempt.quizId,
        score,
        isPassed: score >= passingScore,
        startedAt: new Date(attempt.startTime),
        completedAt: new Date(),
      },
    });

    console.log('Created quiz attempt:', quizAttempt);

    // Lưu tất cả đáp án vào database
    for (const [questionId, selectedAnswers] of Object.entries(
      attempt.answers,
    )) {
      const question = attempt.questions.find(
        (q) => q.questionId === questionId,
      );
      if (!question) continue;

      const correctAnswers = question.tbl_answers
        .filter((a) => a.isCorrect)
        .map((a) => a.answerId);

      const isCorrect = Array.isArray(selectedAnswers)
        ? correctAnswers.length === selectedAnswers.length &&
        correctAnswers.every((ans) => selectedAnswers.includes(ans))
        : correctAnswers.length === 1 && correctAnswers[0] === selectedAnswers;

      const quizAnswer = await this.prisma.tbl_quiz_answers.create({
        data: {
          userAnswerId: uuidv4(),
          attemptId,
          questionId,
          answerId: Array.isArray(selectedAnswers)
            ? selectedAnswers[0]
            : selectedAnswers,
          isCorrect,
        },
      });

      console.log('Created quiz answer:', quizAnswer);
    }

    // Xóa cache sau khi submit thành công
    await this.cacheManager.del(key);

    // Cập nhật curriculum progress nếu đạt yêu cầu
    if (quizAttempt.isPassed) {
      try {
        console.log('Updating curriculum progress...');
        await this.progressService.hasCompletedQuiz(
          attempt.userId,
          attempt.quizId
        );
        console.log('Curriculum progress updated successfully');
      } catch (error) {
        console.error('Error updating curriculum progress:', error);
      }
    }

    return {
      score,
      totalQuestions,
      correctAnswers: correctAnswersCount,
      isPassed: quizAttempt.isPassed,
      timeSpent: Math.round(timeSpent / 1000 / 60), // Convert to minutes
    };
  }

  async getResult(attemptId: string) {
    const key = this.getKey(attemptId);
    const attempt = await this.cacheManager.get<AttemptCache>(key);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');

    // Check if attempt is submitted
    const submittedAttempt = await this.prisma.tbl_quiz_attempts.findUnique({
      where: { attemptId },
    });

    if (!submittedAttempt) {
      // If not submitted, include time left
      const timeLimit = 3600000; // 1 hour in milliseconds
      const timeSpent = Date.now() - attempt.startTime;
      const timeLeft = Math.max(0, timeLimit - timeSpent);
      return { ...attempt, timeLeft };
    }
    // Xóa cache sau khi submit thành công
    await this.cacheManager.del(key);
    return attempt;
  }

  async cacheProgress(
    attemptId: string,
    answers: Record<string, string | string[]>,
    timeLeft: number,
  ) {
    const key = this.getKey(attemptId);
    const attempt = await this.cacheManager.get<AttemptCache>(key);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');
    attempt.answers = answers;
    attempt.timeLeft = timeLeft;
    await this.cacheManager.set(key, attempt);
    return { success: true };
  }

  async getQuizAttemptsByQuizId(quizId: string) {
    const attempts = await this.prisma.tbl_quiz_attempts.findMany({
      where: {
        quizId,
      },
      include: {
        tbl_users: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
        tbl_quizzes: {
          select: {
            quizId: true,
            passingScore: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return attempts;
  }
}

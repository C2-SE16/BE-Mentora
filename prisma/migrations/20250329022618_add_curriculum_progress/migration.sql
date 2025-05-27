/*
  Warnings:

  - You are about to drop the `tbl_lesson_progess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_lessons` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "curriculum_enum" AS ENUM ('LECTURE', 'QUIZ');

-- CreateEnum
CREATE TYPE "question_type_enum" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "progress_enum" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "tbl_lesson_progess" DROP CONSTRAINT "tbl_lesson_progess_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_lesson_progess" DROP CONSTRAINT "tbl_lesson_progess_userId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_lessons" DROP CONSTRAINT "tbl_lessons_moduleId_fkey";

-- DropTable
DROP TABLE "tbl_lesson_progess";

-- DropTable
DROP TABLE "tbl_lessons";

-- DropEnum
DROP TYPE "lesson_enum";

-- DropEnum
DROP TYPE "lesson_progress_enum";

-- CreateTable
CREATE TABLE "tbl_curricula" (
    "curriculumId" UUID NOT NULL,
    "moduleId" UUID,
    "title" VARCHAR,
    "orderIndex" INTEGER NOT NULL,
    "type" "curriculum_enum" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_curricula_pkey" PRIMARY KEY ("curriculumId")
);

-- CreateTable
CREATE TABLE "tbl_curriculum_progress" (
    "progressId" UUID NOT NULL,
    "userId" UUID,
    "curriculumId" UUID,
    "status" "progress_enum" DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_curriculum_progress_pkey" PRIMARY KEY ("progressId")
);

-- CreateTable
CREATE TABLE "tbl_lectures" (
    "lectureId" UUID NOT NULL,
    "curriculumId" UUID,
    "title" VARCHAR,
    "description" TEXT,
    "videoUrl" VARCHAR(255),
    "articleContent" TEXT,
    "duration" INTEGER,
    "isFree" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_lectures_pkey" PRIMARY KEY ("lectureId")
);

-- CreateTable
CREATE TABLE "tbl_quizzes" (
    "quizId" UUID NOT NULL,
    "curriculumId" UUID,
    "title" VARCHAR,
    "description" TEXT,
    "passingScore" INTEGER DEFAULT 70,
    "timeLimit" INTEGER,
    "isFree" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_quizzes_pkey" PRIMARY KEY ("quizId")
);

-- CreateTable
CREATE TABLE "tbl_questions" (
    "questionId" UUID NOT NULL,
    "quizId" UUID,
    "questionText" TEXT NOT NULL,
    "questionType" "question_type_enum" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_questions_pkey" PRIMARY KEY ("questionId")
);

-- CreateTable
CREATE TABLE "tbl_answers" (
    "answerId" UUID NOT NULL,
    "questionId" UUID,
    "answerText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_answers_pkey" PRIMARY KEY ("answerId")
);

-- CreateTable
CREATE TABLE "tbl_lecture_progress" (
    "progressId" UUID NOT NULL,
    "userId" UUID,
    "lectureId" UUID,
    "status" "progress_enum",
    "lastPosition" INTEGER DEFAULT 0,
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_lecture_progress_pkey" PRIMARY KEY ("progressId")
);

-- CreateTable
CREATE TABLE "tbl_quiz_attempts" (
    "attemptId" UUID NOT NULL,
    "userId" UUID,
    "quizId" UUID,
    "score" INTEGER NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(6) NOT NULL,
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_quiz_attempts_pkey" PRIMARY KEY ("attemptId")
);

-- CreateTable
CREATE TABLE "tbl_quiz_answers" (
    "userAnswerId" UUID NOT NULL,
    "attemptId" UUID,
    "questionId" UUID,
    "answerId" UUID,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(6),

    CONSTRAINT "tbl_quiz_answers_pkey" PRIMARY KEY ("userAnswerId")
);

-- AddForeignKey
ALTER TABLE "tbl_curricula" ADD CONSTRAINT "tbl_curricula_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "tbl_modules"("moduleId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_curriculum_progress" ADD CONSTRAINT "tbl_curriculum_progress_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "tbl_curricula"("curriculumId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_curriculum_progress" ADD CONSTRAINT "tbl_curriculum_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lectures" ADD CONSTRAINT "tbl_lectures_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "tbl_curricula"("curriculumId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_quizzes" ADD CONSTRAINT "tbl_quizzes_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "tbl_curricula"("curriculumId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_questions" ADD CONSTRAINT "tbl_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "tbl_quizzes"("quizId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_answers" ADD CONSTRAINT "tbl_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tbl_questions"("questionId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lecture_progress" ADD CONSTRAINT "tbl_lecture_progress_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "tbl_lectures"("lectureId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lecture_progress" ADD CONSTRAINT "tbl_lecture_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_quiz_attempts" ADD CONSTRAINT "tbl_quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "tbl_quizzes"("quizId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_quiz_attempts" ADD CONSTRAINT "tbl_quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_quiz_answers" ADD CONSTRAINT "tbl_quiz_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "tbl_quiz_attempts"("attemptId") ON DELETE NO ACTION ON UPDATE NO ACTION;

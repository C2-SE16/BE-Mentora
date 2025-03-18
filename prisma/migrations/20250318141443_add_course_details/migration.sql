-- CreateEnum
CREATE TYPE "approve_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "category_enum" AS ENUM ('INFORMATION_TECHNOLOGY', 'MARKETING', 'FINANCE', 'BUSSINESS');

-- CreateEnum
CREATE TYPE "lesson_enum" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ');

-- CreateEnum
CREATE TYPE "lesson_progress_enum" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "payment_enum" AS ENUM ('COMPLETED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "role_enum" AS ENUM ('ADMIN', 'STUDENT', 'INSTRUCTOR', 'SUPPORT_STAFF', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "voucher_scope_enum" AS ENUM ('ALL_COURSES', 'SPECIFIC_COURSES', 'CATEGORY');

-- CreateTable
CREATE TABLE "tbl_cart" (
    "cartId" UUID NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_cart_pkey" PRIMARY KEY ("cartId")
);

-- CreateTable
CREATE TABLE "tbl_cart_items" (
    "cartItemId" UUID NOT NULL,
    "courseId" UUID,
    "cartId" UUID,
    "price" DECIMAL,
    "discount" DOUBLE PRECISION,
    "appliedVoucherId" UUID,
    "finalPrice" DECIMAL,

    CONSTRAINT "tbl_cart_items_pkey" PRIMARY KEY ("cartItemId")
);

-- CreateTable
CREATE TABLE "tbl_categories" (
    "categoryId" UUID NOT NULL,
    "categoryType" "category_enum",

    CONSTRAINT "tbl_categories_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "tbl_course_categories" (
    "courseCategoryId" UUID NOT NULL,
    "categoryId" UUID,
    "courseId" UUID,

    CONSTRAINT "tbl_course_categories_pkey" PRIMARY KEY ("courseCategoryId")
);

-- CreateTable
CREATE TABLE "tbl_course_enrollments" (
    "courseEnrollmentId" UUID NOT NULL,
    "courseId" UUID,
    "enrolledAt" TIMESTAMP(6),
    "userId" UUID,

    CONSTRAINT "tbl_course_enrollments_pkey" PRIMARY KEY ("courseEnrollmentId")
);

-- CreateTable
CREATE TABLE "tbl_course_reviews" (
    "reviewId" UUID NOT NULL,
    "courseId" UUID,
    "userId" UUID,
    "rating" DECIMAL NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_course_reviews_pkey" PRIMARY KEY ("reviewId")
);

-- CreateTable
CREATE TABLE "tbl_courses" (
    "courseId" UUID NOT NULL,
    "instructorId" UUID,
    "title" VARCHAR,
    "description" TEXT,
    "overview" TEXT,
    "durationTime" INTEGER,
    "price" DECIMAL,
    "approved" "approve_enum",
    "rating" DECIMAL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_courses_pkey" PRIMARY KEY ("courseId")
);

-- CreateTable
CREATE TABLE "tbl_favorites" (
    "favoriteId" UUID NOT NULL,
    "userId" UUID,
    "courseId" UUID,

    CONSTRAINT "tbl_favorites_pkey" PRIMARY KEY ("favoriteId")
);

-- CreateTable
CREATE TABLE "tbl_instructors" (
    "instructorId" UUID NOT NULL,
    "userId" UUID,
    "bio" TEXT,
    "profilePicture" VARCHAR,
    "experience" TEXT,
    "average_rating" DECIMAL,
    "isVerified" BOOLEAN,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_instructors_pkey" PRIMARY KEY ("instructorId")
);

-- CreateTable
CREATE TABLE "tbl_lesson_progess" (
    "lessonProgressId" UUID NOT NULL,
    "userId" UUID,
    "lessonId" UUID,
    "status" "lesson_progress_enum",
    "progressPercentage" INTEGER DEFAULT 0,
    "lastWatchPosition" INTEGER DEFAULT 0,
    "completedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_lesson_progess_pkey" PRIMARY KEY ("lessonProgressId")
);

-- CreateTable
CREATE TABLE "tbl_lessons" (
    "lessonId" UUID NOT NULL,
    "moduleId" UUID,
    "title" VARCHAR,
    "contentType" "lesson_enum" NOT NULL,
    "contentUrl" VARCHAR(255),
    "duration" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "description" TEXT,
    "isFree" BOOLEAN,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_lessons_pkey" PRIMARY KEY ("lessonId")
);

-- CreateTable
CREATE TABLE "tbl_modules" (
    "moduleId" UUID NOT NULL,
    "courseId" UUID,
    "title" VARCHAR,
    "orderIndex" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_modules_pkey" PRIMARY KEY ("moduleId")
);

-- CreateTable
CREATE TABLE "tbl_order_details" (
    "orderDetailId" UUID NOT NULL,
    "paymentId" UUID,
    "courseId" UUID,
    "price" DECIMAL,
    "discount" DOUBLE PRECISION,
    "finalPrice" DECIMAL,
    "createdAt" TIMESTAMP(6),

    CONSTRAINT "tbl_order_details_pkey" PRIMARY KEY ("orderDetailId")
);

-- CreateTable
CREATE TABLE "tbl_payment" (
    "paymentId" UUID NOT NULL,
    "userId" UUID,
    "amount" DECIMAL,
    "paymentMethod" VARCHAR,
    "status" "payment_enum",
    "transactionId" VARCHAR,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_payment_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "tbl_users" (
    "userId" UUID NOT NULL,
    "email" VARCHAR,
    "password" VARCHAR,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "avatar" TEXT,
    "role" "role_enum",
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "tbl_voucher_courses" (
    "voucherCourseId" UUID NOT NULL,
    "voucherId" UUID,
    "courseId" UUID,
    "createdAt" TIMESTAMP(6),

    CONSTRAINT "tbl_voucher_courses_pkey" PRIMARY KEY ("voucherCourseId")
);

-- CreateTable
CREATE TABLE "tbl_voucher_usage_history" (
    "usageId" UUID NOT NULL,
    "voucherId" UUID,
    "userId" UUID,
    "orderId" UUID,
    "usedAt" TIMESTAMP(6),
    "discountAmount" DECIMAL,

    CONSTRAINT "tbl_voucher_usage_history_pkey" PRIMARY KEY ("usageId")
);

-- CreateTable
CREATE TABLE "tbl_vouchers" (
    "voucherId" UUID NOT NULL,
    "code" VARCHAR,
    "description" TEXT,
    "scope" "voucher_scope_enum",
    "discountType" VARCHAR DEFAULT 'Percentage',
    "discountValue" DECIMAL,
    "maxDiscount" DECIMAL,
    "startDate" TIMESTAMP(6),
    "endDate" TIMESTAMP(6),
    "maxUsage" INTEGER,
    "isActive" BOOLEAN,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_vouchers_pkey" PRIMARY KEY ("voucherId")
);

-- CreateTable
CREATE TABLE "tbl_course_learning_objectives" (
    "objectiveId" UUID NOT NULL,
    "courseId" UUID,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_course_learning_objectives_pkey" PRIMARY KEY ("objectiveId")
);

-- CreateTable
CREATE TABLE "tbl_course_requirements" (
    "requirementId" UUID NOT NULL,
    "courseId" UUID,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_course_requirements_pkey" PRIMARY KEY ("requirementId")
);

-- CreateTable
CREATE TABLE "tbl_course_target_audience" (
    "audienceId" UUID NOT NULL,
    "courseId" UUID,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "tbl_course_target_audience_pkey" PRIMARY KEY ("audienceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vouchers_code_key" ON "tbl_vouchers"("code");

-- AddForeignKey
ALTER TABLE "tbl_cart" ADD CONSTRAINT "tbl_cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_cart_items" ADD CONSTRAINT "tbl_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "tbl_cart"("cartId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_cart_items" ADD CONSTRAINT "tbl_cart_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_categories" ADD CONSTRAINT "tbl_course_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tbl_categories"("categoryId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_categories" ADD CONSTRAINT "tbl_course_categories_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_enrollments" ADD CONSTRAINT "tbl_course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_enrollments" ADD CONSTRAINT "tbl_course_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_reviews" ADD CONSTRAINT "tbl_course_reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_reviews" ADD CONSTRAINT "tbl_course_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_courses" ADD CONSTRAINT "tbl_courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "tbl_instructors"("instructorId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_favorites" ADD CONSTRAINT "tbl_favorites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_favorites" ADD CONSTRAINT "tbl_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_instructors" ADD CONSTRAINT "tbl_instructors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lesson_progess" ADD CONSTRAINT "tbl_lesson_progess_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "tbl_lessons"("lessonId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lesson_progess" ADD CONSTRAINT "tbl_lesson_progess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_lessons" ADD CONSTRAINT "tbl_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "tbl_modules"("moduleId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_modules" ADD CONSTRAINT "tbl_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "tbl_payment"("paymentId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_payment" ADD CONSTRAINT "tbl_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_voucher_courses" ADD CONSTRAINT "tbl_voucher_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_voucher_courses" ADD CONSTRAINT "tbl_voucher_courses_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "tbl_vouchers"("voucherId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_voucher_usage_history" ADD CONSTRAINT "tbl_voucher_usage_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "tbl_order_details"("orderDetailId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_voucher_usage_history" ADD CONSTRAINT "tbl_voucher_usage_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_voucher_usage_history" ADD CONSTRAINT "tbl_voucher_usage_history_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "tbl_vouchers"("voucherId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_learning_objectives" ADD CONSTRAINT "tbl_course_learning_objectives_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_requirements" ADD CONSTRAINT "tbl_course_requirements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_course_target_audience" ADD CONSTRAINT "tbl_course_target_audience_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "tbl_courses"("courseId") ON DELETE NO ACTION ON UPDATE NO ACTION;

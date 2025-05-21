-- AlterTable
ALTER TABLE "tbl_courses" ADD COLUMN     "isBestSeller" BOOLEAN DEFAULT false,
ADD COLUMN     "isRecommended" BOOLEAN DEFAULT false,
ADD COLUMN     "thumbnail" VARCHAR(255);

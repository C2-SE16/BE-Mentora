-- AlterTable
ALTER TABLE "tbl_categories" ADD COLUMN     "createdAt" TIMESTAMP(6),
ADD COLUMN     "updatedAt" TIMESTAMP(6),
ALTER COLUMN "name" SET DATA TYPE VARCHAR;

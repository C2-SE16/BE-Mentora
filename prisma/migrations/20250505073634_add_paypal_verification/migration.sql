-- AlterTable
ALTER TABLE "tbl_instructors" ADD COLUMN     "isPaypalVerified" BOOLEAN DEFAULT false,
ADD COLUMN     "paypalVerificationToken" VARCHAR,
ADD COLUMN     "paypalVerificationTokenExp" TIMESTAMP(6);

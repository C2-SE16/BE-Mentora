-- AlterTable
ALTER TABLE "tbl_users" ADD COLUMN     "isEmailVerified" BOOLEAN DEFAULT false,
ADD COLUMN     "verificationEmailToken" VARCHAR,
ADD COLUMN     "verificationEmailTokenExp" TIMESTAMP(6);

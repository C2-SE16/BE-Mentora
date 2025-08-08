-- AlterTable
ALTER TABLE "tbl_users" ADD COLUMN     "resetPasswordToken" VARCHAR,
ADD COLUMN     "resetPasswordTokenExp" TIMESTAMP(6);

/*
  Warnings:

  - You are about to drop the column `firstName` on the `tbl_users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `tbl_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_users" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "fullName" VARCHAR;

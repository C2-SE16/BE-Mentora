/*
  Warnings:

  - You are about to drop the column `categoryType` on the `tbl_categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_categories" DROP COLUMN "categoryType",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT;

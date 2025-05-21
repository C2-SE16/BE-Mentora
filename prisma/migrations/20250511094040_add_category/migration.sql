-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "category_enum" ADD VALUE 'DESIGN';
ALTER TYPE "category_enum" ADD VALUE 'LIFESTYLE';
ALTER TYPE "category_enum" ADD VALUE 'PERSONAL_DEVELOPMENT';
ALTER TYPE "category_enum" ADD VALUE 'HEALTH';
ALTER TYPE "category_enum" ADD VALUE 'MUSIC';
ALTER TYPE "category_enum" ADD VALUE 'LANGUAGE';
ALTER TYPE "category_enum" ADD VALUE 'SCIENCE';
ALTER TYPE "category_enum" ADD VALUE 'MATH';

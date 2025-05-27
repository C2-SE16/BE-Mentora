-- AlterTable
ALTER TABLE "tbl_voucher_courses" ADD COLUMN     "currentUsage" INTEGER DEFAULT 0,
ADD COLUMN     "discountAmount" DECIMAL,
ADD COLUMN     "finalPrice" DECIMAL,
ADD COLUMN     "isActive" BOOLEAN DEFAULT true,
ADD COLUMN     "maxUsageCount" INTEGER DEFAULT 0,
ADD COLUMN     "originalPrice" DECIMAL,
ADD COLUMN     "updatedAt" TIMESTAMP(6);

-- Drop the table if it exists
DROP TABLE IF EXISTS "tbl_payment_temp";

-- Create the table
CREATE TABLE "tbl_payment_temp" (
    "tempId" UUID NOT NULL,
    "paymentId" VARCHAR,
    "orderId" UUID,
    "userId" UUID,
    "amount" DECIMAL,
    "status" VARCHAR,
    "paymentData" TEXT,
    "createdAt" TIMESTAMP(6),
    "expiresAt" TIMESTAMP(6),

    CONSTRAINT "tbl_payment_temp_pkey" PRIMARY KEY ("tempId")
);

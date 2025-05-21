-- CreateTable
CREATE TABLE "tbl_disscussing" (
    "discussingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "curriculumId" UUID NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_disscussing_pkey" PRIMARY KEY ("discussingId")
);

-- AddForeignKey
ALTER TABLE "tbl_disscussing" ADD CONSTRAINT "tbl_disscussing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl_users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_disscussing" ADD CONSTRAINT "tbl_disscussing_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "tbl_curricula"("curriculumId") ON DELETE RESTRICT ON UPDATE CASCADE;

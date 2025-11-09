-- CreateEnum
CREATE TYPE "CounselingTicketStatus" AS ENUM ('OPEN', 'PROSES', 'DITOLAK', 'CLOSE');

-- CreateTable
CREATE TABLE "CounselingTicket" (
    "id" SERIAL NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "student_user_id" INTEGER NOT NULL,
    "counselor_user_id" INTEGER NOT NULL,
    "preferred_date" DATE NOT NULL,
    "preferred_time" TIME NOT NULL,
    "problem_description" TEXT NOT NULL,
    "status" "CounselingTicketStatus" NOT NULL DEFAULT 'OPEN',
    "confirmed_schedule" TIMESTAMP,
    "rejection_reason" TEXT,
    "counseling_notes" TEXT,
    "completion_notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounselingTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CounselingTicket_ticket_number_key" ON "CounselingTicket"("ticket_number");

-- CreateIndex
CREATE INDEX "CounselingTicket_student_user_id_idx" ON "CounselingTicket"("student_user_id");

-- CreateIndex
CREATE INDEX "CounselingTicket_counselor_user_id_idx" ON "CounselingTicket"("counselor_user_id");

-- CreateIndex
CREATE INDEX "CounselingTicket_status_idx" ON "CounselingTicket"("status");

-- AddForeignKey
ALTER TABLE "CounselingTicket" ADD CONSTRAINT "CounselingTicket_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselingTicket" ADD CONSTRAINT "CounselingTicket_counselor_user_id_fkey" FOREIGN KEY ("counselor_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

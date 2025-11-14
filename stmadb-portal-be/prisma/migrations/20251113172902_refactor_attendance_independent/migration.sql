/*
  Warnings:

  - You are about to drop the column `attendance_closed_at` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_opened` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_opened_at` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code` on the `TeachingJournal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qr_session_id,student_user_id]` on the table `StudentAttendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schedule_id,journal_date]` on the table `TeachingJournal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qr_session_id` to the `StudentAttendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."StudentAttendance" DROP CONSTRAINT "StudentAttendance_journal_id_fkey";

-- DropIndex
DROP INDEX "public"."StudentAttendance_journal_id_student_user_id_key";

-- DropIndex
DROP INDEX "public"."TeachingJournal_qr_code_key";

-- AlterTable
ALTER TABLE "StudentAttendance" ADD COLUMN     "qr_session_id" TEXT NOT NULL,
ALTER COLUMN "journal_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TeachingJournal" DROP COLUMN "attendance_closed_at",
DROP COLUMN "attendance_opened",
DROP COLUMN "attendance_opened_at",
DROP COLUMN "qr_code";

-- CreateTable
CREATE TABLE "AttendanceQRSession" (
    "id" TEXT NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "teacher_user_id" INTEGER NOT NULL,
    "session_date" DATE NOT NULL,
    "qr_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceQRSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceQRSession_qr_code_key" ON "AttendanceQRSession"("qr_code");

-- CreateIndex
CREATE INDEX "AttendanceQRSession_teacher_user_id_idx" ON "AttendanceQRSession"("teacher_user_id");

-- CreateIndex
CREATE INDEX "AttendanceQRSession_schedule_id_idx" ON "AttendanceQRSession"("schedule_id");

-- CreateIndex
CREATE INDEX "AttendanceQRSession_session_date_idx" ON "AttendanceQRSession"("session_date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceQRSession_schedule_id_session_date_key" ON "AttendanceQRSession"("schedule_id", "session_date");

-- CreateIndex
CREATE INDEX "StudentAttendance_qr_session_id_idx" ON "StudentAttendance"("qr_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_qr_session_id_student_user_id_key" ON "StudentAttendance"("qr_session_id", "student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingJournal_schedule_id_journal_date_key" ON "TeachingJournal"("schedule_id", "journal_date");

-- AddForeignKey
ALTER TABLE "AttendanceQRSession" ADD CONSTRAINT "AttendanceQRSession_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceQRSession" ADD CONSTRAINT "AttendanceQRSession_teacher_user_id_fkey" FOREIGN KEY ("teacher_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_qr_session_id_fkey" FOREIGN KEY ("qr_session_id") REFERENCES "AttendanceQRSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "TeachingJournal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

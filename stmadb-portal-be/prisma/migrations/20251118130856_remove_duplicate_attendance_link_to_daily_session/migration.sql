/*
  Warnings:

  - You are about to drop the column `attendance_closed_at` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_opened` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_opened_at` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the column `qr_expires_at` on the `TeachingJournal` table. All the data in the column will be lost.
  - You are about to drop the `JournalStudentAttendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JournalStudentAttendance" DROP CONSTRAINT "JournalStudentAttendance_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."JournalStudentAttendance" DROP CONSTRAINT "JournalStudentAttendance_student_user_id_fkey";

-- DropIndex
DROP INDEX "public"."TeachingJournal_qr_code_key";

-- AlterTable
ALTER TABLE "TeachingJournal" DROP COLUMN "attendance_closed_at",
DROP COLUMN "attendance_opened",
DROP COLUMN "attendance_opened_at",
DROP COLUMN "qr_code",
DROP COLUMN "qr_expires_at",
ADD COLUMN     "daily_session_id" TEXT;

-- DropTable
DROP TABLE "public"."JournalStudentAttendance";

-- CreateIndex
CREATE INDEX "TeachingJournal_daily_session_id_idx" ON "TeachingJournal"("daily_session_id");

-- AddForeignKey
ALTER TABLE "TeachingJournal" ADD CONSTRAINT "TeachingJournal_daily_session_id_fkey" FOREIGN KEY ("daily_session_id") REFERENCES "DailyAttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

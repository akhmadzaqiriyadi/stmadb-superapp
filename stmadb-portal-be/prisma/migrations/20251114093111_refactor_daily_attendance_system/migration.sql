/*
  Warnings:

  - You are about to drop the column `journal_id` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code_scanned` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `qr_session_id` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the `AttendanceQRSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[daily_session_id,student_user_id]` on the table `StudentAttendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `daily_session_id` to the `StudentAttendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AttendanceQRSession" DROP CONSTRAINT "AttendanceQRSession_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AttendanceQRSession" DROP CONSTRAINT "AttendanceQRSession_teacher_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentAttendance" DROP CONSTRAINT "StudentAttendance_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentAttendance" DROP CONSTRAINT "StudentAttendance_qr_session_id_fkey";

-- DropIndex
DROP INDEX "public"."StudentAttendance_journal_id_idx";

-- DropIndex
DROP INDEX "public"."StudentAttendance_qr_session_id_idx";

-- DropIndex
DROP INDEX "public"."StudentAttendance_qr_session_id_student_user_id_key";

-- AlterTable
ALTER TABLE "StudentAttendance" DROP COLUMN "journal_id",
DROP COLUMN "qr_code_scanned",
DROP COLUMN "qr_session_id",
ADD COLUMN     "daily_session_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."AttendanceQRSession";

-- CreateTable
CREATE TABLE "DailyAttendanceSession" (
    "id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "qr_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendanceSession_session_date_key" ON "DailyAttendanceSession"("session_date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendanceSession_qr_code_key" ON "DailyAttendanceSession"("qr_code");

-- CreateIndex
CREATE INDEX "DailyAttendanceSession_created_by_id_idx" ON "DailyAttendanceSession"("created_by_id");

-- CreateIndex
CREATE INDEX "DailyAttendanceSession_academic_year_id_idx" ON "DailyAttendanceSession"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_daily_session_id_student_user_id_key" ON "StudentAttendance"("daily_session_id", "student_user_id");

-- AddForeignKey
ALTER TABLE "DailyAttendanceSession" ADD CONSTRAINT "DailyAttendanceSession_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendanceSession" ADD CONSTRAINT "DailyAttendanceSession_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_daily_session_id_fkey" FOREIGN KEY ("daily_session_id") REFERENCES "DailyAttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `student_user_id` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `material_summary` on the `TeachingJournal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qr_code]` on the table `TeachingJournal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learning_method` to the `TeachingJournal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material_topic` to the `TeachingJournal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_student_user_id_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "student_user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TeachingJournal" DROP COLUMN "material_summary",
ADD COLUMN     "attendance_closed_at" TIMESTAMP(3),
ADD COLUMN     "attendance_opened" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attendance_opened_at" TIMESTAMP(3),
ADD COLUMN     "learning_achievement" TEXT,
ADD COLUMN     "learning_media" TEXT,
ADD COLUMN     "learning_method" TEXT NOT NULL,
ADD COLUMN     "material_description" TEXT,
ADD COLUMN     "material_topic" TEXT NOT NULL,
ADD COLUMN     "qr_code" TEXT,
ADD COLUMN     "teacher_status" TEXT NOT NULL DEFAULT 'Hadir',
ADD COLUMN     "teacher_status_notes" TEXT;

-- CreateTable
CREATE TABLE "JournalPhoto" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_name" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "student_user_id" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'Hadir',
    "scan_method" TEXT NOT NULL,
    "qr_code_scanned" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_id" INTEGER,
    "notes" TEXT,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalPhoto_journal_id_idx" ON "JournalPhoto"("journal_id");

-- CreateIndex
CREATE INDEX "StudentAttendance_journal_id_idx" ON "StudentAttendance"("journal_id");

-- CreateIndex
CREATE INDEX "StudentAttendance_student_user_id_idx" ON "StudentAttendance"("student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_journal_id_student_user_id_key" ON "StudentAttendance"("journal_id", "student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingJournal_qr_code_key" ON "TeachingJournal"("qr_code");

-- CreateIndex
CREATE INDEX "TeachingJournal_teacher_user_id_idx" ON "TeachingJournal"("teacher_user_id");

-- CreateIndex
CREATE INDEX "TeachingJournal_schedule_id_idx" ON "TeachingJournal"("schedule_id");

-- CreateIndex
CREATE INDEX "TeachingJournal_journal_date_idx" ON "TeachingJournal"("journal_date");

-- AddForeignKey
ALTER TABLE "JournalPhoto" ADD CONSTRAINT "JournalPhoto_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "TeachingJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "TeachingJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

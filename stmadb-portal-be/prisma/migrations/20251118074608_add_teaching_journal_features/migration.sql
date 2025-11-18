/*
  Warnings:

  - You are about to drop the column `photo_name` on the `JournalPhoto` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `JournalPhoto` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qr_code]` on the table `TeachingJournal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `filename` to the `JournalPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalPhoto" DROP COLUMN "photo_name",
DROP COLUMN "uploaded_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "filename" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeachingJournal" ADD COLUMN     "attendance_closed_at" TIMESTAMP(3),
ADD COLUMN     "attendance_opened" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attendance_opened_at" TIMESTAMP(3),
ADD COLUMN     "qr_code" TEXT,
ADD COLUMN     "qr_expires_at" TIMESTAMP(3),
ALTER COLUMN "learning_method" DROP NOT NULL,
ALTER COLUMN "material_topic" DROP NOT NULL;

-- CreateTable
CREATE TABLE "JournalStudentAttendance" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "student_user_id" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'Hadir',
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scan_method" TEXT NOT NULL DEFAULT 'Manual',
    "notes" TEXT,

    CONSTRAINT "JournalStudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalStudentAttendance_journal_id_idx" ON "JournalStudentAttendance"("journal_id");

-- CreateIndex
CREATE INDEX "JournalStudentAttendance_student_user_id_idx" ON "JournalStudentAttendance"("student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "JournalStudentAttendance_journal_id_student_user_id_key" ON "JournalStudentAttendance"("journal_id", "student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingJournal_qr_code_key" ON "TeachingJournal"("qr_code");

-- AddForeignKey
ALTER TABLE "JournalStudentAttendance" ADD CONSTRAINT "JournalStudentAttendance_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "TeachingJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalStudentAttendance" ADD CONSTRAINT "JournalStudentAttendance_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

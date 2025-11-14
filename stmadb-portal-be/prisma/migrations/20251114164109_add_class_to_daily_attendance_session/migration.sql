/*
  Warnings:

  - A unique constraint covering the columns `[session_date,class_id]` on the table `DailyAttendanceSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_id` to the `DailyAttendanceSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."DailyAttendanceSession_session_date_key";

-- AlterTable
ALTER TABLE "DailyAttendanceSession" ADD COLUMN     "class_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "DailyAttendanceSession_class_id_idx" ON "DailyAttendanceSession"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendanceSession_session_date_class_id_key" ON "DailyAttendanceSession"("session_date", "class_id");

-- AddForeignKey
ALTER TABLE "DailyAttendanceSession" ADD CONSTRAINT "DailyAttendanceSession_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

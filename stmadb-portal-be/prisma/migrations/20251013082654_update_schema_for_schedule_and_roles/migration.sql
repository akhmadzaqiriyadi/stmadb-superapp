/*
  Warnings:

  - The values [Teori,Praktek] on the enum `ScheduleType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Teori,Praktek] on the enum `WeekType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleType_new" AS ENUM ('A', 'B', 'Umum');
ALTER TABLE "public"."Schedule" ALTER COLUMN "schedule_type" DROP DEFAULT;
ALTER TABLE "Schedule" ALTER COLUMN "schedule_type" TYPE "ScheduleType_new" USING ("schedule_type"::text::"ScheduleType_new");
ALTER TYPE "ScheduleType" RENAME TO "ScheduleType_old";
ALTER TYPE "ScheduleType_new" RENAME TO "ScheduleType";
DROP TYPE "public"."ScheduleType_old";
ALTER TABLE "Schedule" ALTER COLUMN "schedule_type" SET DEFAULT 'Umum';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WeekType_new" AS ENUM ('A', 'B', 'Libur', 'Ujian', 'Acara');
ALTER TABLE "AcademicWeek" ALTER COLUMN "week_type" TYPE "WeekType_new" USING ("week_type"::text::"WeekType_new");
ALTER TYPE "WeekType" RENAME TO "WeekType_old";
ALTER TYPE "WeekType_new" RENAME TO "WeekType";
DROP TYPE "public"."WeekType_old";
COMMIT;

-- AlterTable
ALTER TABLE "AcademicWeek" ALTER COLUMN "start_date" SET DATA TYPE DATE,
ALTER COLUMN "end_date" SET DATA TYPE DATE;

-- CreateTable
CREATE TABLE "SpecialEvent" (
    "id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "academic_year_id" INTEGER NOT NULL,

    CONSTRAINT "SpecialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineActivity" (
    "id" SERIAL NOT NULL,
    "activity_name" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "description" TEXT,
    "academic_year_id" INTEGER NOT NULL,

    CONSTRAINT "RoutineActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpecialEvent" ADD CONSTRAINT "SpecialEvent_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineActivity" ADD CONSTRAINT "RoutineActivity_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

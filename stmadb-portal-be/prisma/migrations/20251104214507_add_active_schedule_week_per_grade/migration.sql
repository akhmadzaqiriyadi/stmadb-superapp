-- CreateTable
CREATE TABLE "ActiveScheduleWeek" (
    "id" SERIAL NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "active_week_type" "ScheduleType" NOT NULL DEFAULT 'Umum',
    "academic_year_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveScheduleWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveScheduleWeek_grade_level_academic_year_id_key" ON "ActiveScheduleWeek"("grade_level", "academic_year_id");

-- AddForeignKey
ALTER TABLE "ActiveScheduleWeek" ADD CONSTRAINT "ActiveScheduleWeek_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

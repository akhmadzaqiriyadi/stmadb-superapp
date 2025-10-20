/*
  Warnings:

  - A unique constraint covering the columns `[activity_name,day_of_week,academic_year_id]` on the table `RoutineActivity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RoutineActivity_activity_name_day_of_week_academic_year_id_key" ON "RoutineActivity"("activity_name", "day_of_week", "academic_year_id");

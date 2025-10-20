/*
  Warnings:

  - A unique constraint covering the columns `[class_name]` on the table `Classes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Classes_class_name_key" ON "Classes"("class_name");

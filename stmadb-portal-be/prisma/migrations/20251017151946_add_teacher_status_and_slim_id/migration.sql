/*
  Warnings:

  - A unique constraint covering the columns `[slim_id]` on the table `StudentExtension` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('PNS', 'PTK', 'GTT');

-- AlterTable
ALTER TABLE "StudentExtension" ADD COLUMN     "slim_id" TEXT;

-- AlterTable
ALTER TABLE "TeacherExtension" ADD COLUMN     "status" "EmploymentStatus";

-- CreateIndex
CREATE UNIQUE INDEX "StudentExtension_slim_id_key" ON "StudentExtension"("slim_id");

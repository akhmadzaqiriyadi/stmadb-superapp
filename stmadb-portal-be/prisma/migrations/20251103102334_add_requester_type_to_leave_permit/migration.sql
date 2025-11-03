/*
  Warnings:

  - You are about to drop the `RoutineActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RequesterType" AS ENUM ('Student', 'Teacher');

-- DropForeignKey
ALTER TABLE "public"."RoutineActivity" DROP CONSTRAINT "RoutineActivity_academic_year_id_fkey";

-- AlterTable
ALTER TABLE "LeavePermit" ADD COLUMN     "requester_type" "RequesterType" NOT NULL DEFAULT 'Student';

-- DropTable
DROP TABLE "public"."RoutineActivity";

-- CreateIndex
CREATE INDEX "LeavePermit_requester_type_idx" ON "LeavePermit"("requester_type");

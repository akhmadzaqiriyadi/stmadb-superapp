/*
  Warnings:

  - The values [PTK] on the enum `EmploymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `nuptk` on the `TeacherExtension` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmploymentStatus_new" AS ENUM ('PNS', 'PPPK', 'GTT');
ALTER TABLE "TeacherExtension" ALTER COLUMN "status" TYPE "EmploymentStatus_new" USING ("status"::text::"EmploymentStatus_new");
ALTER TYPE "EmploymentStatus" RENAME TO "EmploymentStatus_old";
ALTER TYPE "EmploymentStatus_new" RENAME TO "EmploymentStatus";
DROP TYPE "public"."EmploymentStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."TeacherExtension_nuptk_key";

-- AlterTable
ALTER TABLE "TeacherExtension" DROP COLUMN "nuptk";

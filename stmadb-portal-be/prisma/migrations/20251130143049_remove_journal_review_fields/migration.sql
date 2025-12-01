/*
  Warnings:

  - The values [Reviewed] on the enum `JournalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reviewed_at` on the `PKLJournal` table. All the data in the column will be lost.
  - You are about to drop the column `reviewed_by_id` on the `PKLJournal` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor_feedback` on the `PKLJournal` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor_rating` on the `PKLJournal` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JournalStatus_new" AS ENUM ('Draft', 'Submitted');
ALTER TABLE "public"."PKLJournal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PKLJournal" ALTER COLUMN "status" TYPE "JournalStatus_new" USING ("status"::text::"JournalStatus_new");
ALTER TYPE "JournalStatus" RENAME TO "JournalStatus_old";
ALTER TYPE "JournalStatus_new" RENAME TO "JournalStatus";
DROP TYPE "public"."JournalStatus_old";
ALTER TABLE "PKLJournal" ALTER COLUMN "status" SET DEFAULT 'Draft';
COMMIT;

-- AlterTable
ALTER TABLE "PKLJournal" DROP COLUMN "reviewed_at",
DROP COLUMN "reviewed_by_id",
DROP COLUMN "supervisor_feedback",
DROP COLUMN "supervisor_rating";

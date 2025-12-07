-- CreateEnum
CREATE TYPE "PKLType" AS ENUM ('Onsite', 'Remote', 'Hybrid', 'Flexible');

-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('Regular', 'Shift', 'Flexible');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Primary', 'Secondary', 'Temporary');

-- AlterTable
ALTER TABLE "PKLAssignment" ADD COLUMN     "pkl_type" "PKLType" NOT NULL DEFAULT 'Onsite',
ADD COLUMN     "require_gps_validation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "work_end_time" TIME,
ADD COLUMN     "work_schedule_type" "WorkScheduleType" NOT NULL DEFAULT 'Regular',
ADD COLUMN     "work_start_time" TIME;

-- AlterTable
ALTER TABLE "PKLAttendance" ADD COLUMN     "tap_in_gps_valid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tap_in_location_id" INTEGER,
ADD COLUMN     "tap_out_gps_valid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tap_out_location_id" INTEGER;

-- CreateTable
CREATE TABLE "PKLAllowedLocation" (
    "id" SERIAL NOT NULL,
    "pkl_assignment_id" INTEGER NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_type" "LocationType" NOT NULL DEFAULT 'Primary',
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLAllowedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PKLAllowedLocation_pkl_assignment_id_idx" ON "PKLAllowedLocation"("pkl_assignment_id");

-- AddForeignKey
ALTER TABLE "PKLAllowedLocation" ADD CONSTRAINT "PKLAllowedLocation_pkl_assignment_id_fkey" FOREIGN KEY ("pkl_assignment_id") REFERENCES "PKLAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

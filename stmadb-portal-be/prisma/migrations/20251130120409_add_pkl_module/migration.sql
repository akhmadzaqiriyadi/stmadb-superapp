-- CreateEnum
CREATE TYPE "PKLStatus" AS ENUM ('Active', 'Completed', 'Cancelled', 'OnHold');

-- CreateEnum
CREATE TYPE "PKLAttendanceStatus" AS ENUM ('Present', 'InProgress', 'Absent', 'Excused', 'Sick');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('Draft', 'Submitted', 'Reviewed');

-- CreateTable
CREATE TABLE "Industry" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_code" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 100,
    "industry_type" TEXT,
    "description" TEXT,
    "contact_person_name" TEXT,
    "contact_person_phone" TEXT,
    "contact_person_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_students" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKLAssignment" (
    "id" SERIAL NOT NULL,
    "student_user_id" INTEGER NOT NULL,
    "industry_id" INTEGER NOT NULL,
    "company_mentor_name" TEXT,
    "company_mentor_phone" TEXT,
    "company_mentor_email" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "school_supervisor_id" INTEGER,
    "learning_objectives" TEXT,
    "notes" TEXT,
    "status" "PKLStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKLAttendance" (
    "id" SERIAL NOT NULL,
    "pkl_assignment_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "tap_in_time" TIMESTAMP(3),
    "tap_in_lat" DECIMAL(10,8),
    "tap_in_lng" DECIMAL(11,8),
    "tap_in_photo" TEXT,
    "tap_in_method" TEXT DEFAULT 'Manual',
    "tap_out_time" TIMESTAMP(3),
    "tap_out_lat" DECIMAL(10,8),
    "tap_out_lng" DECIMAL(11,8),
    "tap_out_method" TEXT DEFAULT 'Manual',
    "total_hours" DECIMAL(5,2),
    "status" "PKLAttendanceStatus" NOT NULL DEFAULT 'InProgress',
    "is_manual_entry" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" "ApprovalStatus",
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "evidence_urls" JSONB,
    "manual_reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKLJournal" (
    "id" SERIAL NOT NULL,
    "pkl_assignment_id" INTEGER NOT NULL,
    "attendance_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "activities" TEXT NOT NULL,
    "learnings" TEXT,
    "challenges" TEXT,
    "photos" JSONB,
    "self_rating" INTEGER,
    "status" "JournalStatus" NOT NULL DEFAULT 'Draft',
    "submitted_at" TIMESTAMP(3),
    "supervisor_feedback" TEXT,
    "supervisor_rating" INTEGER,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKLSettings" (
    "id" SERIAL NOT NULL,
    "default_radius_meters" INTEGER NOT NULL DEFAULT 100,
    "default_work_start_time" TIME NOT NULL,
    "default_work_end_time" TIME NOT NULL,
    "grace_period_tap_in_minutes" INTEGER NOT NULL DEFAULT 120,
    "enable_auto_tapout" BOOLEAN NOT NULL DEFAULT true,
    "auto_tapout_time" TIME NOT NULL,
    "auto_tapout_default_hours" DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    "require_gps_validation" BOOLEAN NOT NULL DEFAULT true,
    "require_journal_before_tapout" BOOLEAN NOT NULL DEFAULT true,
    "max_manual_requests_per_month" INTEGER NOT NULL DEFAULT 3,
    "enable_reminders" BOOLEAN NOT NULL DEFAULT true,
    "reminder_tap_in_minutes" INTEGER NOT NULL DEFAULT 15,
    "reminder_journal_time" TIME NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_company_name_key" ON "Industry"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_company_code_key" ON "Industry"("company_code");

-- CreateIndex
CREATE INDEX "Industry_company_name_idx" ON "Industry"("company_name");

-- CreateIndex
CREATE INDEX "Industry_is_active_idx" ON "Industry"("is_active");

-- CreateIndex
CREATE INDEX "PKLAssignment_student_user_id_idx" ON "PKLAssignment"("student_user_id");

-- CreateIndex
CREATE INDEX "PKLAssignment_industry_id_idx" ON "PKLAssignment"("industry_id");

-- CreateIndex
CREATE INDEX "PKLAssignment_school_supervisor_id_idx" ON "PKLAssignment"("school_supervisor_id");

-- CreateIndex
CREATE INDEX "PKLAssignment_status_idx" ON "PKLAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PKLAssignment_student_user_id_start_date_key" ON "PKLAssignment"("student_user_id", "start_date");

-- CreateIndex
CREATE INDEX "PKLAttendance_pkl_assignment_id_idx" ON "PKLAttendance"("pkl_assignment_id");

-- CreateIndex
CREATE INDEX "PKLAttendance_date_idx" ON "PKLAttendance"("date");

-- CreateIndex
CREATE INDEX "PKLAttendance_status_idx" ON "PKLAttendance"("status");

-- CreateIndex
CREATE INDEX "PKLAttendance_approval_status_idx" ON "PKLAttendance"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "PKLAttendance_pkl_assignment_id_date_key" ON "PKLAttendance"("pkl_assignment_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PKLJournal_attendance_id_key" ON "PKLJournal"("attendance_id");

-- CreateIndex
CREATE INDEX "PKLJournal_pkl_assignment_id_idx" ON "PKLJournal"("pkl_assignment_id");

-- CreateIndex
CREATE INDEX "PKLJournal_attendance_id_idx" ON "PKLJournal"("attendance_id");

-- CreateIndex
CREATE INDEX "PKLJournal_date_idx" ON "PKLJournal"("date");

-- CreateIndex
CREATE INDEX "PKLJournal_status_idx" ON "PKLJournal"("status");

-- AddForeignKey
ALTER TABLE "PKLAssignment" ADD CONSTRAINT "PKLAssignment_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLAssignment" ADD CONSTRAINT "PKLAssignment_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLAssignment" ADD CONSTRAINT "PKLAssignment_school_supervisor_id_fkey" FOREIGN KEY ("school_supervisor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLAttendance" ADD CONSTRAINT "PKLAttendance_pkl_assignment_id_fkey" FOREIGN KEY ("pkl_assignment_id") REFERENCES "PKLAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLJournal" ADD CONSTRAINT "PKLJournal_pkl_assignment_id_fkey" FOREIGN KEY ("pkl_assignment_id") REFERENCES "PKLAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLJournal" ADD CONSTRAINT "PKLJournal_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "PKLAttendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

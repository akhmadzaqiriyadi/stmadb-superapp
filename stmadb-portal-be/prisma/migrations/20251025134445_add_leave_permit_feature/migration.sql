-- CreateEnum
CREATE TYPE "LeavePermitType" AS ENUM ('Individual', 'Group');

-- CreateEnum
CREATE TYPE "LeavePermitStatus" AS ENUM ('WaitingForPiket', 'WaitingForApproval', 'Approved', 'Rejected', 'Completed');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "LeavePermit" (
    "id" SERIAL NOT NULL,
    "requester_user_id" INTEGER NOT NULL,
    "leave_type" "LeavePermitType" NOT NULL,
    "reason" TEXT NOT NULL,
    "start_time" TIMESTAMP NOT NULL,
    "estimated_return" TIMESTAMP,
    "status" "LeavePermitStatus" NOT NULL DEFAULT 'WaitingForPiket',
    "related_schedule_id" INTEGER,
    "group_members" JSONB,
    "printed_by_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApproval" (
    "id" SERIAL NOT NULL,
    "leave_permit_id" INTEGER NOT NULL,
    "approver_user_id" INTEGER NOT NULL,
    "approver_role" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeavePermit_requester_user_id_idx" ON "LeavePermit"("requester_user_id");

-- CreateIndex
CREATE INDEX "LeavePermit_printed_by_id_idx" ON "LeavePermit"("printed_by_id");

-- CreateIndex
CREATE INDEX "LeaveApproval_approver_user_id_idx" ON "LeaveApproval"("approver_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApproval_leave_permit_id_approver_user_id_key" ON "LeaveApproval"("leave_permit_id", "approver_user_id");

-- AddForeignKey
ALTER TABLE "LeavePermit" ADD CONSTRAINT "LeavePermit_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePermit" ADD CONSTRAINT "LeavePermit_related_schedule_id_fkey" FOREIGN KEY ("related_schedule_id") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePermit" ADD CONSTRAINT "LeavePermit_printed_by_id_fkey" FOREIGN KEY ("printed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_leave_permit_id_fkey" FOREIGN KEY ("leave_permit_id") REFERENCES "LeavePermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "identity_number" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TeacherExtension" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nip" TEXT,
    "nuptk" TEXT,

    CONSTRAINT "TeacherExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExtension" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nisn" TEXT NOT NULL,
    "guardian_id" INTEGER,

    CONSTRAINT "StudentExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianExtension" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "occupation" TEXT,

    CONSTRAINT "GuardianExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutySchedule" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "duty_date" DATE NOT NULL,
    "duty_type" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DutySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherExtension_user_id_key" ON "TeacherExtension"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherExtension_nip_key" ON "TeacherExtension"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherExtension_nuptk_key" ON "TeacherExtension"("nuptk");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExtension_user_id_key" ON "StudentExtension"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExtension_nisn_key" ON "StudentExtension"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianExtension_user_id_key" ON "GuardianExtension"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "DutySchedule_user_id_duty_date_duty_type_key" ON "DutySchedule"("user_id", "duty_date", "duty_type");

-- AddForeignKey
ALTER TABLE "TeacherExtension" ADD CONSTRAINT "TeacherExtension_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtension" ADD CONSTRAINT "StudentExtension_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtension" ADD CONSTRAINT "StudentExtension_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "GuardianExtension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianExtension" ADD CONSTRAINT "GuardianExtension_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySchedule" ADD CONSTRAINT "DutySchedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

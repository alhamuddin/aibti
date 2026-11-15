CREATE TABLE "course_batch" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_batch_pkey" PRIMARY KEY ("id")
);

INSERT INTO "course_batch" ("id", "courseId", "name", "createdAt", "updatedAt")
SELECT 'batch-' || "id", "id", 'Batch 1', "createdAt", "updatedAt"
FROM "course";

ALTER TABLE "user"
ADD COLUMN "qualifications" TEXT,
ADD COLUMN "achievements" TEXT,
ADD COLUMN "experience" TEXT;

ALTER TABLE "course_subject"
ADD COLUMN "batchId" TEXT;

ALTER TABLE "course_class"
ADD COLUMN "batchId" TEXT;

ALTER TABLE "course_enrollment"
ADD COLUMN "batchId" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "certificateNumber" TEXT;

ALTER TABLE "attendance_session"
ADD COLUMN "batchId" TEXT,
ADD COLUMN "batchName" TEXT;

UPDATE "course_subject"
SET "batchId" = 'batch-' || "courseId";

UPDATE "course_class"
SET "batchId" = 'batch-' || "courseId";

UPDATE "course_enrollment"
SET
    "batchId" = 'batch-' || "courseId",
    "completedAt" = CASE WHEN "status" = 'COMPLETED' THEN "assignedAt" ELSE NULL END,
    "certificateNumber" = CASE
        WHEN "status" = 'COMPLETED' THEN 'TMS-' || upper(substr(md5("id"), 1, 12))
        ELSE NULL
    END;

UPDATE "attendance_session"
SET
    "batchId" = 'batch-' || "courseId",
    "batchName" = 'Batch 1';

ALTER TABLE "course_subject"
ALTER COLUMN "batchId" SET NOT NULL;

ALTER TABLE "course_class"
ALTER COLUMN "batchId" SET NOT NULL;

ALTER TABLE "course_enrollment"
ALTER COLUMN "batchId" SET NOT NULL;

ALTER TABLE "attendance_session"
ALTER COLUMN "batchId" SET NOT NULL,
ALTER COLUMN "batchName" SET NOT NULL;

DROP INDEX "course_subject_courseId_position_key";
DROP INDEX "course_class_courseId_position_key";
DROP INDEX "course_enrollment_courseId_participantId_key";
DROP INDEX "attendance_session_courseId_courseDate_key";

CREATE UNIQUE INDEX "course_batch_courseId_name_key" ON "course_batch"("courseId", "name");
CREATE INDEX "course_batch_courseId_idx" ON "course_batch"("courseId");
CREATE UNIQUE INDEX "course_subject_batchId_position_key" ON "course_subject"("batchId", "position");
CREATE INDEX "course_subject_courseId_idx" ON "course_subject"("courseId");
CREATE UNIQUE INDEX "course_class_batchId_position_key" ON "course_class"("batchId", "position");
CREATE INDEX "course_class_courseId_idx" ON "course_class"("courseId");
CREATE UNIQUE INDEX "course_enrollment_batchId_participantId_key" ON "course_enrollment"("batchId", "participantId");
CREATE INDEX "course_enrollment_courseId_idx" ON "course_enrollment"("courseId");
CREATE UNIQUE INDEX "course_enrollment_certificateNumber_key" ON "course_enrollment"("certificateNumber");
CREATE INDEX "attendance_session_courseId_idx" ON "attendance_session"("courseId");
CREATE UNIQUE INDEX "attendance_session_batchId_courseDate_key" ON "attendance_session"("batchId", "courseDate");

ALTER TABLE "course_batch"
ADD CONSTRAINT "course_batch_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_subject"
ADD CONSTRAINT "course_subject_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "course_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_class"
ADD CONSTRAINT "course_class_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "course_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_enrollment"
ADD CONSTRAINT "course_enrollment_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "course_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_session"
ADD CONSTRAINT "attendance_session_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "course_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

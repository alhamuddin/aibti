CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'MANUAL', 'AUTO');
CREATE TYPE "AttendanceCloseReason" AS ENUM ('ADMIN', 'AUTO');

ALTER TABLE "user" ADD COLUMN "employeeId" TEXT;

CREATE TABLE "attendance_session" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseDate" VARCHAR(10) NOT NULL,
    "courseName" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "autoClosesAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closeReason" "AttendanceCloseReason",
    "qrNonce" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,

    CONSTRAINT "attendance_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_record" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "method" "AttendanceMethod" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_employeeId_key" ON "user"("employeeId");
CREATE UNIQUE INDEX "attendance_session_qrNonce_key" ON "attendance_session"("qrNonce");
CREATE INDEX "attendance_session_closedAt_autoClosesAt_idx" ON "attendance_session"("closedAt", "autoClosesAt");
CREATE UNIQUE INDEX "attendance_session_courseId_courseDate_key" ON "attendance_session"("courseId", "courseDate");
CREATE INDEX "attendance_record_participantId_markedAt_idx" ON "attendance_record"("participantId", "markedAt");
CREATE UNIQUE INDEX "attendance_record_sessionId_participantId_key" ON "attendance_record"("sessionId", "participantId");

ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_initiatedById_fkey"
FOREIGN KEY ("initiatedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "attendance_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

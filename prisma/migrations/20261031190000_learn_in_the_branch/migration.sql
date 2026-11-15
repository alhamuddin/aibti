CREATE TYPE "LearnInBranchReportStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED');

ALTER TABLE "course_enrollment"
ADD COLUMN "learnInBranchDeadline" TIMESTAMP(3);

CREATE TABLE "learn_in_branch_report" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "managerId" TEXT,
    "status" "LearnInBranchReportStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "managerComment" TEXT,

    CONSTRAINT "learn_in_branch_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learn_in_branch_question" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learn_in_branch_question_pkey" PRIMARY KEY ("id")
);

INSERT INTO "learn_in_branch_question" ("id", "prompt", "options", "position") VALUES
    ('learn-in-branch-default-question-1', 'Is this training effective for participants?', ARRAY['Very effective', 'Effective', 'Not so effective'], 1),
    ('learn-in-branch-default-question-2', 'After training participants understanding on particular topics has improved?', ARRAY['Improved', 'Unchanged', 'Decreased'], 2);

CREATE TABLE "learn_in_branch_report_answer" (
    "reportId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "answer" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "learn_in_branch_report_answer_pkey" PRIMARY KEY ("reportId", "questionId")
);

CREATE TABLE "learn_in_branch_session" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "learn_in_branch_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learn_in_branch_attendance" (
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,

    CONSTRAINT "learn_in_branch_attendance_pkey" PRIMARY KEY ("sessionId", "participantId")
);

CREATE UNIQUE INDEX "learn_in_branch_report_enrollmentId_key"
ON "learn_in_branch_report"("enrollmentId");
CREATE INDEX "learn_in_branch_report_branchId_status_submittedAt_idx"
ON "learn_in_branch_report"("branchId", "status", "submittedAt");
CREATE INDEX "learn_in_branch_report_facilitatorId_submittedAt_idx"
ON "learn_in_branch_report"("facilitatorId", "submittedAt");
CREATE INDEX "learn_in_branch_question_position_createdAt_idx"
ON "learn_in_branch_question"("position", "createdAt");
CREATE INDEX "learn_in_branch_report_answer_reportId_position_idx"
ON "learn_in_branch_report_answer"("reportId", "position");
CREATE INDEX "learn_in_branch_session_reportId_sessionAt_idx"
ON "learn_in_branch_session"("reportId", "sessionAt");
CREATE INDEX "learn_in_branch_attendance_participantId_idx"
ON "learn_in_branch_attendance"("participantId");

ALTER TABLE "learn_in_branch_report"
ADD CONSTRAINT "learn_in_branch_report_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_report_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_report_facilitatorId_fkey"
FOREIGN KEY ("facilitatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_report_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "learn_in_branch_report_answer"
ADD CONSTRAINT "learn_in_branch_report_answer_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "learn_in_branch_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_report_answer_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "learn_in_branch_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "learn_in_branch_session"
ADD CONSTRAINT "learn_in_branch_session_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "learn_in_branch_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_session_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "course_class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learn_in_branch_attendance"
ADD CONSTRAINT "learn_in_branch_attendance_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "learn_in_branch_session"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "learn_in_branch_attendance_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

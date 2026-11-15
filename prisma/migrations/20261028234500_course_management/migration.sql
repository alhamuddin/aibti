CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "CourseEnrollmentStatus" AS ENUM ('ASSIGNED', 'CONFIRMED', 'DECLINED', 'COMPLETED', 'WITHDRAWN');
CREATE TYPE "CourseMaterialType" AS ENUM ('FILE', 'LINK', 'TEXT');
CREATE TYPE "DeliveryMode" AS ENUM ('ONSITE', 'ONLINE', 'HYBRID');

ALTER TABLE "user"
ADD COLUMN "branchId" TEXT;

CREATE TABLE "branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerUserId" TEXT,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "prerequisites" TEXT,
    "learningOutcomes" TEXT,
    "durationHours" INTEGER,
    "capacity" INTEGER,
    "enrollmentOpensAt" TIMESTAMP(3),
    "enrollmentClosesAt" TIMESTAMP(3),
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_subject" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "course_subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_class" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "venue" TEXT,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'ONSITE',

    CONSTRAINT "course_class_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_material" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CourseMaterialType" NOT NULL DEFAULT 'TEXT',
    "description" TEXT,
    "url" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "course_material_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "assignedById" TEXT,
    "status" "CourseEnrollmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_audit_log" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "branch_code_key" ON "branch"("code");
CREATE UNIQUE INDEX "branch_managerUserId_key" ON "branch"("managerUserId");
CREATE INDEX "user_branchId_idx" ON "user"("branchId");
CREATE UNIQUE INDEX "course_slug_key" ON "course"("slug");
CREATE INDEX "course_status_createdAt_idx" ON "course"("status", "createdAt");
CREATE INDEX "course_creatorId_idx" ON "course"("creatorId");
CREATE UNIQUE INDEX "course_subject_courseId_position_key" ON "course_subject"("courseId", "position");
CREATE INDEX "course_subject_teacherId_idx" ON "course_subject"("teacherId");
CREATE UNIQUE INDEX "course_class_courseId_position_key" ON "course_class"("courseId", "position");
CREATE INDEX "course_class_subjectId_idx" ON "course_class"("subjectId");
CREATE UNIQUE INDEX "course_material_classId_position_key" ON "course_material"("classId", "position");
CREATE UNIQUE INDEX "course_enrollment_courseId_participantId_key" ON "course_enrollment"("courseId", "participantId");
CREATE INDEX "course_enrollment_participantId_status_idx" ON "course_enrollment"("participantId", "status");
CREATE INDEX "course_audit_log_courseId_createdAt_idx" ON "course_audit_log"("courseId", "createdAt");
CREATE INDEX "course_audit_log_actorId_createdAt_idx" ON "course_audit_log"("actorId", "createdAt");

ALTER TABLE "branch"
ADD CONSTRAINT "branch_managerUserId_fkey"
FOREIGN KEY ("managerUserId") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user"
ADD CONSTRAINT "user_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "branch"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course"
ADD CONSTRAINT "course_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_subject"
ADD CONSTRAINT "course_subject_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_subject"
ADD CONSTRAINT "course_subject_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_class"
ADD CONSTRAINT "course_class_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_class"
ADD CONSTRAINT "course_class_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "course_subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_material"
ADD CONSTRAINT "course_material_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "course_class"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_enrollment"
ADD CONSTRAINT "course_enrollment_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_enrollment"
ADD CONSTRAINT "course_enrollment_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_enrollment"
ADD CONSTRAINT "course_enrollment_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_audit_log"
ADD CONSTRAINT "course_audit_log_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_audit_log"
ADD CONSTRAINT "course_audit_log_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

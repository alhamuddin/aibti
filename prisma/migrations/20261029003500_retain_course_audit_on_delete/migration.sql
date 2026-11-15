ALTER TABLE "course_audit_log"
ADD COLUMN "courseTitle" TEXT;

ALTER TABLE "course_audit_log"
ALTER COLUMN "courseId" DROP NOT NULL;

ALTER TABLE "course_audit_log"
DROP CONSTRAINT "course_audit_log_courseId_fkey";

ALTER TABLE "course_audit_log"
ADD CONSTRAINT "course_audit_log_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "course"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

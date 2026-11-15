ALTER TABLE "user"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'participant',
ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "banReason" TEXT,
ADD COLUMN "banExpires" TIMESTAMP(3),
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isMock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "session"
ADD COLUMN "impersonatedBy" TEXT;

CREATE TABLE "user_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_audit_log_actorUserId_createdAt_idx"
ON "user_audit_log"("actorUserId", "createdAt");

CREATE INDEX "user_audit_log_targetUserId_createdAt_idx"
ON "user_audit_log"("targetUserId", "createdAt");

ALTER TABLE "user_audit_log"
ADD CONSTRAINT "user_audit_log_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_audit_log"
ADD CONSTRAINT "user_audit_log_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

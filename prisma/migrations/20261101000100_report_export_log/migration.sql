CREATE TABLE "report_export_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_export_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_export_log_actorUserId_createdAt_idx"
ON "report_export_log"("actorUserId", "createdAt");

ALTER TABLE "report_export_log"
ADD CONSTRAINT "report_export_log_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

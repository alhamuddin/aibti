CREATE TABLE "speaker_evaluation" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "presentationQuality" INTEGER NOT NULL,
    "experienceSharing" INTEGER NOT NULL,
    "sessionBenefit" INTEGER NOT NULL,
    "topicCompleteness" INTEGER NOT NULL,
    "learningEnvironment" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaker_evaluation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "speaker_evaluation_presentationQuality_check" CHECK ("presentationQuality" IN (2, 4, 6, 8)),
    CONSTRAINT "speaker_evaluation_experienceSharing_check" CHECK ("experienceSharing" IN (3, 4, 5, 6)),
    CONSTRAINT "speaker_evaluation_sessionBenefit_check" CHECK ("sessionBenefit" IN (3, 6, 8, 10)),
    CONSTRAINT "speaker_evaluation_topicCompleteness_check" CHECK ("topicCompleteness" IN (3, 6, 8, 10)),
    CONSTRAINT "speaker_evaluation_learningEnvironment_check" CHECK ("learningEnvironment" IN (2, 4, 5, 6))
);

CREATE UNIQUE INDEX "speaker_evaluation_classId_participantId_key" ON "speaker_evaluation"("classId", "participantId");
CREATE INDEX "speaker_evaluation_participantId_updatedAt_idx" ON "speaker_evaluation"("participantId", "updatedAt");

ALTER TABLE "speaker_evaluation" ADD CONSTRAINT "speaker_evaluation_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "course_class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "speaker_evaluation" ADD CONSTRAINT "speaker_evaluation_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

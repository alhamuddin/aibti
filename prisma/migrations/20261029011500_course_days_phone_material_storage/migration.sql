ALTER TABLE "user"
ADD COLUMN "phone" TEXT;

ALTER TABLE "course"
ADD COLUMN "durationDays" INTEGER;

UPDATE "course"
SET "durationDays" = GREATEST(1, CEIL("durationHours"::numeric / 8))
WHERE "durationHours" IS NOT NULL;

ALTER TABLE "course_material"
ADD COLUMN "storageKey" TEXT;

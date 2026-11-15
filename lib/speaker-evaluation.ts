export const speakerEvaluationCriteria = [
  {
    key: "presentationQuality",
    label: "Presentation Quality",
    points: { excellent: 4, good: 3, average: 2, poor: 1 },
  },
  {
    key: "experienceSharing",
    label: "Experience & Views Sharing / Interaction",
    points: { excellent: 3, good: 2.5, average: 2, poor: 1.5 },
  },
  {
    key: "sessionBenefit",
    label: "Benefitted from the Session",
    points: { excellent: 5, good: 4, average: 3, poor: 1.5 },
  },
  {
    key: "topicCompleteness",
    label: "Completeness of the Topics",
    points: { excellent: 5, good: 4, average: 3, poor: 1.5 },
  },
  {
    key: "learningEnvironment",
    label: "Creating Learning Environment",
    points: { excellent: 3, good: 2.5, average: 2, poor: 1 },
  },
] as const;

export type SpeakerEvaluationCriterionKey = (typeof speakerEvaluationCriteria)[number]["key"];

export type SpeakerEvaluationScores = Record<SpeakerEvaluationCriterionKey, number>;
export type SpeakerEvaluationAverages = Record<SpeakerEvaluationCriterionKey, number | null>;

export const speakerEvaluationWindowMs = 7 * 24 * 60 * 60 * 1000;
export const speakerEvaluationMinimumResponses = 5;

export function canViewSpeakerEvaluationResults(
  role: "teacher" | "admin" | "super_admin",
  responseCount: number,
) {
  return role !== "teacher" || responseCount >= speakerEvaluationMinimumResponses;
}

export function getSpeakerEvaluationWindow(scheduledAt: Date, durationMinutes: number) {
  const classEndsAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
  return {
    classEndsAt,
    expiresAt: new Date(classEndsAt.getTime() + speakerEvaluationWindowMs),
  };
}

export function isSpeakerEvaluationOpen(
  scheduledAt: Date,
  durationMinutes: number,
  now = new Date(),
) {
  const { classEndsAt, expiresAt } = getSpeakerEvaluationWindow(scheduledAt, durationMinutes);
  return now >= classEndsAt && now <= expiresAt;
}

export function getSpeakerEvaluationMaximum(key: SpeakerEvaluationCriterionKey): number {
  const criterion = speakerEvaluationCriteria.find((item) => item.key === key);
  if (!criterion) throw new Error(`Unknown speaker evaluation criterion: ${key}`);
  return criterion.points.excellent;
}

export function getSpeakerEvaluationOptions(key: SpeakerEvaluationCriterionKey) {
  const criterion = speakerEvaluationCriteria.find((item) => item.key === key);
  if (!criterion) throw new Error(`Unknown speaker evaluation criterion: ${key}`);
  return [
    { label: "Excellent", points: criterion.points.excellent },
    { label: "Good", points: criterion.points.good },
    { label: "Average", points: criterion.points.average },
    { label: "Poor", points: criterion.points.poor },
  ];
}

export function getStoredSpeakerEvaluationScore(
  key: SpeakerEvaluationCriterionKey,
  points: number,
) {
  const option = getSpeakerEvaluationOptions(key).find((item) => item.points === points);
  if (!option) return null;
  return points * 2;
}

export function getSpeakerEvaluationPoints(
  key: SpeakerEvaluationCriterionKey,
  storedScore: number,
) {
  return storedScore / 2;
}

export function isValidSpeakerEvaluationScore(key: SpeakerEvaluationCriterionKey, value: number) {
  return getSpeakerEvaluationOptions(key).some((option) => option.points * 2 === value);
}

export const learnInBranchWindowMs = 7 * 24 * 60 * 60 * 1000;

export type LearnInBranchReviewQuestion = {
  id: string;
  options: string[];
};

export type LearnInBranchReviewAnswer = {
  questionId: string;
  answer: string;
};

export function getLearnInBranchDeadline(completedAt: Date, override: Date | null = null): Date {
  return override ?? new Date(completedAt.getTime() + learnInBranchWindowMs);
}

export function isLearnInBranchSubmissionOpen(
  completedAt: Date,
  override: Date | null,
  now = new Date(),
): boolean {
  return now >= completedAt && now <= getLearnInBranchDeadline(completedAt, override);
}

export function parseLearnInBranchAnswerOptions(value: string): string[] | null {
  const options = value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
  if (
    options.length < 2 ||
    options.length > 10 ||
    options.some((option) => option.length > 100) ||
    new Set(options.map((option) => option.toLowerCase())).size !== options.length
  ) {
    return null;
  }
  return options;
}

export function areLearnInBranchAnswersComplete(
  questions: LearnInBranchReviewQuestion[],
  answers: LearnInBranchReviewAnswer[],
): boolean {
  if (!questions.length || questions.length !== answers.length) return false;
  const answersByQuestionId = new Map(
    answers.map(({ questionId, answer }) => [questionId, answer]),
  );
  return (
    answersByQuestionId.size === questions.length &&
    questions.every(
      (question) =>
        answersByQuestionId.has(question.id) &&
        question.options.includes(answersByQuestionId.get(question.id) ?? ""),
    )
  );
}

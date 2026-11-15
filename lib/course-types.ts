import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";

export type CourseClassRow = {
  id: string;
  name: string;
  durationMinutes: number;
  scheduledAt: string | null;
  venue: string | null;
  deliveryMode: "ONSITE" | "ONLINE" | "HYBRID";
  materials: {
    id: string;
    title: string;
    type: "FILE" | "LINK" | "TEXT";
    url: string | null;
  }[];
};

export type CourseSubjectRow = {
  id: string;
  title: string;
  teacherId: string;
  teacherIsMock: boolean;
  teacherName: string;
  teacherEmail: string;
  classes: CourseClassRow[];
};

export type CourseEnrollmentRow = {
  id: string;
  participantId: string;
  status: CourseEnrollmentStatus;
  name: string;
  email: string;
  phone: string | null;
  branchName: string | null;
  isMock: boolean;
};

export type CourseBatchRow = {
  id: string;
  name: string;
  subjects: CourseSubjectRow[];
  enrollments: CourseEnrollmentRow[];
};

export type CourseRow = {
  id: string;
  draftData: unknown;
  title: string;
  description: string;
  category: string | null;
  prerequisites: string | null;
  learningOutcomes: string | null;
  durationDays: number | null;
  capacity: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isMock: boolean;
  publishedAt: string | null;
  creatorName: string;
  batchId: string;
  batchName: string;
  batches: CourseBatchRow[];
  subjects: CourseSubjectRow[];
  enrollments: CourseEnrollmentRow[];
};

export type CourseListResponse = {
  courses: CourseRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type MyLearningCourse = {
  id: string;
  enrollmentId: string;
  batchId: string;
  batchName: string;
  title: string;
  description: string;
  category: string | null;
  enrollmentStatus: CourseEnrollmentStatus;
  certificateNumber: string | null;
  completedAt: string | null;
};

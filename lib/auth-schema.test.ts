import { describe, expect, it } from "vitest";
import {
  initialPasswordSchema,
  courseDraftSchema,
  courseDraftProgressSchema,
  courseSubjectsSchema,
  courseWizardSnapshotSchema,
  managedUserSchema,
  signInSchema,
  signUpSchema,
} from "./auth-schema";

describe("signInSchema", () => {
  it("accepts valid credential sign-in values", () => {
    expect(
      signInSchema.safeParse({
        email: "employee@bank.com",
        password: "correct-horse-battery",
      }).success,
    ).toBe(true);
  });

  it("trims surrounding whitespace from email addresses", () => {
    expect(
      signInSchema.parse({
        email: " employee@bank.com ",
        password: "correct-horse-battery",
      }).email,
    ).toBe("employee@bank.com");
  });

  it("rejects malformed email addresses and empty passwords", () => {
    expect(
      signInSchema.safeParse({
        email: "not-an-email",
        password: "",
      }).success,
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  const validRegistration = {
    name: "Ayesha Khan",
    email: "employee@bank.com",
    password: "correct-horse-battery",
    confirmPassword: "correct-horse-battery",
  };

  it("accepts valid public registration values", () => {
    expect(signUpSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("accepts a 10-character password", () => {
    expect(
      signUpSchema.safeParse({
        ...validRegistration,
        password: "passw0rd10",
        confirmPassword: "passw0rd10",
      }).success,
    ).toBe(true);
  });

  it("rejects passwords shorter than 10 characters", () => {
    expect(
      signUpSchema.safeParse({
        ...validRegistration,
        password: "shortpass",
        confirmPassword: "shortpass",
      }).success,
    ).toBe(false);
  });

  it("rejects passwords that do not match", () => {
    expect(
      signUpSchema.safeParse({
        ...validRegistration,
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});

describe("user administration schemas", () => {
  it("accepts an administrator-created account with a supported role", () => {
    expect(
      managedUserSchema.safeParse({
        name: "Ayesha Khan",
        email: "employee@bank.com",
        employeeId: "EMP-001",
        password: "temporary-pass-10",
        role: "branch_manager",
        branchId: "branch-001",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown roles and passwords shorter than 10 characters", () => {
    expect(
      managedUserSchema.safeParse({
        name: "Ayesha Khan",
        email: "employee@bank.com",
        password: "shortpass",
        role: "superuser",
      }).success,
    ).toBe(false);
  });

  it("requires a matching replacement password of at least 10 characters", () => {
    expect(
      initialPasswordSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "replacement-pass",
        confirmPassword: "replacement-pass",
      }).success,
    ).toBe(true);
    expect(
      initialPasswordSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "shortpass",
        confirmPassword: "shortpass",
      }).success,
    ).toBe(false);
  });

  it("accepts an optional phone number for managed accounts", () => {
    expect(
      managedUserSchema.safeParse({
        name: "Ayesha Khan",
        email: "employee@bank.com",
        employeeId: "EMP-002",
        phone: "+8801700000000",
        password: "temporary-pass-10",
        role: "teacher",
      }).success,
    ).toBe(true);
  });
});

describe("course management schemas", () => {
  const wizardSnapshot = {
    version: 1,
    step: 0,
    values: {
      title: "Course title",
      subtitle: "",
      shortDescription: "",
      whoFor: "",
      description: "",
      category: "",
      tags: "",
      language: "English",
      skillLevel: "Beginner",
      format: "LIVE_ONLINE",
      startDate: "",
      endDate: "",
      timeZone: "Asia/Dhaka",
      coverImageUrl: "",
      promoVideoUrl: "",
      prerequisites: "",
      learningOutcomes: "",
      durationDays: "",
      capacity: "",
      subjects: [],
      participants: [],
      participantRole: "STUDENT",
      enrollmentType: "OPEN",
      inviteEmails: "",
      accessCode: "",
      inviteExpiry: "",
      waitlist: true,
      cohortName: "",
      welcomeEmail: "",
      reminderSettings: true,
      visibility: "PRIVATE",
      scheduledPublishAt: "",
      notifyParticipants: true,
    },
  };

  it("accepts a versioned course wizard draft and rejects unsupported settings", () => {
    expect(courseWizardSnapshotSchema.safeParse(wizardSnapshot).success).toBe(true);
    expect(
      courseWizardSnapshotSchema.safeParse({
        ...wizardSnapshot,
        values: { ...wizardSnapshot.values, skillLevel: "expert" },
      }).success,
    ).toBe(false);
    expect(
      courseWizardSnapshotSchema.safeParse({
        ...wizardSnapshot,
        values: { ...wizardSnapshot.values, coverImageUrl: "https://example.com/cover.jpg" },
      }).success,
    ).toBe(false);
    expect(
      courseWizardSnapshotSchema.safeParse({
        ...wizardSnapshot,
        values: {
          ...wizardSnapshot.values,
          coverImageUrl: "/api/course-media/course-123/cover",
          promoVideoUrl: "/api/course-media/course-123/promo",
        },
      }).success,
    ).toBe(true);
  });

  it("preserves dated multi-day schedules in course drafts", () => {
    const snapshot = courseWizardSnapshotSchema.safeParse({
      ...wizardSnapshot,
      values: {
        ...wizardSnapshot.values,
        courseScheduleMode: "MULTIPLE",
        scheduleDays: [
          { id: "day-1", date: "2026-10-29", classIds: ["subject-1"] },
          { id: "day-2", date: "", classIds: [] },
        ],
        subjects: [
          {
            id: "subject-1",
            title: "Class",
            teacher: null,
            coTeachers: [],
            classes: [
              {
                id: "class-1",
                name: "Class",
                durationMinutes: 60,
                scheduledAt: "2026-10-29T10:00",
                startTime: "10:00",
                endTime: "",
                venue: "",
                deliveryMode: "ONSITE",
                description: "",
                recurrence: false,
                attendanceTracking: true,
                capacity: "",
                assignment: "",
                materials: [],
              },
            ],
          },
        ],
      },
    });

    expect(snapshot.success).toBe(true);
    if (snapshot.success) {
      expect(snapshot.data.values.courseScheduleMode).toBe("MULTIPLE");
      expect(snapshot.data.values.scheduleDays?.[1].date).toBe("");
    }
  });

  it("rejects unsafe material links in persisted drafts", () => {
    expect(
      courseWizardSnapshotSchema.safeParse({
        ...wizardSnapshot,
        values: {
          ...wizardSnapshot.values,
          subjects: [
            {
              id: "section-1",
              title: "Section",
              teacher: {
                id: "teacher-1",
                name: "Teacher",
                email: "teacher@example.com",
                phone: null,
                branchName: null,
                isMock: false,
              },
              coTeachers: [],
              classes: [
                {
                  id: "class-1",
                  name: "Class",
                  durationMinutes: 60,
                  scheduledAt: "",
                  endTime: "",
                  venue: "",
                  deliveryMode: "ONSITE",
                  description: "",
                  recurrence: false,
                  attendanceTracking: true,
                  capacity: "",
                  assignment: "",
                  materials: [
                    {
                      key: "material-1",
                      title: "Unsafe link",
                      type: "LINK",
                      url: "javascript:alert(1)",
                      visibility: "BEFORE",
                      downloadable: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it("requires a usable title when saving course progress", () => {
    expect(
      courseDraftProgressSchema.safeParse({
        title: "Course title",
        description: "",
        draftData: JSON.stringify(wizardSnapshot),
      }).success,
    ).toBe(true);
    expect(
      courseDraftProgressSchema.safeParse({
        title: "x",
        description: "",
        draftData: JSON.stringify(wizardSnapshot),
      }).success,
    ).toBe(false);
  });

  it("accepts day-based course duration", () => {
    expect(
      courseDraftSchema.safeParse({
        title: "Banking Risk Management",
        description: "A course description long enough for validation.",
        category: "Risk",
        durationDays: "3",
        capacity: "20",
        prerequisites: "",
        learningOutcomes: "Apply risk controls and escalation procedures.",
        subjects: "[]",
        participantIds: "[]",
      }).success,
    ).toBe(true);
  });

  it("accepts multiple classes and attached file materials per subject", () => {
    expect(
      courseSubjectsSchema.safeParse([
        {
          id: "subject-id",
          title: "Credit Risk",
          teacherId: "teacher-id",
          classes: [
            {
              id: "class-one",
              name: "Credit workshop",
              durationMinutes: 90,
              scheduledAt: null,
              venue: null,
              deliveryMode: "ONSITE",
              materials: [{ title: "Case study", type: "FILE" }],
            },
            {
              id: "class-two",
              name: "Review",
              durationMinutes: 45,
              materials: [{ title: "Reference", type: "LINK", url: "https://example.com" }],
            },
          ],
        },
      ]).success,
    ).toBe(true);
  });
});

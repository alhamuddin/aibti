import { z } from "zod";

const emailSchema = z.string().trim().pipe(z.email("Enter a valid email address."));
const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  qualifications: z.string().trim().max(5000),
  achievements: z.string().trim().max(5000),
  experience: z.string().trim().max(5000),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Name must be 80 characters or fewer."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const initialPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your temporary password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const managedUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    employeeId: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(30).optional(),
    password: passwordSchema,
    role: z.enum(["super_admin", "admin", "teacher", "participant", "branch_manager", "auditor"]),
    branchId: z
      .string()
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine((value) => value.role !== "branch_manager" || Boolean(value.branchId), {
    message: "Assign branch managers to a branch.",
    path: ["branchId"],
  });

export const courseDraftSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(4000),
  category: z.string().trim().max(100).optional(),
  durationDays: z.coerce.number().int().min(1).max(1000),
  capacity: z.coerce.number().int().min(1).max(10000),
  prerequisites: z.string().trim().max(2000).optional(),
  learningOutcomes: z.string().trim().min(10).max(4000),
  subjects: z.string().trim().min(1).max(50000),
  participantIds: z.string().trim().min(1).max(50000),
});

export const courseDraftProgressSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().max(4000),
  draftData: z.string().max(150_000),
});

const draftAccountSchema = z.object({
  id: z.string().min(1).max(180),
  name: z.string().max(120),
  email: z.string().max(254),
  phone: z.string().max(30).nullable(),
  branchName: z.string().max(120).nullable(),
  isMock: z.boolean(),
});

const draftMaterialSchema = z
  .object({
    key: z.string().min(1).max(180),
    id: z.string().min(1).max(180).optional(),
    title: z.string().max(250),
    type: z.enum(["FILE", "LINK", "TEXT"]),
    url: z.string().max(2000).nullable().optional(),
    visibility: z.enum(["BEFORE", "AFTER"]),
    downloadable: z.boolean(),
  })
  .superRefine((material, context) => {
    if (!material.url) return;
    if (material.type === "FILE") {
      if (!/^\/api\/course-materials\/[a-zA-Z0-9_-]+$/.test(material.url)) {
        context.addIssue({ code: "custom", message: "Invalid course file path.", path: ["url"] });
      }
      return;
    }
    try {
      if (new URL(material.url).protocol !== "https:") {
        context.addIssue({
          code: "custom",
          message: "Material links must use HTTPS.",
          path: ["url"],
        });
      }
    } catch {
      context.addIssue({ code: "custom", message: "Invalid material link.", path: ["url"] });
    }
  });

const draftClassSchema = z.object({
  id: z.string().min(1).max(180),
  name: z.string().max(180),
  durationMinutes: z.number().int().min(1).max(10000),
  scheduledAt: z.string().max(64),
  startTime: z.string().max(16).optional(),
  endTime: z.string().max(16),
  venue: z.string().max(250),
  deliveryMode: z.enum(["ONSITE", "ONLINE", "HYBRID"]),
  description: z.string().max(4000),
  recurrence: z.boolean(),
  attendanceTracking: z.boolean(),
  capacity: z.union([z.literal(""), z.number().int().min(1).max(10000)]),
  assignment: z.string().max(4000),
  materials: z.array(draftMaterialSchema).max(100),
});

const draftSubjectSchema = z.object({
  id: z.string().min(1).max(180),
  title: z.string().max(180),
  teacher: draftAccountSchema.nullable(),
  coTeachers: z.array(draftAccountSchema).max(100),
  classes: z.array(draftClassSchema).max(100),
});

const courseWizardValuesSchema = z.object({
  title: z.string().max(180),
  subtitle: z.string().max(180),
  shortDescription: z.string().max(300),
  whoFor: z.string().max(500),
  description: z.string().max(4000),
  category: z.string().max(100),
  tags: z.string().max(1000),
  language: z.string().max(80),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  format: z.enum(["LIVE_ONLINE", "IN_PERSON", "SELF_PACED", "HYBRID"]),
  startDate: z.string().max(64),
  endDate: z.string().max(64),
  timeZone: z.string().max(80),
  coverImageUrl: z
    .string()
    .max(220)
    .regex(/^$|^\/api\/course-media\/[A-Za-z0-9_-]{1,180}\/cover$/),
  promoVideoUrl: z
    .string()
    .max(220)
    .regex(/^$|^\/api\/course-media\/[A-Za-z0-9_-]{1,180}\/promo$/),
  prerequisites: z.string().max(2000),
  learningOutcomes: z.string().max(4000),
  durationDays: z.union([z.literal(""), z.number().int().min(1).max(1000)]),
  capacity: z.union([z.literal(""), z.number().int().min(1).max(10000)]),
  subjects: z.array(draftSubjectSchema).max(100),
  courseScheduleMode: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  scheduleDays: z
    .array(
      z.object({
        id: z.string().min(1).max(180),
        date: z.string().max(16),
        classIds: z.array(z.string().min(1).max(180)).max(100),
      }),
    )
    .max(100)
    .optional(),
  participants: z.array(draftAccountSchema).max(10000),
  participantRole: z.enum(["STUDENT", "OBSERVER", "TEACHING_ASSISTANT"]),
  enrollmentType: z.enum(["OPEN", "APPROVAL", "INVITE_ONLY"]),
  inviteEmails: z.string().max(100000),
  accessCode: z.string().max(120),
  inviteExpiry: z.string().max(64),
  waitlist: z.boolean(),
  cohortName: z.string().max(180),
  welcomeEmail: z.string().max(4000),
  reminderSettings: z.boolean(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
  scheduledPublishAt: z.string().max(64),
  notifyParticipants: z.boolean(),
});

export const courseWizardSnapshotSchema = z.object({
  version: z.literal(1),
  step: z.number().int().min(0).max(3),
  values: courseWizardValuesSchema,
});

export const courseSubjectsSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(180).optional(),
      title: z.string().trim().min(1).max(180),
      teacherId: z.string().min(1).max(180),
      classes: z
        .array(
          z.object({
            id: z.string().min(1).max(180).optional(),
            name: z.string().trim().min(1).max(180),
            durationMinutes: z.number().int().min(1).max(10000),
            scheduledAt: z.string().datetime().optional().nullable(),
            venue: z.string().max(250).optional().nullable(),
            deliveryMode: z.enum(["ONSITE", "ONLINE", "HYBRID"]).optional(),
            materials: z.array(
              z.object({
                id: z.string().min(1).max(180).optional(),
                title: z.string().trim().min(1).max(250),
                type: z.enum(["FILE", "LINK", "TEXT"]),
                url: z.string().max(2000).optional().nullable(),
              }),
            ),
          }),
        )
        .min(1)
        .max(100),
    }),
  )
  .min(1)
  .max(100);

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type AuthActionResult = { success: true } | { success: false; message: string };

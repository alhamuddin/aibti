"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  Eye,
  FileText,
  Globe2,
  Plus,
  Save,
  Send,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  deleteCourseAction,
  publishCourseAction,
  saveCourseDraftProgressAction,
  updateCourseAction,
} from "@/actions/course-actions";
import { courseWizardSnapshotSchema } from "@/lib/auth-schema";
import type { CourseRow } from "@/lib/course-types";

export type AccountOption = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  branchName: string | null;
  isMock: boolean;
};

type DraftMaterial = {
  key: string;
  id?: string;
  title: string;
  type: "FILE" | "LINK" | "TEXT";
  url?: string | null;
  file?: File;
  visibility: "BEFORE" | "AFTER";
  downloadable: boolean;
};

type DraftClass = {
  id: string;
  name: string;
  durationMinutes: number;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  venue: string;
  deliveryMode: "ONSITE" | "ONLINE" | "HYBRID";
  description: string;
  recurrence: boolean;
  attendanceTracking: boolean;
  capacity: number | "";
  assignment: string;
  materials: DraftMaterial[];
};

type DraftSubject = {
  id: string;
  title: string;
  teacher: AccountOption | null;
  coTeachers: AccountOption[];
  classes: DraftClass[];
};

type DraftScheduleDay = {
  id: string;
  date: string;
  classIds: string[];
};

type CourseFormValues = {
  title: string;
  subtitle: string;
  shortDescription: string;
  whoFor: string;
  description: string;
  category: string;
  tags: string;
  language: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  format: "LIVE_ONLINE" | "IN_PERSON" | "SELF_PACED" | "HYBRID";
  startDate: string;
  endDate: string;
  timeZone: string;
  coverImageUrl: string;
  promoVideoUrl: string;
  prerequisites: string;
  learningOutcomes: string;
  durationDays: number | "";
  capacity: number | "";
  subjects: DraftSubject[];
  courseScheduleMode: "SINGLE" | "MULTIPLE";
  scheduleDays: DraftScheduleDay[];
  participants: AccountOption[];
  participantRole: "STUDENT" | "OBSERVER" | "TEACHING_ASSISTANT";
  enrollmentType: "OPEN" | "APPROVAL" | "INVITE_ONLY";
  inviteEmails: string;
  accessCode: string;
  inviteExpiry: string;
  waitlist: boolean;
  cohortName: string;
  welcomeEmail: string;
  reminderSettings: boolean;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  scheduledPublishAt: string;
  notifyParticipants: boolean;
};

type CourseTemplate = { id: string; title: string; category: string | null };
type UserResponse = (AccountOption & { branch: { name: string; code: string } | null })[];

const fieldClass =
  "border-input bg-background text-foreground mt-1.5 min-h-9 w-full rounded-md border px-2.5 text-sm";
const labelClass = "text-foreground block text-xs font-medium";

function createClass(): DraftClass {
  return {
    id: crypto.randomUUID(),
    name: "",
    durationMinutes: 60,
    scheduledAt: "",
    startTime: "",
    endTime: "",
    venue: "",
    deliveryMode: "ONSITE",
    description: "",
    recurrence: false,
    attendanceTracking: true,
    capacity: "",
    assignment: "",
    materials: [],
  };
}

function flattenSubjects(subjects: DraftSubject[]): DraftSubject[] {
  return subjects.flatMap((subject) =>
    subject.classes.map((classSession, classIndex) => ({
      ...subject,
      id: classIndex === 0 ? subject.id : crypto.randomUUID(),
      title: classSession.name,
      classes: [classSession],
    })),
  );
}

function buildScheduleDays(subjects: DraftSubject[]): DraftScheduleDay[] {
  const days = new Map<string, DraftScheduleDay>();
  for (const subject of subjects) {
    const date = subject.classes[0]?.scheduledAt.slice(0, 10) ?? "";
    const key = date || "unscheduled";
    let day = days.get(key);
    if (!day) {
      day = { id: crypto.randomUUID(), date, classIds: [] };
      days.set(key, day);
    }
    day.classIds.push(subject.id);
  }
  return days.size ? [...days.values()] : [{ id: crypto.randomUUID(), date: "", classIds: [] }];
}

function newValues(): CourseFormValues {
  const firstClass = createClass();
  const firstSubjectId = crypto.randomUUID();
  return {
    title: "",
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
    subjects: [
      {
        id: firstSubjectId,
        title: "",
        teacher: null,
        coTeachers: [],
        classes: [firstClass],
      },
    ],
    courseScheduleMode: "SINGLE",
    scheduleDays: [{ id: crypto.randomUUID(), date: "", classIds: [firstSubjectId] }],
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
  };
}

function serializeCourseWizardDraft(values: CourseFormValues, step: number) {
  const snapshotValues: CourseFormValues = {
    ...values,
    subjects: values.subjects.map((subject) => ({
      ...subject,
      classes: subject.classes.map((classSession) => ({
        ...classSession,
        materials: classSession.materials.map((material) => ({
          key: material.key,
          id: material.id,
          title: material.title,
          type: material.type,
          url: material.url,
          visibility: material.visibility,
          downloadable: material.downloadable,
        })),
      })),
    })),
    courseScheduleMode: values.courseScheduleMode,
    scheduleDays: values.scheduleDays,
  };
  return JSON.stringify({ version: 1, step, values: snapshotValues });
}

function accountFromCourse(
  user: Pick<
    CourseRow["enrollments"][number],
    "participantId" | "name" | "email" | "phone" | "branchName" | "isMock"
  >,
): AccountOption {
  return {
    id: user.participantId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    branchName: user.branchName,
    isMock: user.isMock,
  };
}

function normalizeCourseDraftMedia(draftData: unknown, courseId: string): unknown {
  const draftRecord =
    draftData && typeof draftData === "object" && !Array.isArray(draftData)
      ? (draftData as Record<string, unknown>)
      : null;
  const savedValuesRecord =
    draftRecord?.values &&
    typeof draftRecord.values === "object" &&
    !Array.isArray(draftRecord.values)
      ? (draftRecord.values as Record<string, unknown>)
      : null;
  const normalizedDraftData =
    draftRecord && savedValuesRecord
      ? {
          ...draftRecord,
          values: {
            ...savedValuesRecord,
            coverImageUrl:
              savedValuesRecord.coverImageUrl === `/api/course-media/${courseId}/cover`
                ? savedValuesRecord.coverImageUrl
                : "",
            promoVideoUrl:
              savedValuesRecord.promoVideoUrl === `/api/course-media/${courseId}/promo`
                ? savedValuesRecord.promoVideoUrl
                : "",
          },
        }
      : draftData;
  return normalizedDraftData;
}

function courseValues(course: CourseRow): CourseFormValues {
  const parsedSnapshot = courseWizardSnapshotSchema.safeParse(
    normalizeCourseDraftMedia(course.draftData, course.id),
  );
  const savedValues = parsedSnapshot.success ? parsedSnapshot.data.values : undefined;
  const defaults: CourseFormValues = {
    title: course.title,
    subtitle: "",
    shortDescription: "",
    whoFor: "",
    description: course.description,
    category: course.category ?? "",
    tags: "",
    language: "English",
    skillLevel: "Beginner",
    format: "LIVE_ONLINE",
    startDate: "",
    endDate: "",
    timeZone: "Asia/Dhaka",
    coverImageUrl: "",
    promoVideoUrl: "",
    prerequisites: course.prerequisites ?? "",
    learningOutcomes: course.learningOutcomes ?? "",
    durationDays: course.durationDays ?? "",
    capacity: course.capacity ?? "",
    courseScheduleMode: course.durationDays && course.durationDays > 1 ? "MULTIPLE" : "SINGLE",
    scheduleDays: [],
    subjects: course.subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      coTeachers: [],
      teacher: {
        id: subject.teacherId,
        name: subject.teacherName,
        email: subject.teacherEmail,
        phone: null,
        branchName: null,
        isMock: subject.teacherIsMock,
      },
      classes: subject.classes.map((classSession) => ({
        id: classSession.id,
        name: classSession.name,
        durationMinutes: classSession.durationMinutes,
        scheduledAt: classSession.scheduledAt?.slice(0, 16) ?? "",
        startTime: classSession.scheduledAt?.slice(11, 16) ?? "",
        endTime: "",
        venue: classSession.venue ?? "",
        deliveryMode: classSession.deliveryMode,
        description: "",
        recurrence: false,
        attendanceTracking: true,
        capacity: "",
        assignment: "",
        materials: classSession.materials.map((material) => ({
          key: crypto.randomUUID(),
          id: material.id,
          title: material.title,
          type: material.type,
          url: material.url,
          visibility: "BEFORE" as const,
          downloadable: true,
        })),
      })),
    })),
    participants: course.enrollments.map(accountFromCourse),
    participantRole: "STUDENT",
    enrollmentType: "OPEN",
    inviteEmails: "",
    accessCode: "",
    inviteExpiry: "",
    waitlist: true,
    cohortName: course.batchName,
    welcomeEmail: "",
    reminderSettings: true,
    visibility: "PRIVATE",
    scheduledPublishAt: "",
    notifyParticipants: true,
  };
  const merged: CourseFormValues = {
    ...defaults,
    ...savedValues,
    subjects: Array.isArray(savedValues?.subjects)
      ? savedValues.subjects.map((subject) => ({
          ...subject,
          classes: subject.classes.map((classSession) => ({
            ...classSession,
            startTime: classSession.startTime ?? classSession.scheduledAt.slice(11, 16),
          })),
        }))
      : defaults.subjects,
    scheduleDays: Array.isArray(savedValues?.scheduleDays) ? savedValues.scheduleDays : [],
    courseScheduleMode: savedValues?.courseScheduleMode ?? defaults.courseScheduleMode,
    participants: Array.isArray(savedValues?.participants)
      ? savedValues.participants
      : defaults.participants,
  };
  if (!Array.isArray(savedValues?.subjects)) {
    const subjects = flattenSubjects(merged.subjects).map((subject) => ({
      ...subject,
      classes: subject.classes.map((classSession) => ({
        ...classSession,
        startTime: classSession.startTime || classSession.scheduledAt.slice(11, 16),
      })),
    }));
    return {
      ...merged,
      subjects,
      scheduleDays: buildScheduleDays(subjects),
    };
  }

  const persistedSubjects = new Map(
    defaults.subjects.map((subject) => [subject.id, subject] as const),
  );
  const restored = {
    ...merged,
    subjects: merged.subjects.map((subject) => {
      const persistedSubject = persistedSubjects.get(subject.id);
      if (!persistedSubject) return subject;
      return {
        ...subject,
        classes: subject.classes.map((classSession) => {
          const persistedClass = persistedSubject.classes.find(
            (item) => item.id === classSession.id,
          );
          if (!persistedClass) return classSession;
          return {
            ...persistedClass,
            ...classSession,
            materials: classSession.materials.map((material, index) => {
              const persistedMaterial =
                persistedClass.materials.find((item) => item.id === material.id) ??
                (!material.url && material.type === "FILE"
                  ? persistedClass.materials[index]
                  : undefined);
              return persistedMaterial ? { ...material, ...persistedMaterial } : material;
            }),
          };
        }),
      };
    }),
  };
  const subjects = flattenSubjects(restored.subjects).map((subject) => ({
    ...subject,
    classes: subject.classes.map((classSession) => ({
      ...classSession,
      startTime: classSession.startTime || classSession.scheduledAt.slice(11, 16),
    })),
  }));
  return {
    ...restored,
    subjects,
    scheduleDays: merged.scheduleDays.length
      ? merged.scheduleDays.map((day) => ({
          ...day,
          classIds: day.classIds.filter((classId) =>
            subjects.some((subject) => subject.id === classId),
          ),
        }))
      : buildScheduleDays(subjects),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? "Request failed.");
  return result;
}

function uploadMaterial(
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<{ id: string; title: string; type: "FILE"; url: string }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onerror = () =>
      reject(new Error("The material upload failed. Check your connection and try again."));
    request.onload = () => {
      let response: unknown;
      try {
        response = JSON.parse(request.responseText);
      } catch {
        reject(new Error("The material upload returned an invalid response."));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        const message =
          response &&
          typeof response === "object" &&
          "message" in response &&
          typeof response.message === "string"
            ? response.message
            : "The material upload failed.";
        reject(new Error(message));
        return;
      }
      if (
        !response ||
        typeof response !== "object" ||
        !("id" in response) ||
        typeof response.id !== "string" ||
        !("title" in response) ||
        typeof response.title !== "string" ||
        !("url" in response) ||
        typeof response.url !== "string"
      ) {
        reject(new Error("The material upload returned incomplete details."));
        return;
      }
      resolve({ id: response.id, title: response.title, type: "FILE", url: response.url });
    };
    request.open("POST", "/api/course-materials");
    request.send(formData);
  });
}

function uploadCourseAsset(
  file: File,
  courseId: string,
  kind: "cover" | "promo",
  onProgress: (progress: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("file", file);
    const request = new XMLHttpRequest();
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () =>
      reject(new Error("The media upload failed. Check your connection and try again."));
    request.onload = () => {
      let response: unknown;
      try {
        response = JSON.parse(request.responseText);
      } catch {
        reject(new Error("The media upload returned an invalid response."));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        const message =
          response &&
          typeof response === "object" &&
          "message" in response &&
          typeof response.message === "string"
            ? response.message
            : "The media upload failed.";
        reject(new Error(message));
        return;
      }
      if (
        !response ||
        typeof response !== "object" ||
        !("url" in response) ||
        typeof response.url !== "string"
      ) {
        reject(new Error("The media upload returned incomplete details."));
        return;
      }
      resolve({ url: response.url });
    };
    request.open("POST", `/api/course-media/${encodeURIComponent(courseId)}/${kind}`);
    request.send(formData);
  });
}

export function AccountPicker({
  role,
  selected,
  onChange,
  multiple = false,
}: {
  role: "teacher" | "participant";
  selected: AccountOption[];
  onChange: (users: AccountOption[]) => void;
  multiple?: boolean;
}) {
  const [search, setSearch] = useState("");
  const searchTerm = search.trim();
  const query = useQuery({
    queryKey: ["course-users", role, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ role, q: searchTerm });
      return readJson<UserResponse>(
        await fetch(`/api/course-users?${params}`, { cache: "no-store" }),
      );
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30_000,
  });
  const selectedIds = new Set(selected.map((user) => user.id));

  function choose(user: AccountOption) {
    if (multiple) {
      if (!selectedIds.has(user.id)) onChange([...selected, user]);
    } else {
      onChange([user]);
    }
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>
        Search {role === "teacher" ? "teachers" : "participants"}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder={`Type a name or email`}
          className={fieldClass}
        />
      </label>
      {selected.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <li
              key={user.id}
              className="bg-accent text-accent-foreground inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[11px]"
            >
              <span className="truncate">
                {user.name} · {user.email}
                {user.isMock ? " · Mock" : ""}
              </span>
              <button
                type="button"
                onClick={() => onChange(selected.filter((item) => item.id !== user.id))}
                aria-label={`Remove ${user.name}`}
                className="hover:text-destructive px-1 text-sm font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {searchTerm.length < 2 ? (
        <p className="text-muted-foreground text-xs">Type at least 2 characters to search.</p>
      ) : null}
      {query.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {query.error.message}
        </p>
      ) : null}
      <div className="border-border max-h-36 overflow-y-auto rounded-md border">
        {searchTerm.length < 2 ? null : query.isLoading ? (
          <p className="text-muted-foreground p-2 text-xs">Loading registered accounts…</p>
        ) : query.data?.length ? (
          query.data.map((user) => {
            const option = { ...user, branchName: user.branchName ?? user.branch?.name ?? null };
            const alreadySelected = selectedIds.has(user.id);
            return (
              <button
                key={user.id}
                type="button"
                disabled={alreadySelected && !multiple}
                onClick={() => choose(option)}
                className="hover:bg-accent flex w-full flex-col items-start border-b px-2.5 py-2 text-left last:border-0 disabled:opacity-50"
              >
                <span className="text-foreground text-xs font-medium">{user.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {user.id} · {user.email}
                  {user.phone ? ` · ${user.phone}` : ""}
                  {option.branchName ? ` · ${option.branchName}` : ""}
                  {option.isMock ? " · Mock test account" : ""}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-muted-foreground p-2 text-xs">
            {role === "teacher"
              ? "No eligible teachers found. Only active, non-test teacher accounts can be assigned."
              : "No eligible participants found. Only active, non-test participant accounts can be assigned."}
          </p>
        )}
      </div>
    </div>
  );
}

export function CourseEditor({
  initialCourse,
  onCancel,
}: {
  initialCourse?: CourseRow;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const parsedInitialSnapshot = initialCourse
    ? courseWizardSnapshotSchema.safeParse(
        normalizeCourseDraftMedia(initialCourse.draftData, initialCourse.id),
      )
    : null;
  const savedProgress = parsedInitialSnapshot?.success ? parsedInitialSnapshot.data.step : 0;
  const [step, setStep] = useState(
    typeof savedProgress === "number" && savedProgress >= 0 && savedProgress <= 3
      ? savedProgress
      : 0,
  );
  const [values, setValues] = useState(() =>
    initialCourse ? courseValues(initialCourse) : newValues(),
  );
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const valuesRef = useRef(values);
  const stepRef = useRef(step);
  const initialCourseId = initialCourse?.id;
  const batchIdRef = useRef(initialCourse?.batchId ?? null);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [titleSearch, setTitleSearch] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mediaUpload, setMediaUpload] = useState<{
    kind: "cover" | "promo";
    progress: number;
  } | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [dirty, setDirty] = useState(!initialCourse);
  const draftRevision = useRef(0);
  const discardInProgress = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">(
    initialCourse ? "saved" : "unsaved",
  );
  const templateSearch = titleSearch.trim();
  const courseIdRef = useRef<string | null>(initialCourse?.id ?? null);
  const saveInFlight = useRef<Promise<boolean> | null>(null);
  const lastSavedRevision = useRef(0);
  const lastSavedStep = useRef(savedProgress);
  const publishOnSubmit = useRef(false);
  const templateQuery = useQuery({
    queryKey: ["course-templates", templateSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ q: templateSearch });
      return readJson<CourseTemplate[]>(
        await fetch(`/api/courses/templates?${params}`, { cache: "no-store" }),
      );
    },
    enabled: !initialCourse && templateSearch.length >= 2,
    staleTime: 30_000,
  });
  const categoryQuery = useQuery({
    queryKey: ["course-categories"],
    queryFn: async () =>
      readJson<string[]>(await fetch("/api/courses/templates?categories=1", { cache: "no-store" })),
    enabled: !initialCourse,
    staleTime: 60_000,
  });
  const categories = categoryQuery.data ?? [];
  useLayoutEffect(() => {
    valuesRef.current = values;
    stepRef.current = step;
  }, [step, values]);

  const steps = [
    { title: "Course basics", detail: "Set up your course", icon: BookOpen },
    { title: "Classes", detail: "Plan the schedule", icon: CalendarDays },
    { title: "Participants", detail: "Invite your learners", icon: Users },
    { title: "Preview & publish", detail: "Review everything", icon: Eye },
  ];

  const saveDraft = useCallback(
    async (nextStep = stepRef.current) => {
      if (discardInProgress.current) return false;
      if (valuesRef.current.title.trim().length < 3) {
        setSaveStatus("error");
        setNotice("Add a course title with at least 3 characters to save your draft.");
        return false;
      }

      while (true) {
        const activeSave = saveInFlight.current;
        if (activeSave) {
          if (!(await activeSave)) return false;
          if (
            lastSavedRevision.current === draftRevision.current &&
            lastSavedStep.current === nextStep
          ) {
            return true;
          }
          continue;
        }

        const revision = draftRevision.current;
        const latestValues = valuesRef.current;
        const formData = new FormData();
        formData.set("title", latestValues.title);
        formData.set("description", latestValues.description);
        formData.set("draftData", serializeCourseWizardDraft(latestValues, nextStep));
        if (courseIdRef.current) formData.set("courseId", courseIdRef.current);
        setSaveStatus("saving");

        const request = (async () => {
          try {
            const result = await saveCourseDraftProgressAction(formData);
            if (!result.success) {
              setNotice(result.message);
              setSaveStatus("error");
              return false;
            }
            if (result.courseId) {
              courseIdRef.current = result.courseId;
              if (!initialCourseId) setSavedCourseId(result.courseId);
            }
            if (result.batchId) batchIdRef.current = result.batchId;
            lastSavedRevision.current = revision;
            lastSavedStep.current = nextStep;
            setNotice("");
            const upToDate = draftRevision.current === revision;
            setDirty(!upToDate);
            setSaveStatus(upToDate ? "saved" : "unsaved");
            return true;
          } catch (error) {
            setNotice(
              error instanceof Error ? error.message : "The course draft could not be saved.",
            );
            setSaveStatus("error");
            return false;
          }
        })();
        saveInFlight.current = request;
        const succeeded = await request;
        if (saveInFlight.current === request) saveInFlight.current = null;
        if (!succeeded) return false;
        if (
          lastSavedRevision.current === draftRevision.current &&
          lastSavedStep.current === nextStep
        ) {
          return true;
        }
      }
    },
    [initialCourseId],
  );

  async function handleCourseAssetUpload(kind: "cover" | "promo", file: File) {
    setNotice("");
    setMediaUpload({ kind, progress: 0 });
    try {
      let courseId = courseIdRef.current;
      if (!courseId) {
        const saved = await saveDraft();
        courseId = courseIdRef.current;
        if (!saved || !courseId) {
          throw new Error("Save a course title before uploading its media.");
        }
      }

      const { url } = await uploadCourseAsset(file, courseId, kind, (progress) => {
        setMediaUpload({ kind, progress });
      });
      patch(kind === "cover" ? { coverImageUrl: url } : { promoVideoUrl: url });
      if (!(await saveDraft())) {
        throw new Error("The media uploaded, but the course draft could not be saved.");
      }
      setNotice(kind === "cover" ? "Cover image uploaded." : "Promo video uploaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The course media could not be uploaded.");
    } finally {
      setMediaUpload(null);
    }
  }

  async function removeCourseAsset(kind: "cover" | "promo") {
    const courseId = courseIdRef.current;
    if (!courseId) return;
    const currentUrl =
      kind === "cover" ? valuesRef.current.coverImageUrl : valuesRef.current.promoVideoUrl;
    if (!currentUrl) return;

    setNotice("");
    patch(kind === "cover" ? { coverImageUrl: "" } : { promoVideoUrl: "" });
    if (!(await saveDraft())) return;
    try {
      await readJson<{ success: boolean }>(
        await fetch(`/api/course-media/${encodeURIComponent(courseId)}/${kind}`, {
          method: "DELETE",
        }),
      );
      setNotice(kind === "cover" ? "Cover image removed." : "Promo video removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The course media could not be removed.");
    }
  }

  useEffect(() => {
    if (discardInProgress.current || !dirty || values.title.trim().length < 3) return;
    const timeout = window.setTimeout(() => void saveDraft(), 900);
    return () => window.clearTimeout(timeout);
  }, [dirty, saveDraft, values.title]);

  async function discardCourse() {
    const isPublishedCourse = initialCourse?.status === "PUBLISHED";
    const courseId = courseIdRef.current ?? initialCourse?.id ?? savedCourseId;
    const message = isPublishedCourse
      ? "Discard your unsaved changes to this published course?"
      : "Discard this course and permanently delete its saved draft and materials?";
    if (!window.confirm(message)) return;

    discardInProgress.current = true;
    setDiscarding(true);
    if (isPublishedCourse) {
      if (onCancel) onCancel();
      else router.replace(`/dashboard/courses/${initialCourse.id}`);
      return;
    }

    try {
      if (courseId) {
        const formData = new FormData();
        formData.set("courseId", courseId);
        const result = await deleteCourseAction(formData);
        if (!result.success) throw new Error(result.message);
      }
      router.replace("/dashboard/courses");
      router.refresh();
    } catch (error) {
      discardInProgress.current = false;
      setDiscarding(false);
      setNotice(error instanceof Error ? error.message : "The course could not be discarded.");
    }
  }

  function patch(valuesPatch: Partial<CourseFormValues>) {
    draftRevision.current += 1;
    const nextValues = { ...valuesRef.current, ...valuesPatch };
    valuesRef.current = nextValues;
    setValues(nextValues);
    setDirty(true);
    setSaveStatus("unsaved");
  }

  function patchSubject(index: number, patchSubjectValues: Partial<DraftSubject>) {
    draftRevision.current += 1;
    setValues((current) => ({
      ...current,
      subjects: current.subjects.map((subject, subjectIndex) =>
        subjectIndex === index ? { ...subject, ...patchSubjectValues } : subject,
      ),
    }));
    setDirty(true);
    setSaveStatus("unsaved");
  }

  function patchClass(
    subjectIndex: number,
    classIndex: number,
    patchClassValues: Partial<DraftClass>,
  ) {
    draftRevision.current += 1;
    setValues((current) => ({
      ...current,
      subjects: current.subjects.map((subject, currentSubjectIndex) =>
        currentSubjectIndex === subjectIndex
          ? {
              ...subject,
              classes: subject.classes.map((classSession, currentClassIndex) =>
                currentClassIndex === classIndex
                  ? { ...classSession, ...patchClassValues }
                  : classSession,
              ),
            }
          : subject,
      ),
    }));
    setDirty(true);
    setSaveStatus("unsaved");
  }

  async function applyTemplate(template: CourseTemplate) {
    setTemplateId(template.id);
    setNotice("");
    try {
      const source = await readJson<CourseRow>(
        await fetch(`/api/courses/${template.id}`, { cache: "no-store" }),
      );
      const subjects = source.subjects.flatMap((subject) =>
        subject.classes.map((classSession) => ({
          id: crypto.randomUUID(),
          title: classSession.name,
          coTeachers: [],
          teacher: {
            id: subject.teacherId,
            name: subject.teacherName,
            email: subject.teacherEmail,
            phone: null,
            branchName: null,
            isMock: subject.teacherIsMock,
          },
          classes: [
            {
              ...createClass(),
              name: classSession.name,
              durationMinutes: classSession.durationMinutes,
              scheduledAt: classSession.scheduledAt?.slice(0, 16) ?? "",
              startTime: classSession.scheduledAt?.slice(11, 16) ?? "",
              endTime: "",
              venue: classSession.venue ?? "",
              deliveryMode: classSession.deliveryMode,
              materials: classSession.materials.map((material) => ({
                key: crypto.randomUUID(),
                title: material.title,
                type: material.type,
                url: material.url,
                visibility: "BEFORE" as const,
                downloadable: true,
              })),
            },
          ],
        })),
      );
      setValues({
        ...courseValues(source),
        subjects,
        scheduleDays: buildScheduleDays(subjects),
      });
      setTitleSearch(source.title);
      draftRevision.current += 1;
      setDirty(true);
      setSaveStatus("unsaved");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load the selected course.");
    }
  }

  function getStepErrors(currentStep: number) {
    const errors: string[] = [];
    if (currentStep === 0) {
      if (values.title.trim().length < 3)
        errors.push("Enter a course title (at least 3 characters).");
      if (values.description.trim().length < 20)
        errors.push("Add a full description with at least 20 characters.");
      if (values.learningOutcomes.trim().length < 10)
        errors.push("Add at least one learning outcome.");
      if (!values.durationDays) errors.push("Set the course duration.");
      if (!values.capacity) errors.push("Set the maximum number of seats.");
      if (values.startDate && values.endDate && values.endDate < values.startDate) {
        errors.push("The course end date must be on or after the start date.");
      }
    }
    if (currentStep === 1) {
      if (!values.subjects.length) errors.push("Add at least one class.");
      if (
        values.courseScheduleMode === "MULTIPLE" &&
        values.scheduleDays.some((day) => !day.date)
      ) {
        errors.push("Set a date for every course day.");
      }
      if (
        values.subjects.some(
          (subject) =>
            !subject.teacher ||
            !subject.classes.length ||
            subject.classes.some((classSession) => !classSession.name.trim()),
        )
      ) {
        errors.push("Give every class a title and assign a teacher.");
      }
    }
    if (currentStep === 2 && values.participants.length === 0 && !values.inviteEmails.trim()) {
      errors.push("Select a participant or add invite email addresses.");
    }
    return errors;
  }

  function validateStep(currentStep: number) {
    const errors = getStepErrors(currentStep);
    setFieldErrors(errors);
    return errors.length === 0;
  }

  async function goToStep(nextStep: number) {
    if (nextStep > step) {
      for (let index = step; index < nextStep; index += 1) {
        if (!validateStep(index)) return;
      }
    }
    if (nextStep !== step) draftRevision.current += 1;
    const saved = await saveDraft(nextStep);
    if (!saved && values.title.trim().length >= 3) return;
    setStep(nextStep);
    setFieldErrors([]);
  }

  function classConflicts() {
    const scheduled = values.scheduleDays.flatMap((day) =>
      day.classIds.flatMap((classId) => {
        const subject = values.subjects.find((item) => item.id === classId);
        const classSession = subject?.classes[0];
        if (!subject || !classSession || !day.date || !classSession.startTime) return [];
        const start = new Date(`${day.date}T${classSession.startTime}`).getTime();
        return [
          {
            name: classSession.name || "Untitled class",
            teacher: subject.teacher?.name ?? "Unassigned teacher",
            start,
            end: start + Number(classSession.durationMinutes) * 60_000,
          },
        ];
      }),
    );
    const conflicts = new Set<string>();
    for (let index = 0; index < scheduled.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < scheduled.length; otherIndex += 1) {
        const first = scheduled[index];
        const second = scheduled[otherIndex];
        if (first.start < second.end && second.start < first.end) {
          conflicts.add(
            first.teacher === second.teacher
              ? `${first.teacher} is scheduled for ${first.name} and ${second.name} at the same time.`
              : `${first.name} and ${second.name} have overlapping schedules.`,
          );
        }
      }
    }
    return [...conflicts];
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      if (validateStep(step)) await goToStep(step + 1);
      return;
    }
    const errors = [0, 1, 2].flatMap((stepIndex) => {
      const title = ["Course basics", "Classes", "Participants"][stepIndex];
      return getStepErrors(stepIndex).map((error) => `${title}: ${error}`);
    });
    if (errors.length) {
      setFieldErrors(errors);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setNotice("");
    const progressSaved = await saveDraft(3);
    if (!progressSaved) {
      setSaving(false);
      return;
    }
    formData.set("title", values.title);
    formData.set("description", values.description);
    formData.set("category", values.category);
    formData.set("prerequisites", values.prerequisites);
    formData.set("learningOutcomes", values.learningOutcomes);
    formData.set("durationDays", String(values.durationDays));
    formData.set("capacity", String(values.capacity));
    formData.set("draftData", serializeCourseWizardDraft(values, step));
    const subjectsById = new Map(values.subjects.map((subject) => [subject.id, subject]));
    const scheduleDateByClassId = new Map(
      values.scheduleDays.flatMap((day) => day.classIds.map((id) => [id, day.date] as const)),
    );
    const scheduledSubjects = values.scheduleDays
      .flatMap((day) =>
        day.classIds.flatMap((id) => {
          const subject = subjectsById.get(id);
          return subject ? [subject] : [];
        }),
      )
      .concat(values.subjects.filter((subject) => !scheduleDateByClassId.has(subject.id)));
    formData.set(
      "subjects",
      JSON.stringify(
        scheduledSubjects.map((subject) => ({
          id: subject.id,
          title: subject.classes[0]?.name || "Class",
          teacherId: subject.teacher?.id ?? "",
          classes: subject.classes.map((classSession) => ({
            id: classSession.id,
            name: classSession.name,
            durationMinutes: Number(classSession.durationMinutes),
            scheduledAt:
              scheduleDateByClassId.get(subject.id) && classSession.startTime
                ? new Date(
                    `${scheduleDateByClassId.get(subject.id)}T${classSession.startTime}`,
                  ).toISOString()
                : null,
            venue: classSession.venue || null,
            deliveryMode: classSession.deliveryMode,
            materials: classSession.materials
              .filter((material) => !material.file && (material.type !== "FILE" || material.url))
              .map(({ id, title, type, url }) => ({ id, title, type, url })),
          })),
        })),
      ),
    );
    formData.set("participantIds", JSON.stringify(values.participants.map((user) => user.id)));
    const courseId = courseIdRef.current ?? initialCourse?.id ?? savedCourseId;
    if (courseId) formData.set("courseId", courseId);
    if (batchIdRef.current) formData.set("batchId", batchIdRef.current);

    try {
      const result = await updateCourseAction(formData);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      const resultingCourseId = result.courseId ?? courseId;
      if (!resultingCourseId) {
        setNotice("The course was saved, but its course ID was not returned.");
        return;
      }
      setSavedCourseId(resultingCourseId);
      courseIdRef.current = resultingCourseId;

      const files = values.subjects.flatMap((subject) =>
        subject.classes.flatMap((classSession) =>
          classSession.materials
            .filter((material) => material.file)
            .map((material) => ({ classSession, material, file: material.file! })),
        ),
      );
      const totalBytes = files.reduce((total, item) => total + item.file.size, 0);
      let uploadedBytes = 0;
      if (files.length) setUploadProgress(0);
      let updatedValues = values;
      for (const { classSession, material, file } of files) {
        const uploadData = new FormData();
        uploadData.set("courseId", resultingCourseId);
        uploadData.set("classId", classSession.id);
        uploadData.set("title", material.title || file.name);
        uploadData.set("file", file);
        const uploaded = await uploadMaterial(uploadData, (ratio) => {
          setUploadProgress(
            totalBytes ? Math.round(((uploadedBytes + file.size * ratio) / totalBytes) * 100) : 0,
          );
        });
        uploadedBytes += file.size;
        setUploadProgress(totalBytes ? Math.round((uploadedBytes / totalBytes) * 100) : 100);
        updatedValues = {
          ...updatedValues,
          subjects: updatedValues.subjects.map((currentSubject) => ({
            ...currentSubject,
            classes: currentSubject.classes.map((currentClass) => ({
              ...currentClass,
              materials: currentClass.materials.map((currentMaterial) =>
                currentMaterial.key === material.key
                  ? { ...currentMaterial, ...uploaded, file: undefined }
                  : currentMaterial,
              ),
            })),
          })),
        };
        setValues(updatedValues);
      }
      setUploadProgress(null);
      if (files.length) {
        const progressData = new FormData();
        progressData.set("title", updatedValues.title);
        progressData.set("description", updatedValues.description);
        progressData.set("courseId", resultingCourseId);
        progressData.set("draftData", serializeCourseWizardDraft(updatedValues, 3));
        const savedProgress = await saveCourseDraftProgressAction(progressData);
        if (!savedProgress.success) throw new Error(savedProgress.message);
      }

      if (publishOnSubmit.current) {
        const publishData = new FormData();
        publishData.set("courseId", resultingCourseId);
        const published = await publishCourseAction(publishData);
        if (!published.success) {
          setNotice(published.message);
          return;
        }
      }
      router.replace("/dashboard/courses");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The course or its materials could not be saved.",
      );
    } finally {
      setUploadProgress(null);
      publishOnSubmit.current = false;
      setSaving(false);
    }
  }

  function setCourseDuration(durationDays: number | "") {
    const mode = durationDays !== "" && durationDays > 1 ? "MULTIPLE" : "SINGLE";
    let scheduleDays = values.scheduleDays;
    if (mode === "SINGLE") {
      const firstDay = scheduleDays[0] ?? { id: crypto.randomUUID(), date: "", classIds: [] };
      scheduleDays = [{ ...firstDay, classIds: scheduleDays.flatMap((day) => day.classIds) }];
    } else {
      const targetDays = Math.min(typeof durationDays === "number" ? durationDays : 1, 100);
      scheduleDays = [...scheduleDays];
      while (scheduleDays.length < targetDays) {
        scheduleDays.push({ id: crypto.randomUUID(), date: "", classIds: [] });
      }
    }
    patch({ durationDays, courseScheduleMode: mode, scheduleDays });
  }

  function addMaterialFiles(subjectIndex: number, files: File[]) {
    const supportedExtensions = new Set([
      "doc",
      "docx",
      "jpeg",
      "jpg",
      "mp4",
      "mov",
      "pdf",
      "png",
      "ppt",
      "pptx",
      "txt",
      "webm",
      "xls",
      "xlsx",
    ]);
    const validFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return file.size <= 20 * 1024 * 1024 && supportedExtensions.has(extension ?? "");
    });
    if (validFiles.length !== files.length) {
      setNotice("Some files were skipped. Use supported file types smaller than 20 MB each.");
    } else {
      setNotice("");
    }
    if (!validFiles.length) return;

    const subject = values.subjects[subjectIndex];
    const classSession = subject.classes[0];
    patchClass(subjectIndex, 0, {
      materials: [
        ...classSession.materials,
        ...validFiles.map((file) => ({
          key: crypto.randomUUID(),
          title: file.name.replace(/\.[^.]+$/, ""),
          type: "FILE" as const,
          file,
          visibility: "BEFORE" as const,
          downloadable: true,
        })),
      ],
    });
  }

  function addMaterialLink(subjectIndex: number) {
    const classSession = values.subjects[subjectIndex].classes[0];
    patchClass(subjectIndex, 0, {
      materials: [
        ...classSession.materials,
        {
          key: crypto.randomUUID(),
          title: "",
          type: "LINK",
          visibility: "BEFORE",
          downloadable: true,
        },
      ],
    });
  }

  function addClass(dayIndex: number) {
    const classSession = createClass();
    const subjectId = crypto.randomUUID();
    patch({
      subjects: [
        ...values.subjects,
        {
          id: subjectId,
          title: classSession.name,
          teacher: null,
          coTeachers: [],
          classes: [classSession],
        },
      ],
      scheduleDays: values.scheduleDays.map((day, index) =>
        index === dayIndex ? { ...day, classIds: [...day.classIds, subjectId] } : day,
      ),
    });
    setExpandedClassId(classSession.id);
  }

  function duplicateClass(dayIndex: number, subjectIndex: number) {
    const source = values.subjects[subjectIndex];
    const classSession = source.classes[0];
    const duplicateId = crypto.randomUUID();
    const duplicateClassId = crypto.randomUUID();
    patch({
      subjects: [
        ...values.subjects,
        {
          ...source,
          id: duplicateId,
          title: classSession.name ? `${classSession.name} (copy)` : "",
          classes: [
            {
              ...classSession,
              id: duplicateClassId,
              name: classSession.name ? `${classSession.name} (copy)` : "",
              materials: classSession.materials.map((material) => ({
                ...material,
                key: crypto.randomUUID(),
                id: undefined,
              })),
            },
          ],
        },
      ],
      scheduleDays: values.scheduleDays.map((day, index) =>
        index === dayIndex ? { ...day, classIds: [...day.classIds, duplicateId] } : day,
      ),
    });
    setExpandedClassId(duplicateClassId);
  }

  function addScheduleDay() {
    if (values.scheduleDays.length >= 100) {
      setNotice("Course schedules are limited to 100 days.");
      return;
    }
    patch({
      courseScheduleMode: "MULTIPLE",
      scheduleDays: [...values.scheduleDays, { id: crypto.randomUUID(), date: "", classIds: [] }],
    });
  }

  function duplicateScheduleDay(dayIndex: number) {
    if (values.scheduleDays.length >= 100) {
      setNotice("Course schedules are limited to 100 days.");
      return;
    }
    const sourceDay = values.scheduleDays[dayIndex];
    const duplicatedClasses = sourceDay.classIds.flatMap((classId) => {
      const source = values.subjects.find((subject) => subject.id === classId);
      if (!source) return [];
      const sourceClass = source.classes[0];
      const subjectId = crypto.randomUUID();
      const classSessionId = crypto.randomUUID();
      return [
        {
          ...source,
          id: subjectId,
          classes: [
            {
              ...sourceClass,
              id: classSessionId,
              scheduledAt: "",
              materials: sourceClass.materials.map((material) => ({
                ...material,
                key: crypto.randomUUID(),
                id: undefined,
              })),
            },
          ],
        },
      ];
    });
    const duplicateDay = {
      id: crypto.randomUUID(),
      date: "",
      classIds: duplicatedClasses.map((subject) => subject.id),
    };
    patch({
      subjects: [...values.subjects, ...duplicatedClasses],
      scheduleDays: [
        ...values.scheduleDays.slice(0, dayIndex + 1),
        duplicateDay,
        ...values.scheduleDays.slice(dayIndex + 1),
      ],
    });
  }

  function removeScheduleDay(dayIndex: number) {
    if (values.scheduleDays.length <= 1) return;
    const [removedDay] = values.scheduleDays.slice(dayIndex, dayIndex + 1);
    const removedIds = new Set(removedDay.classIds);
    patch({
      subjects: values.subjects.filter((subject) => !removedIds.has(subject.id)),
      scheduleDays: values.scheduleDays.filter((_, index) => index !== dayIndex),
    });
  }

  function setScheduleDayDate(dayIndex: number, date: string) {
    patch({
      scheduleDays: values.scheduleDays.map((day, index) =>
        index === dayIndex ? { ...day, date } : day,
      ),
    });
  }

  function setCourseScheduleMode(mode: CourseFormValues["courseScheduleMode"]) {
    if (mode === "SINGLE") {
      const classIds = values.scheduleDays.flatMap((day) => day.classIds);
      const firstDay = values.scheduleDays[0] ?? {
        id: crypto.randomUUID(),
        date: "",
        classIds: [],
      };
      patch({
        courseScheduleMode: mode,
        scheduleDays: [{ ...firstDay, classIds }],
      });
      return;
    }

    const dayCount = Math.min(Math.max(2, Number(values.durationDays) || 2), 100);
    const scheduleDays = [...values.scheduleDays];
    while (scheduleDays.length < dayCount) {
      scheduleDays.push({ id: crypto.randomUUID(), date: "", classIds: [] });
    }
    patch({ courseScheduleMode: mode, scheduleDays });
  }

  function reorderClass(dayIndex: number, fromIndex: number, toIndex: number) {
    const scheduleDays = values.scheduleDays.map((day, index) => {
      if (index !== dayIndex) return day;
      const classIds = [...day.classIds];
      const [moved] = classIds.splice(fromIndex, 1);
      classIds.splice(toIndex, 0, moved);
      return { ...day, classIds };
    });
    patch({ scheduleDays });
  }

  function removeClass(dayIndex: number, subjectId: string) {
    patch({
      subjects: values.subjects.filter((subject) => subject.id !== subjectId),
      scheduleDays: values.scheduleDays.map((day, index) =>
        index === dayIndex
          ? { ...day, classIds: day.classIds.filter((classId) => classId !== subjectId) }
          : day,
      ),
    });
  }

  function statusLabel() {
    if (saveStatus === "saving") return "Saving draft…";
    if (saveStatus === "error") return "Draft not saved";
    if (saveStatus === "unsaved") return "Unsaved changes";
    return "All changes saved";
  }

  const conflicts = classConflicts();
  const classCount = values.subjects.length;
  const materialCount = values.subjects.reduce(
    (total, subject) => total + (subject.classes[0]?.materials.length ?? 0),
    0,
  );
  const teacherCount = new Set(
    values.subjects.map((subject) => subject.teacher?.id).filter(Boolean),
  ).size;
  const readyItems = [
    {
      label: "Course basics complete",
      ready: values.title.trim().length >= 3 && values.description.trim().length >= 20,
    },
    {
      label: "Set a date for every day",
      ready:
        values.scheduleDays.length > 0 && values.scheduleDays.every((day) => Boolean(day.date)),
    },
    {
      label: "Assign a teacher to every class",
      ready:
        values.subjects.length > 0 &&
        values.subjects.every(
          (subject) => subject.teacher && Boolean(subject.classes[0]?.name.trim()),
        ),
    },
    {
      label: "Add participants or an invite link",
      ready:
        values.participants.length > 0 ||
        Boolean(values.inviteEmails.trim()) ||
        Boolean(values.accessCode.trim()),
    },
    {
      label: "Review the course preview",
      ready: step === 3 && values.title.trim().length >= 3,
    },
  ];
  const canPublish =
    readyItems.every((item) => item.ready) &&
    values.participants.length > 0 &&
    conflicts.length === 0;

  return (
    <form onSubmit={submit} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            <Link href="/dashboard/courses" className="hover:text-primary hover:underline">
              Courses
            </Link>{" "}
            / {initialCourse ? "Edit course" : "New course"}
          </p>
          {initialCourse ? (
            <h2 className="text-foreground mt-2 text-3xl leading-tight font-bold tracking-tight">
              Edit a course
            </h2>
          ) : (
            <h1 className="text-foreground mt-2 text-3xl leading-tight font-bold tracking-tight">
              Create a course
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="sr-only" aria-live="polite">
            {statusLabel()}
          </span>
          <button
            type="button"
            disabled={saving || saveStatus === "saving" || discarding}
            onClick={() => {
              void (async () => {
                if (await saveDraft()) {
                  router.replace("/dashboard/courses");
                  router.refresh();
                }
              })();
            }}
            className="border-border bg-background text-foreground inline-flex min-h-12 items-center gap-2 rounded-lg border px-5 text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving || saveStatus === "saving" || discarding}
            onClick={() => void discardCourse()}
            className="text-destructive border-destructive/30 inline-flex min-h-12 items-center gap-2 rounded-lg border px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {discarding ? "Discarding…" : "Discard"}
          </button>
        </div>
      </header>

      <nav
        aria-label="Course creation steps"
        className="border-border bg-card rounded-xl border px-5 py-4"
      >
        <ol className="flex items-center">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = step === index;
            const complete = index < step;
            return (
              <li key={item.title} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  onClick={() => void goToStep(index)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : complete
                          ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-600"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {complete ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : active ? (
                      index + 1
                    ) : (
                      <Icon aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {complete
                        ? "Completed"
                        : active
                          ? "In progress"
                          : index === step + 1
                            ? "Up next"
                            : "Final step"}
                    </span>
                  </span>
                  {index < steps.length - 1 ? (
                    <span
                      className={`mx-3 h-0.5 min-w-4 flex-1 ${complete ? "bg-emerald-700 dark:bg-emerald-500" : "bg-border"}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]">
        <section className="border-border bg-card min-w-0 rounded-xl border p-4 shadow-sm sm:p-6">
          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-primary text-xs font-semibold">STEP 01 · COURSE BASICS</p>
                <h3 className="text-foreground mt-1 text-xl font-bold">
                  Add the course essentials
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You can add more details now or come back to them later.
                </p>
              </div>
              {!initialCourse ? (
                <div className="relative">
                  <label className={labelClass}>
                    Start from a course template
                    <input
                      value={titleSearch}
                      onChange={(event) => {
                        setTitleSearch(event.currentTarget.value);
                        setTemplateId(null);
                      }}
                      placeholder="Search previous courses"
                      className={fieldClass}
                    />
                  </label>
                  {titleSearch && templateId ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Template selected: {titleSearch}
                    </p>
                  ) : null}
                  {!templateId && templateSearch.length >= 2 && templateQuery.isLoading ? (
                    <p className="text-muted-foreground mt-2 text-xs" role="status">
                      Searching course templates…
                    </p>
                  ) : null}
                  {!templateId && templateSearch.length >= 2 && templateQuery.data?.length ? (
                    <div className="border-border bg-popover absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border shadow-lg">
                      {templateQuery.data.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => void applyTemplate(template)}
                          className="hover:bg-accent text-foreground flex w-full items-start justify-between border-b px-3 py-2 text-left text-sm last:border-0"
                        >
                          <span>{template.title}</span>
                          <Copy aria-hidden="true" className="text-muted-foreground size-4" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {!templateId &&
                  templateSearch.length >= 2 &&
                  templateQuery.isSuccess &&
                  templateQuery.data.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-xs" role="status">
                      No matching course templates.
                    </p>
                  ) : null}
                  {templateQuery.isError ? (
                    <p role="alert" className="text-destructive mt-1 text-xs">
                      {templateQuery.error.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={`${labelClass} sm:col-span-2`}>
                  Course title <span className="text-destructive">*</span>
                  <input
                    required
                    minLength={3}
                    maxLength={180}
                    value={values.title}
                    onChange={(event) => patch({ title: event.currentTarget.value })}
                    placeholder="e.g. Product Strategy Essentials"
                    className={fieldClass}
                  />
                </label>
                <label className={labelClass}>
                  Category
                  <input
                    list="course-categories"
                    maxLength={100}
                    value={values.category}
                    onChange={(event) => patch({ category: event.currentTarget.value })}
                    className={fieldClass}
                  />
                  <datalist id="course-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>
                <label className={labelClass}>
                  Duration (days) <span className="text-destructive">*</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={1000}
                    value={values.durationDays}
                    onChange={(event) => setCourseDuration(Number(event.currentTarget.value) || "")}
                    className={fieldClass}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Course description <span className="text-destructive">*</span>
                  <textarea
                    required
                    minLength={20}
                    maxLength={4000}
                    rows={4}
                    value={values.description}
                    onChange={(event) => patch({ description: event.currentTarget.value })}
                    placeholder="What will learners learn in this course?"
                    className={`${fieldClass} py-2`}
                  />
                </label>
                <label className={labelClass}>
                  Maximum seats <span className="text-destructive">*</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={10000}
                    value={values.capacity}
                    onChange={(event) =>
                      patch({ capacity: Number(event.currentTarget.value) || "" })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Learning outcomes <span className="text-destructive">*</span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={3}
                    value={values.learningOutcomes}
                    onChange={(event) => patch({ learningOutcomes: event.currentTarget.value })}
                    placeholder="What will participants be able to do after this course?"
                    className={`${fieldClass} py-2`}
                  />
                </label>
                <details className="border-border rounded-lg border p-3 md:col-span-3">
                  <summary className="text-foreground cursor-pointer text-sm font-semibold">
                    Optional details
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      Subtitle, dates, format, and more
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={`${labelClass} sm:col-span-2`}>
                      Subtitle
                      <input
                        maxLength={180}
                        value={values.subtitle}
                        onChange={(event) => patch({ subtitle: event.currentTarget.value })}
                        placeholder="A short, compelling one-liner"
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Tags{" "}
                      <span className="text-muted-foreground font-normal">· comma separated</span>
                      <input
                        value={values.tags}
                        onChange={(event) => patch({ tags: event.currentTarget.value })}
                        placeholder="leadership, strategy"
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Language
                      <select
                        value={values.language}
                        onChange={(event) => patch({ language: event.currentTarget.value })}
                        className={fieldClass}
                      >
                        <option>English</option>
                        <option>বাংলা</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Skill level
                      <select
                        value={values.skillLevel}
                        onChange={(event) =>
                          patch({
                            skillLevel: event.currentTarget.value as CourseFormValues["skillLevel"],
                          })
                        }
                        className={fieldClass}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Short description
                      <textarea
                        rows={2}
                        maxLength={300}
                        value={values.shortDescription}
                        onChange={(event) => patch({ shortDescription: event.currentTarget.value })}
                        placeholder="A brief introduction shown in course listings"
                        className={`${fieldClass} py-2`}
                      />
                      <span className="text-muted-foreground mt-1 block text-right text-[10px]">
                        {values.shortDescription.length}/300
                      </span>
                    </label>
                    <label className={labelClass}>
                      Course format
                      <select
                        value={values.format}
                        onChange={(event) =>
                          patch({ format: event.currentTarget.value as CourseFormValues["format"] })
                        }
                        className={fieldClass}
                      >
                        <option value="LIVE_ONLINE">Live online</option>
                        <option value="IN_PERSON">In person</option>
                        <option value="SELF_PACED">Self-paced</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Time zone
                      <input
                        value={values.timeZone}
                        onChange={(event) => patch({ timeZone: event.currentTarget.value })}
                        placeholder="Asia/Dhaka"
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Start date
                      <input
                        type="date"
                        value={values.startDate}
                        onChange={(event) => patch({ startDate: event.currentTarget.value })}
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      End date
                      <input
                        type="date"
                        value={values.endDate}
                        onChange={(event) => patch({ endDate: event.currentTarget.value })}
                        className={fieldClass}
                      />
                    </label>
                    <div className="space-y-2 sm:col-span-2">
                      <p className={labelClass}>
                        Cover image{" "}
                        <span className="text-muted-foreground font-normal">· optional</span>
                      </p>
                      <label className="border-border bg-background hover:bg-muted/50 flex min-h-11 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors">
                        <Upload aria-hidden="true" className="text-muted-foreground size-4" />
                        {values.coverImageUrl ? "Replace cover image" : "Upload cover image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                          disabled={mediaUpload !== null}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";
                            if (file) void handleCourseAssetUpload("cover", file);
                          }}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-muted-foreground text-xs">
                        JPG or PNG · stored privately · maximum 20 MB
                      </p>
                      {mediaUpload?.kind === "cover" ? (
                        <p role="status" className="text-muted-foreground text-xs">
                          Uploading cover image · {mediaUpload.progress}%
                        </p>
                      ) : null}
                      {values.coverImageUrl ? (
                        <div className="border-border max-w-lg overflow-hidden rounded-xl border">
                          <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
                            <Image
                              src={values.coverImageUrl}
                              alt="Course cover preview"
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, 512px"
                              className="object-cover"
                            />
                          </div>
                          <div className="px-3 py-2">
                            <button
                              type="button"
                              disabled={mediaUpload !== null}
                              onClick={() => void removeCourseAsset("cover")}
                              className="text-destructive text-xs font-semibold disabled:opacity-50"
                            >
                              Remove cover image
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <p className={labelClass}>
                        Promo video{" "}
                        <span className="text-muted-foreground font-normal">· optional</span>
                      </p>
                      <label className="border-border bg-background hover:bg-muted/50 flex min-h-11 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors">
                        <Upload aria-hidden="true" className="text-muted-foreground size-4" />
                        {values.promoVideoUrl ? "Replace promo video" : "Upload promo video"}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,.mp4,.webm"
                          disabled={mediaUpload !== null}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";
                            if (file) void handleCourseAssetUpload("promo", file);
                          }}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-muted-foreground text-xs">
                        MP4 or WebM · stored privately · maximum 20 MB
                      </p>
                      {mediaUpload?.kind === "promo" ? (
                        <p role="status" className="text-muted-foreground text-xs">
                          Uploading promo video · {mediaUpload.progress}%
                        </p>
                      ) : null}
                      {values.promoVideoUrl ? (
                        <div className="border-border max-w-lg overflow-hidden rounded-xl border">
                          <video
                            src={values.promoVideoUrl}
                            controls
                            preload="metadata"
                            aria-label="Course promo video preview"
                            className="aspect-video w-full bg-slate-950"
                          />
                          <div className="px-3 py-2">
                            <button
                              type="button"
                              disabled={mediaUpload !== null}
                              onClick={() => void removeCourseAsset("promo")}
                              className="text-destructive text-xs font-semibold disabled:opacity-50"
                            >
                              Remove promo video
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Prerequisites
                      <textarea
                        maxLength={2000}
                        rows={2}
                        value={values.prerequisites}
                        onChange={(event) => patch({ prerequisites: event.currentTarget.value })}
                        placeholder="What should learners know before joining?"
                        className={`${fieldClass} py-2`}
                      />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Who this course is for
                      <input
                        value={values.whoFor}
                        onChange={(event) => patch({ whoFor: event.currentTarget.value })}
                        placeholder="e.g. New managers and team leads"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </details>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-primary text-xs font-semibold">STEP 02 · CLASS SCHEDULE</p>
                  <h3 className="text-foreground mt-1 text-xl font-bold">Classes</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Organize classes by day. Each class has its own teacher, schedule and materials.
                  </p>
                </div>
              </div>
              {conflicts.length ? (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
                >
                  <p className="font-semibold">Schedule conflict detected</p>
                  {conflicts.map((conflict) => (
                    <p key={conflict} className="mt-1 text-xs">
                      {conflict}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-foreground text-sm font-medium">Course schedule</span>
                <div
                  className="border-border inline-flex overflow-hidden rounded-lg border"
                  role="group"
                  aria-label="Course schedule type"
                >
                  <button
                    type="button"
                    aria-pressed={values.courseScheduleMode === "SINGLE"}
                    onClick={() => setCourseScheduleMode("SINGLE")}
                    className={`min-h-10 px-4 text-sm font-medium ${values.courseScheduleMode === "SINGLE" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                  >
                    Single day
                  </button>
                  <button
                    type="button"
                    aria-pressed={values.courseScheduleMode === "MULTIPLE"}
                    onClick={() => setCourseScheduleMode("MULTIPLE")}
                    className={`min-h-10 border-l px-4 text-sm font-semibold ${values.courseScheduleMode === "MULTIPLE" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                  >
                    Multiple days
                  </button>
                </div>
              </div>
              {values.scheduleDays.map((day, dayIndex) => {
                const dayClasses = day.classIds.flatMap((classId) => {
                  const subjectIndex = values.subjects.findIndex(
                    (subject) => subject.id === classId,
                  );
                  const subject = values.subjects[subjectIndex];
                  const classSession = subject?.classes[0];
                  return subject && classSession ? [{ subject, subjectIndex, classSession }] : [];
                });
                if (dayClasses.length === 0) {
                  return (
                    <section
                      key={day.id}
                      className="border-border bg-muted/50 flex flex-wrap items-center gap-3 rounded-xl border p-4 sm:px-6"
                    >
                      <span className="bg-accent text-accent-foreground rounded-full px-3 py-2 text-sm font-semibold">
                        Day {dayIndex + 1}
                      </span>
                      <div className="min-w-32">
                        <p className="text-foreground text-sm font-medium">
                          {day.date ? `Date set · ${day.date}` : "Date not set"}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-sm">No classes yet</p>
                      </div>
                      {values.scheduleDays.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeScheduleDay(dayIndex)}
                          aria-label={`Remove day ${dayIndex + 1}`}
                          className="text-destructive ml-auto text-sm font-medium"
                        >
                          Remove day
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => addClass(dayIndex)}
                        className="border-primary text-primary hover:bg-accent ml-auto inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium"
                      >
                        Add classes
                      </button>
                    </section>
                  );
                }
                return (
                  <section
                    key={day.id}
                    className="border-border bg-muted/50 space-y-4 rounded-xl border p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-accent text-accent-foreground rounded-full px-3 py-2 text-sm font-semibold">
                        Day {dayIndex + 1}
                      </span>
                      <label className="text-foreground min-w-48 text-sm font-medium">
                        {day.date ? "Date" : "Date not set"}
                        <input
                          type="date"
                          aria-label={`Date for day ${dayIndex + 1}`}
                          value={day.date}
                          onChange={(event) =>
                            setScheduleDayDate(dayIndex, event.currentTarget.value)
                          }
                          className={`${fieldClass} max-w-60`}
                        />
                      </label>
                      <div className="ml-auto flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          onClick={() => duplicateScheduleDay(dayIndex)}
                          className="text-primary text-sm font-medium"
                        >
                          Duplicate day
                        </button>
                        <button
                          type="button"
                          disabled={values.scheduleDays.length <= 1}
                          onClick={() => removeScheduleDay(dayIndex)}
                          className="text-destructive text-sm font-medium disabled:opacity-40"
                        >
                          Remove day
                        </button>
                      </div>
                    </div>
                    {dayClasses.map(({ subject, subjectIndex, classSession }, classIndex) => (
                      <article
                        key={classSession.id}
                        className="border-border bg-card rounded-xl border p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            aria-expanded={
                              expandedClassId === classSession.id ||
                              (expandedClassId === null && dayIndex === 0 && classIndex === 0)
                            }
                            onClick={() =>
                              setExpandedClassId((current) =>
                                current === classSession.id ||
                                (current === null && dayIndex === 0 && classIndex === 0)
                                  ? "NONE"
                                  : classSession.id,
                              )
                            }
                            className="text-foreground min-w-0 text-left text-sm font-semibold"
                          >
                            Class {classIndex + 1}
                            {classSession.name ? ` · ${classSession.name}` : " · Untitled class"}
                            {expandedClassId !== classSession.id &&
                              !(expandedClassId === null && dayIndex === 0 && classIndex === 0) && (
                                <span className="text-muted-foreground mt-1 block text-xs font-normal">
                                  {subject.teacher?.name ?? "No teacher assigned"} ·{" "}
                                  {classSession.materials.length
                                    ? `${classSession.materials.length} material(s)`
                                    : "No materials"}
                                </span>
                              )}
                          </button>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => duplicateClass(dayIndex, subjectIndex)}
                              className="text-primary text-sm font-medium"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => removeClass(dayIndex, subject.id)}
                              aria-label={`Remove ${classSession.name || "class"}`}
                              className="text-destructive text-sm font-medium"
                            >
                              Remove
                            </button>
                            {expandedClassId !== classSession.id &&
                              !(expandedClassId === null && dayIndex === 0 && classIndex === 0) && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedClassId(classSession.id)}
                                  className="border-border rounded-lg border px-3 py-2 text-sm font-medium"
                                >
                                  Edit class
                                </button>
                              )}
                          </div>
                        </div>
                        {expandedClassId === classSession.id ||
                        (expandedClassId === null && dayIndex === 0 && classIndex === 0) ? (
                          <>
                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                              <label className={`${labelClass} md:col-span-3`}>
                                Class title
                                <input
                                  value={classSession.name}
                                  onChange={(event) =>
                                    patchClass(subjectIndex, classIndex, {
                                      name: event.currentTarget.value,
                                    })
                                  }
                                  placeholder="e.g. Introduction and course overview"
                                  className={fieldClass}
                                />
                              </label>
                              <div className={labelClass}>
                                Teacher
                                <div className="mt-1.5">
                                  <AccountPicker
                                    role="teacher"
                                    selected={subject.teacher ? [subject.teacher] : []}
                                    onChange={(users) =>
                                      patchSubject(subjectIndex, { teacher: users[0] ?? null })
                                    }
                                  />
                                </div>
                              </div>
                              <label className={labelClass}>
                                Format
                                <select
                                  value={classSession.deliveryMode}
                                  onChange={(event) =>
                                    patchClass(subjectIndex, classIndex, {
                                      deliveryMode: event.currentTarget
                                        .value as DraftClass["deliveryMode"],
                                    })
                                  }
                                  className={fieldClass}
                                >
                                  <option value="ONLINE">Online (live)</option>
                                  <option value="ONSITE">In person</option>
                                  <option value="HYBRID">Hybrid</option>
                                </select>
                              </label>
                              <label className={labelClass}>
                                Start time
                                <input
                                  type="time"
                                  value={classSession.startTime}
                                  onChange={(event) =>
                                    patchClass(subjectIndex, classIndex, {
                                      startTime: event.currentTarget.value,
                                      scheduledAt: day.date
                                        ? `${day.date}T${event.currentTarget.value}`
                                        : "",
                                    })
                                  }
                                  className={fieldClass}
                                />
                              </label>
                              <label className={labelClass}>
                                End time
                                <input
                                  type="time"
                                  value={classSession.endTime}
                                  onChange={(event) =>
                                    patchClass(subjectIndex, classIndex, {
                                      endTime: event.currentTarget.value,
                                    })
                                  }
                                  className={fieldClass}
                                />
                              </label>
                              <label className={`${labelClass} md:col-span-3`}>
                                Description
                                <textarea
                                  rows={3}
                                  value={classSession.description}
                                  onChange={(event) =>
                                    patchClass(subjectIndex, classIndex, {
                                      description: event.currentTarget.value,
                                    })
                                  }
                                  placeholder="What will students learn in this class?"
                                  className={`${fieldClass} py-2`}
                                />
                              </label>
                              <details className="border-border rounded-lg border p-3 md:col-span-3">
                                <summary className="text-foreground cursor-pointer text-xs font-semibold">
                                  Add co-teachers or guest speakers
                                </summary>
                                <div className="mt-3">
                                  <AccountPicker
                                    role="teacher"
                                    multiple
                                    selected={subject.coTeachers}
                                    onChange={(users) =>
                                      patchSubject(subjectIndex, { coTeachers: users })
                                    }
                                  />
                                </div>
                              </details>
                              <details className="border-border rounded-lg border p-3 sm:col-span-2">
                                <summary className="text-foreground cursor-pointer text-xs font-semibold">
                                  More class options
                                  <span className="text-muted-foreground ml-2 font-normal">
                                    Location, duration, capacity, and attendance
                                  </span>
                                </summary>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <label className={`${labelClass} sm:col-span-2`}>
                                    Room or meeting link
                                    <input
                                      value={classSession.venue}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          venue: event.currentTarget.value,
                                        })
                                      }
                                      placeholder="Room 204 or https://meet.google.com/…"
                                      className={fieldClass}
                                    />
                                  </label>
                                  <label className={labelClass}>
                                    Duration (minutes)
                                    <input
                                      type="number"
                                      min={1}
                                      max={10000}
                                      value={classSession.durationMinutes}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          durationMinutes: Number(event.currentTarget.value) || 1,
                                        })
                                      }
                                      className={fieldClass}
                                    />
                                  </label>
                                  <label className={labelClass}>
                                    Class capacity
                                    <input
                                      type="number"
                                      min={1}
                                      value={classSession.capacity}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          capacity: Number(event.currentTarget.value) || "",
                                        })
                                      }
                                      placeholder="Use course limit"
                                      className={fieldClass}
                                    />
                                  </label>
                                  <label className="text-foreground flex items-center gap-2 self-end pb-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={classSession.attendanceTracking}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          attendanceTracking: event.currentTarget.checked,
                                        })
                                      }
                                    />
                                    Track attendance
                                  </label>
                                  <label className="text-foreground flex items-center gap-2 text-xs sm:col-span-2">
                                    <input
                                      type="checkbox"
                                      checked={classSession.recurrence}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          recurrence: event.currentTarget.checked,
                                        })
                                      }
                                    />
                                    Repeat weekly
                                  </label>
                                </div>
                                <details className="mt-4 border-t pt-3">
                                  <summary className="text-foreground cursor-pointer text-xs font-semibold">
                                    Homework, quiz, or assignment
                                  </summary>
                                  <label className={`${labelClass} mt-3`}>
                                    Assignment instructions
                                    <textarea
                                      rows={2}
                                      value={classSession.assignment}
                                      onChange={(event) =>
                                        patchClass(subjectIndex, classIndex, {
                                          assignment: event.currentTarget.value,
                                        })
                                      }
                                      placeholder="Add instructions or a resource link"
                                      className={`${fieldClass} py-2`}
                                    />
                                  </label>
                                </details>
                              </details>
                            </div>
                            <div className="border-border rounded-lg border p-3">
                              <h4 className="text-foreground text-sm font-medium">Materials</h4>
                              <div className="mt-4 space-y-4">
                                <div className="border-border space-y-3 border-t pt-3">
                                  <div
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      addMaterialFiles(
                                        subjectIndex,
                                        Array.from(event.dataTransfer.files),
                                      );
                                    }}
                                    className="border-border bg-muted/50 text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm sm:p-4"
                                  >
                                    <span>
                                      Drag files here, or upload slides, PDFs, videos and links
                                    </span>
                                    <div className="flex shrink-0 gap-2">
                                      <label className="border-primary text-primary hover:bg-accent bg-card inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-4 text-sm font-medium">
                                        Upload files
                                        <input
                                          type="file"
                                          multiple
                                          accept=".doc,.docx,.jpeg,.jpg,.mp4,.mov,.pdf,.png,.ppt,.pptx,.txt,.webm,.xls,.xlsx"
                                          className="sr-only"
                                          onChange={(event) => {
                                            addMaterialFiles(
                                              subjectIndex,
                                              Array.from(event.currentTarget.files ?? []),
                                            );
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => addMaterialLink(subjectIndex)}
                                        className="border-border bg-card text-foreground min-h-10 rounded-lg border px-4 text-sm font-medium"
                                      >
                                        Add link
                                      </button>
                                    </div>
                                  </div>
                                  {classSession.materials.map((material) => (
                                    <div
                                      key={material.key}
                                      className="border-border grid gap-2 rounded-lg border p-3 sm:grid-cols-2"
                                    >
                                      <input
                                        aria-label="Material title"
                                        value={material.title}
                                        onChange={(event) =>
                                          patchClass(subjectIndex, classIndex, {
                                            materials: classSession.materials.map((item) =>
                                              item.key === material.key
                                                ? { ...item, title: event.currentTarget.value }
                                                : item,
                                            ),
                                          })
                                        }
                                        placeholder="Material title"
                                        className={fieldClass}
                                      />
                                      <select
                                        aria-label="Material type"
                                        value={material.type}
                                        onChange={(event) =>
                                          patchClass(subjectIndex, classIndex, {
                                            materials: classSession.materials.map((item) =>
                                              item.key === material.key
                                                ? {
                                                    ...item,
                                                    type: event.currentTarget
                                                      .value as DraftMaterial["type"],
                                                  }
                                                : item,
                                            ),
                                          })
                                        }
                                        className={fieldClass}
                                      >
                                        <option value="FILE">File upload</option>
                                        <option value="LINK">External link</option>
                                        <option value="TEXT">Recorded session</option>
                                      </select>
                                      {material.type === "LINK" || material.type === "TEXT" ? (
                                        <input
                                          aria-label="Material URL"
                                          type="url"
                                          value={material.url ?? ""}
                                          onChange={(event) =>
                                            patchClass(subjectIndex, classIndex, {
                                              materials: classSession.materials.map((item) =>
                                                item.key === material.key
                                                  ? { ...item, url: event.currentTarget.value }
                                                  : item,
                                              ),
                                            })
                                          }
                                          placeholder="https://…"
                                          className={fieldClass}
                                        />
                                      ) : material.file ? (
                                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                                          <FileText aria-hidden="true" className="size-4" />
                                          {material.file.name} ·{" "}
                                          {(material.file.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                      ) : material.url ? (
                                        <a
                                          className="text-primary flex items-center gap-2 text-xs underline"
                                          href={material.url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <FileText aria-hidden="true" className="size-4" />
                                          Attached file
                                        </a>
                                      ) : (
                                        <input
                                          type="file"
                                          accept=".doc,.docx,.jpeg,.jpg,.mp4,.mov,.pdf,.png,.ppt,.pptx,.txt,.webm,.xls,.xlsx"
                                          aria-label="Attach a file (20 MB maximum)"
                                          onChange={(event) => {
                                            const file = event.currentTarget.files?.[0];
                                            if (!file) return;
                                            const extension = file.name
                                              .split(".")
                                              .pop()
                                              ?.toLowerCase();
                                            if (
                                              file.size > 20 * 1024 * 1024 ||
                                              ![
                                                "doc",
                                                "docx",
                                                "jpeg",
                                                "jpg",
                                                "mp4",
                                                "mov",
                                                "pdf",
                                                "png",
                                                "ppt",
                                                "pptx",
                                                "txt",
                                                "webm",
                                                "xls",
                                                "xlsx",
                                              ].includes(extension ?? "")
                                            ) {
                                              setNotice(
                                                "Choose a supported file smaller than 20 MB.",
                                              );
                                              event.currentTarget.value = "";
                                              return;
                                            }
                                            setNotice("");
                                            patchClass(subjectIndex, classIndex, {
                                              materials: classSession.materials.map((item) =>
                                                item.key === material.key
                                                  ? {
                                                      ...item,
                                                      file,
                                                      title:
                                                        item.title ||
                                                        file.name.replace(/\.[^.]+$/, ""),
                                                    }
                                                  : item,
                                              ),
                                            });
                                          }}
                                          className={`${fieldClass} file:mr-2 file:border-0 file:bg-transparent file:text-xs`}
                                        />
                                      )}
                                      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                                        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                          Visible
                                          <select
                                            value={material.visibility}
                                            onChange={(event) =>
                                              patchClass(subjectIndex, classIndex, {
                                                materials: classSession.materials.map((item) =>
                                                  item.key === material.key
                                                    ? {
                                                        ...item,
                                                        visibility: event.currentTarget
                                                          .value as DraftMaterial["visibility"],
                                                      }
                                                    : item,
                                                ),
                                              })
                                            }
                                            className="border-input bg-background text-foreground rounded-md border px-2 py-1"
                                          >
                                            <option value="BEFORE">Before class</option>
                                            <option value="AFTER">After class</option>
                                          </select>
                                        </label>
                                        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                          <input
                                            type="checkbox"
                                            checked={material.downloadable}
                                            onChange={(event) =>
                                              patchClass(subjectIndex, classIndex, {
                                                materials: classSession.materials.map((item) =>
                                                  item.key === material.key
                                                    ? {
                                                        ...item,
                                                        downloadable: event.currentTarget.checked,
                                                      }
                                                    : item,
                                                ),
                                              })
                                            }
                                          />{" "}
                                          Download allowed
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            patchClass(subjectIndex, classIndex, {
                                              materials: classSession.materials.filter(
                                                (item) => item.key !== material.key,
                                              ),
                                            })
                                          }
                                          className="text-destructive ml-auto text-[11px] font-semibold"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                                    <Upload aria-hidden="true" className="size-3" />
                                    PDF, slides, documents, images, and video · maximum 20 MB per
                                    file
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </article>
                    ))}
                    <button
                      type="button"
                      onClick={() => addClass(dayIndex)}
                      className="border-primary text-primary hover:bg-accent inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed text-sm font-semibold"
                    >
                      + Add class to Day {dayIndex + 1}
                    </button>
                  </section>
                );
              })}
              {values.courseScheduleMode === "MULTIPLE" ? (
                <button
                  type="button"
                  onClick={addScheduleDay}
                  className="border-primary text-primary hover:bg-accent inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed text-sm font-semibold"
                >
                  + Add another day
                </button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <p className="text-primary text-xs font-semibold">STEP 03 · PARTICIPANTS</p>
                <h3 className="text-foreground mt-1 text-xl font-bold">Choose who can join</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Search for registered participants, or open an optional invite method.
                </p>
              </div>
              <details className="border-border rounded-lg border p-3">
                <summary className="text-foreground cursor-pointer text-sm font-semibold">
                  Enrollment settings
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    Role, access, and cohort
                  </span>
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Participant role
                    <select
                      value={values.participantRole}
                      onChange={(event) =>
                        patch({
                          participantRole: event.currentTarget
                            .value as CourseFormValues["participantRole"],
                        })
                      }
                      className={fieldClass}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="OBSERVER">Observer</option>
                      <option value="TEACHING_ASSISTANT">Teaching assistant</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Enrollment type
                    <select
                      value={values.enrollmentType}
                      onChange={(event) =>
                        patch({
                          enrollmentType: event.currentTarget
                            .value as CourseFormValues["enrollmentType"],
                        })
                      }
                      className={fieldClass}
                    >
                      <option value="OPEN">Open enrollment</option>
                      <option value="APPROVAL">Approval required</option>
                      <option value="INVITE_ONLY">Invite only</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Invite link or access code
                    <input
                      value={values.accessCode}
                      onChange={(event) => patch({ accessCode: event.currentTarget.value })}
                      placeholder="Create an optional access code"
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Invitation expiry
                    <input
                      type="date"
                      value={values.inviteExpiry}
                      onChange={(event) => patch({ inviteExpiry: event.currentTarget.value })}
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Batch name
                    <input
                      value={values.cohortName}
                      onChange={(event) => patch({ cohortName: event.currentTarget.value })}
                      placeholder="e.g. October 2026 batch"
                      className={fieldClass}
                    />
                  </label>
                </div>
              </details>
              <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-4">
                <h4 className="text-foreground text-sm font-semibold">
                  Add registered participants
                </h4>
                <AccountPicker
                  role="participant"
                  multiple
                  selected={values.participants}
                  onChange={(participants) => patch({ participants })}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted-foreground text-xs">
                    {values.participants.length} participant(s) selected
                  </p>
                </div>
                <details className="border-border rounded-lg border p-3">
                  <summary className="text-foreground cursor-pointer text-xs font-semibold">
                    Invite by email or CSV
                  </summary>
                  <div className="mt-3 space-y-3">
                    <label className={labelClass}>
                      Email addresses
                      <textarea
                        rows={3}
                        value={values.inviteEmails}
                        onChange={(event) => patch({ inviteEmails: event.currentTarget.value })}
                        placeholder="Add email addresses separated by commas or new lines"
                        className={`${fieldClass} py-2`}
                      />
                    </label>
                    <label className={`${labelClass} inline-flex items-center gap-2`}>
                      Upload CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="block text-xs"
                        onChange={async (event) => {
                          const file = event.currentTarget.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setNotice("Participant CSV files must be smaller than 2 MB.");
                            return;
                          }
                          const contents = await file.text();
                          const emails =
                            contents.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
                          patch({
                            inviteEmails: [
                              ...new Set(
                                [...values.inviteEmails.split(/[,\s;]+/), ...emails].filter(
                                  Boolean,
                                ),
                              ),
                            ].join("\n"),
                          });
                          setNotice(
                            emails.length
                              ? `${emails.length} email address(es) imported. Invitations are saved with this draft.`
                              : "No email addresses were found in that CSV.",
                          );
                        }}
                      />
                    </label>
                  </div>
                </details>
                <details className="border-border rounded-lg border p-3">
                  <summary className="text-foreground cursor-pointer text-xs font-semibold">
                    Waitlist and reminders
                  </summary>
                  <div className="mt-3 space-y-3">
                    <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={values.waitlist}
                        onChange={(event) => patch({ waitlist: event.currentTarget.checked })}
                      />
                      Enable waitlist
                    </label>
                    <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={values.reminderSettings}
                        onChange={(event) =>
                          patch({ reminderSettings: event.currentTarget.checked })
                        }
                      />
                      Send class reminders
                    </label>
                  </div>
                </details>
              </div>
              <details className="border-border rounded-lg border p-3">
                <summary className="text-foreground cursor-pointer text-sm font-semibold">
                  Welcome email
                  <span className="text-muted-foreground ml-2 text-xs font-normal">Optional</span>
                </summary>
                <div className="mt-3">
                  <label className={labelClass}>
                    Welcome email template
                    <textarea
                      rows={3}
                      value={values.welcomeEmail}
                      onChange={(event) => patch({ welcomeEmail: event.currentTarget.value })}
                      placeholder="Welcome to the course…"
                      className={`${fieldClass} py-2`}
                    />
                  </label>
                </div>
              </details>
              <p className="border-border text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
                Roles and class-specific enrollment can be finalized after the draft is saved. Email
                addresses are kept in the draft; only registered participants can be enrolled at
                publish time.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <div>
                <p className="text-primary text-xs font-semibold">STEP 04 · FINAL REVIEW</p>
                <h3 className="text-foreground mt-1 text-xl font-bold">Make it ready to publish</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Check your course details and preview the learner view.
                </p>
              </div>
              <section className="border-border overflow-hidden rounded-xl border">
                <div className="from-brand-900 via-brand-800 to-brand-600 bg-linear-to-br p-6 text-white">
                  <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                    {values.category || "COURSE"}
                  </p>
                  <h4 className="mt-2 text-2xl font-bold">{values.title || "Your course title"}</h4>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">
                    {values.subtitle ||
                      values.shortDescription ||
                      values.description ||
                      "Your course introduction will appear here."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/80">
                    <span className="inline-flex items-center gap-1">
                      <Globe2 aria-hidden="true" className="size-3.5" />
                      {values.language}
                    </span>
                    <span>{values.skillLevel}</span>
                    <span>{values.format.replaceAll("_", " ").toLowerCase()}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden="true" className="size-3.5" />
                      {values.participants.length} learners
                    </span>
                  </div>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-foreground text-xs font-semibold">What you’ll learn</p>
                    <p className="text-muted-foreground mt-1 text-xs whitespace-pre-line">
                      {values.learningOutcomes || "Add learning outcomes to preview them."}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-xs font-semibold">Class schedule</p>
                    {values.subjects.flatMap((subject) =>
                      subject.classes.map((classSession) => (
                        <div key={classSession.id} className="mt-2">
                          <p className="text-muted-foreground text-xs">
                            {classSession.name || "Untitled class"} ·{" "}
                            {classSession.scheduledAt
                              ? new Date(classSession.scheduledAt).toLocaleString()
                              : "Date to be announced"}
                            {classSession.endTime ? ` – ${classSession.endTime}` : ""}
                          </p>
                          {classSession.materials.length ? (
                            <ul className="mt-1 space-y-1">
                              {classSession.materials.map((material) => (
                                <li
                                  key={material.key}
                                  className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
                                >
                                  <FileText aria-hidden="true" className="size-3" />
                                  {material.title || material.file?.name || "Untitled material"}
                                  <span className="text-muted-foreground/75">
                                    ·{" "}
                                    {material.visibility === "BEFORE"
                                      ? "Before class"
                                      : "After class"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              </section>
              <div className="flex flex-wrap items-center gap-2">
                {steps.slice(0, 3).map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => void goToStep(index)}
                    className="text-primary text-xs font-semibold underline underline-offset-2"
                  >
                    Edit {item.title.toLowerCase()}
                  </button>
                ))}
              </div>

              <section className="border-border rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-foreground text-sm font-semibold">Publish checklist</h4>
                  <span className="text-muted-foreground text-xs">
                    {readyItems.filter((item) => item.ready).length}/{readyItems.length} complete
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {readyItems.map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-xs">
                      {item.ready ? (
                        <CheckCircle2 aria-hidden="true" className="text-primary size-4" />
                      ) : (
                        <Circle aria-hidden="true" className="text-muted-foreground size-4" />
                      )}
                      <span className={item.ready ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                      {!item.ready && item.label.startsWith("Class") ? (
                        <button
                          type="button"
                          onClick={() => void goToStep(1)}
                          className="text-primary ml-auto font-semibold underline"
                        >
                          Edit
                        </button>
                      ) : null}
                      {!item.ready && item.label.startsWith("Participant") ? (
                        <button
                          type="button"
                          onClick={() => void goToStep(2)}
                          className="text-primary ml-auto font-semibold underline"
                        >
                          Edit
                        </button>
                      ) : null}
                      {!item.ready && item.label.startsWith("Course") ? (
                        <button
                          type="button"
                          onClick={() => void goToStep(0)}
                          className="text-primary ml-auto font-semibold underline"
                        >
                          Edit
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {conflicts.length ? (
                  <p className="text-destructive mt-3 text-xs">{conflicts[0]}</p>
                ) : null}
              </section>

              <details className="border-border rounded-lg border p-3">
                <summary className="text-foreground cursor-pointer text-sm font-semibold">
                  Publishing options
                  <span className="text-muted-foreground ml-2 text-xs font-normal">Optional</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      Course visibility
                      <select
                        value={values.visibility}
                        onChange={(event) =>
                          patch({
                            visibility: event.currentTarget.value as CourseFormValues["visibility"],
                          })
                        }
                        className={fieldClass}
                      >
                        <option value="PUBLIC">Public</option>
                        <option value="UNLISTED">Unlisted</option>
                        <option value="PRIVATE">Private</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Schedule publication
                      <input
                        type="datetime-local"
                        value={values.scheduledPublishAt}
                        onChange={(event) =>
                          patch({ scheduledPublishAt: event.currentTarget.value })
                        }
                        className={fieldClass}
                      />
                    </label>
                    <label className="text-foreground flex items-center gap-2 text-xs sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={values.notifyParticipants}
                        onChange={(event) =>
                          patch({ notifyParticipants: event.currentTarget.checked })
                        }
                      />
                      Email participants when the course is published
                    </label>
                  </div>
                  <p className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs leading-5">
                    These preferences are saved with the draft. Automated scheduling, public
                    listings, and email delivery are not enabled in the current course backend.
                  </p>
                </div>
              </details>
            </div>
          ) : null}

          {fieldErrors.length ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive mt-5 rounded-lg border p-3 text-sm"
            >
              <p className="font-semibold">A few things need your attention</p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {fieldErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {notice ? (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive mt-4 rounded-lg border px-3 py-2 text-sm"
            >
              {notice}
            </p>
          ) : null}

          <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => void goToStep(step - 1)}
                  className="border-border text-foreground inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" /> Back
                </button>
              ) : null}
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-muted-foreground min-h-10 px-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              ) : null}
            </div>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => void goToStep(step + 1)}
                className="bg-primary text-primary-foreground inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold shadow-sm"
              >
                Continue to {steps[step + 1].title}{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving || !readyItems.every((item) => item.ready)}
                  onClick={() => {
                    publishOnSubmit.current = false;
                  }}
                  title={
                    !readyItems.every((item) => item.ready)
                      ? "Complete the course, class, materials, and participant requirements first"
                      : undefined
                  }
                  className="bg-primary text-primary-foreground inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold shadow-sm disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save course"}
                </button>
                {(!initialCourse || initialCourse.status === "DRAFT") && (
                  <button
                    type="submit"
                    disabled={saving || !canPublish}
                    onClick={() => {
                      publishOnSubmit.current = true;
                    }}
                    title={
                      !canPublish
                        ? "Complete the publish checklist and resolve schedule conflicts first"
                        : undefined
                    }
                    className="bg-brand-800 inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send aria-hidden="true" className="size-4" />{" "}
                    {saving ? "Publishing…" : "Publish now"}
                  </button>
                )}
              </div>
            )}
          </div>
          {uploadProgress !== null ? (
            <div className="mt-3 space-y-1">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Uploading course materials</span>
                <span>{uploadProgress}%</span>
              </div>
              <progress
                aria-label="Course material upload progress"
                max={100}
                value={uploadProgress}
                className="accent-primary h-2 w-full"
              />
            </div>
          ) : null}
        </section>
        <aside className="space-y-4 lg:sticky lg:top-5">
          <section className="border-border bg-card rounded-xl border p-5">
            <h3 className="text-foreground text-lg font-semibold">Course summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Days</dt>
                <dd className="text-foreground font-semibold">{values.scheduleDays.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Classes</dt>
                <dd className="text-foreground font-semibold">{classCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Teachers</dt>
                <dd className="text-foreground font-semibold">
                  {teacherCount ? `${teacherCount} assigned` : "0 assigned"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Materials</dt>
                <dd className="text-foreground font-semibold">
                  {materialCount} {materialCount === 1 ? "file" : "files"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Participants</dt>
                <dd className="text-foreground font-semibold">
                  {values.participants.length || "Not added yet"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="border-border bg-card rounded-xl border p-5">
            <h3 className="text-foreground text-lg font-semibold">Before you publish</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {readyItems.map((item, index) => (
                <li
                  key={item.label}
                  className={
                    item.ready ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                  }
                >
                  {item.ready ? "✓" : "○"} {item.label}
                  {!item.ready && (
                    <button
                      type="button"
                      onClick={() =>
                        void goToStep(index < 1 ? 0 : index < 3 ? 1 : index < 4 ? 2 : 3)
                      }
                      className="sr-only"
                    >
                      Edit
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {conflicts.length > 0 && (
              <p className="text-destructive mt-4 text-xs">{conflicts[0]}</p>
            )}
          </section>
        </aside>
      </div>
    </form>
  );
}

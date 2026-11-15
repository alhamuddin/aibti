"use client";

import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Save, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { updateOwnProfileAction } from "@/actions/profile-actions";

const fieldClass =
  "border-input bg-background text-foreground mt-2 min-h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
const textAreaClass =
  "border-input bg-background text-foreground mt-2 min-h-32 w-full resize-y rounded-xl border px-3.5 py-3 text-sm leading-6 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

function FieldCount({ value, maxLength }: { value: string; maxLength: number }) {
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {value.length}/{maxLength}
    </span>
  );
}

export function ProfileEditor({
  profile,
  userId,
}: {
  profile: {
    name: string;
    image: string | null;
    qualifications: string | null;
    achievements: string | null;
    experience: string | null;
  };
  userId: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [photoNotice, setPhotoNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const [imageUrl, setImageUrl] = useState(profile.image ?? "");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [displayName, setDisplayName] = useState(profile.name);
  const [qualifications, setQualifications] = useState(profile.qualifications ?? "");
  const [achievements, setAchievements] = useState(profile.achievements ?? "");
  const [experience, setExperience] = useState(profile.experience ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function closeDialog() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoNotice("");
    if (!new Set(["image/jpeg", "image/png"]).has(file.type)) {
      setPhotoNotice("Choose a JPG or PNG image.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoNotice("Profile photos must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    setPhotoPending(true);
    try {
      const formData = new FormData();
      formData.set("photo", file);
      const response = await fetch(`/api/profile-images/${encodeURIComponent(userId)}`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        image?: string;
        message?: string;
      } | null;
      if (!response.ok || !result?.image) {
        throw new Error(result?.message ?? "The profile photo could not be uploaded.");
      }
      setImageUrl(result.image);
      setPreviewFailed(false);
      setPhotoNotice("Profile photo updated.");
      router.refresh();
    } catch (error) {
      setPhotoNotice(
        error instanceof Error ? error.message : "The profile photo could not be uploaded.",
      );
    } finally {
      setPhotoPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoPending(true);
    setPhotoNotice("");
    try {
      const response = await fetch(`/api/profile-images/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        image?: string | null;
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(result?.message ?? "The profile photo could not be removed.");
      setImageUrl("");
      setPreviewFailed(false);
      setPhotoNotice("Profile photo removed.");
      router.refresh();
    } catch (error) {
      setPhotoNotice(
        error instanceof Error ? error.message : "The profile photo could not be removed.",
      );
    } finally {
      setPhotoPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    try {
      const result = await updateOwnProfileAction(new FormData(event.currentTarget));
      setNotice(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The profile could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors"
      >
        Edit profile <ImagePlus aria-hidden="true" className="size-4" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="profile-editor-title"
        onClose={() => setIsOpen(false)}
        className="border-border bg-card text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-2xl border p-0 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                Your profile
              </p>
              <h2
                id="profile-editor-title"
                className="text-card-foreground mt-1 text-xl font-semibold"
              >
                Edit profile
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Update your photo and professional details.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close profile editor"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <section className="border-border bg-muted/30 mb-7 flex flex-col gap-5 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-5">
            {imageUrl && !previewFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Profile photo preview"
                referrerPolicy="no-referrer"
                className="border-border bg-background size-24 shrink-0 rounded-2xl border object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <span className="bg-primary text-primary-foreground flex size-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold">
                {displayName.trim().charAt(0).toUpperCase() || (
                  <UserRound aria-hidden="true" className="size-8" />
                )}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground text-sm font-semibold">Profile photo</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                JPG or PNG, up to 2 MB. A square image works best.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  aria-label="Choose a profile photo"
                  disabled={photoPending}
                  onChange={uploadPhoto}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoPending}
                  className="border-border bg-background text-foreground hover:bg-muted inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {photoPending ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus aria-hidden="true" className="size-4" />
                  )}
                  {photoPending ? "Uploading…" : imageUrl ? "Change photo" : "Upload photo"}
                </button>
                {imageUrl ? (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoPending}
                    className="text-muted-foreground hover:text-destructive inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" /> Remove photo
                  </button>
                ) : null}
              </div>
              <p
                role="status"
                aria-live="polite"
                className="text-muted-foreground mt-2 min-h-4 text-xs"
              >
                {photoNotice}
              </p>
            </div>
          </section>

          <form onSubmit={submit} className="space-y-6">
            <label className="text-foreground block text-sm font-medium">
              Display name{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={profile.name}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                className={fieldClass}
              />
              <span className="text-muted-foreground mt-1.5 block text-xs">
                This name appears across your training workspace.
              </span>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-foreground block text-sm font-medium">
                <span className="flex items-center justify-between gap-3">
                  <span>Qualifications</span>
                  <FieldCount value={qualifications} maxLength={5000} />
                </span>
                <textarea
                  name="qualifications"
                  maxLength={5000}
                  defaultValue={profile.qualifications ?? ""}
                  onChange={(event) => setQualifications(event.target.value)}
                  placeholder="Degrees, certifications, and specialist skills"
                  className={textAreaClass}
                />
              </label>
              <label className="text-foreground block text-sm font-medium">
                <span className="flex items-center justify-between gap-3">
                  <span>Achievements</span>
                  <FieldCount value={achievements} maxLength={5000} />
                </span>
                <textarea
                  name="achievements"
                  maxLength={5000}
                  defaultValue={profile.achievements ?? ""}
                  onChange={(event) => setAchievements(event.target.value)}
                  placeholder="Awards, milestones, and notable contributions"
                  className={textAreaClass}
                />
              </label>
              <label className="text-foreground block text-sm font-medium md:col-span-2">
                <span className="flex items-center justify-between gap-3">
                  <span>Experience</span>
                  <FieldCount value={experience} maxLength={5000} />
                </span>
                <textarea
                  name="experience"
                  maxLength={5000}
                  defaultValue={profile.experience ?? ""}
                  onChange={(event) => setExperience(event.target.value)}
                  placeholder="Summarize your roles, responsibilities, and areas of expertise"
                  className={textAreaClass}
                />
              </label>
            </div>

            <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {pending ? "Saving profile…" : "Save changes"}
              </button>
              <p role="status" aria-live="polite" className="text-muted-foreground min-h-5 text-sm">
                {notice}
              </p>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

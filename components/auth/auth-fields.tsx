"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { signInAction, signUpAction } from "@/actions/auth-actions";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/lib/auth-schema";

const inputClassName =
  "block w-full rounded-xl border border-input bg-background py-3 pr-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <span role="alert" className="text-destructive mt-1.5 block text-xs font-medium">
      {message}
    </span>
  );
}

function PasswordInput({
  id,
  label,
  registration,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-foreground mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <KeyRound
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <input
          {...registration}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClassName} pr-12`}
          placeholder={label}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {error ? (
        <div id={`${id}-error`}>
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

function EmailInput({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor="email" className="text-foreground mb-2 block text-sm font-medium">
        Work email
      </label>
      <div className="relative">
        <Mail
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <input
          {...registration}
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "email-error" : undefined}
          className={inputClassName}
          placeholder="name@bank.com"
        />
      </div>
      {error ? (
        <div id="email-error">
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

function NameInput({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor="name" className="text-foreground mb-2 block text-sm font-medium">
        Full name
      </label>
      <div className="relative">
        <UserRound
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <input
          {...registration}
          id="name"
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "name-error" : undefined}
          className={inputClassName}
          placeholder="Your full name"
        />
      </div>
      {error ? (
        <div id="name-error">
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

function FormAlert({ message }: { message: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="border-destructive/25 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
    >
      {message}
    </p>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      const result = await signInAction(values, redirectTo);
      if (!result.success) setServerError(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <EmailInput registration={register("email")} error={errors.email?.message} />
      <PasswordInput
        id="password"
        label="Password"
        registration={register("password")}
        error={errors.password?.message}
        autoComplete="current-password"
      />
      <SubmitButton pending={pending} label="Sign in" />
    </form>
  );
}

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      const result = await signUpAction(values);
      if (!result.success) setServerError(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={serverError} />
      <NameInput registration={register("name")} error={errors.name?.message} />
      <EmailInput registration={register("email")} error={errors.email?.message} />
      <PasswordInput
        id="password"
        label="Password"
        registration={register("password")}
        error={errors.password?.message}
        autoComplete="new-password"
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
      />
      <p className="text-muted-foreground text-xs leading-5">
        Use at least 8 characters for your password.
      </p>
      <SubmitButton pending={pending} label="Create account" />
    </form>
  );
}

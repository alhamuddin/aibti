# Al-Arafah Islami Bank Training Institute

## Training Management System

This application supports Al-Arafah Islami Bank Training Institute (AIBTI).

- **Address:** Surma Tower (Floor-14), 59/2, Purana Paltan, Dhaka 1000
- **Phone:** 44850087-9 (PABX)
- **Email:** [training@aibl.com.bd](mailto:aibtri@aibl.com.bd)

## Database and authentication setup

The app uses Prisma 7 with PostgreSQL and the `pg` driver adapter. Copy `.env.example` to `.env`, set `DATABASE_URL` to your PostgreSQL connection string, then generate the Prisma Client:

```powershell
Copy-Item .env.example .env
npm run db:generate
```

Set `BETTER_AUTH_SECRET` to a unique random value of at least 32 characters and set `BETTER_AUTH_URL` to the canonical app URL. For local development, create a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run `npm run db:deploy` to apply the committed migrations to a new, empty database. If the auth tables already exist without Prisma migration history, do not deploy immediately: verify that their columns, indexes, and foreign keys exactly match `20261028132000_init_auth`, then mark only that migration as applied with `npx prisma migrate resolve --applied 20261028132000_init_auth` before running `npm run db:deploy`. Never use this baseline command unless that schema match has been confirmed. Use `npm run db:migrate -- --name <description>` when creating a new migration during development, and `npm run db:studio` to inspect the database.

The login flow uses Better Auth with email/password credentials only. Public self-registration is disabled: a training administrator creates accounts from **Dashboard → Users and roles**, assigns a role, and gives the employee an initial password through an approved out-of-band channel. The employee must change that password on first sign-in. Passwords must be at least 10 characters; account suspension revokes active sessions, and role changes/account status changes are recorded in the user audit log. User records are retained rather than deleted.

The supported roles are super administrator, training administrator, teacher/trainer, participant, branch manager, and auditor. Course access is checked on the server and scoped to each user's assigned courses, teaching subjects, or branch. Their permission statements are defined in `lib/permissions.ts`.

Course managers can use a previous course as a searchable template, edit course details and day-based duration, create subjects/classes, assign registered teachers and participants, attach class materials, publish drafts, and delete courses. Cover images and promo videos are uploaded to private storage under `storage/course-assets/<course id>/`; only JPG/PNG images and MP4/WebM videos up to 20 MB are accepted. Course media is streamed only to users with access to that course, and video playback supports byte-range requests. Class materials are streamed to `storage/course-materials/<course name>/<class name>/`, limited to 20 MB each, and checked against supported file signatures. Downloads require course access, resolve paths within the private storage directory, and use attachment-only responses with content sniffing disabled. Keep both directories on persistent, backed-up storage; ephemeral/serverless filesystems are not suitable for durable course media. A course can have multiple independent batches, each with its own schedule and participants. New batches copy a published batch's teachers, classes, and materials, then shift the schedule to a chosen local start date and time. The migration creates a default **Batch 1** for every existing course and preserves its schedule and enrollments. The course duration migration converts legacy hour values to days using an eight-hour training day and preserves the original `durationHours` column.

Participants and assigned teachers receive in-app notifications when a course is published, updated, assigned or unassigned, completed, or removed, and when a new batch is created for them. The dashboard bell shows the unread count and latest seven notifications; **Show all notifications** opens the complete history. Selecting a notification marks it as read and opens the related course, learning, or notifications page. Apply the `20261031210000_course_notifications` migration with `npm run db:deploy` before enabling notifications.

Participants can submit and edit an anonymous speaker evaluation for an assigned class for seven days after its scheduled end. The five weighted criteria follow the institute's speaker evaluation form. Teachers see live per-class averages for their own classes; training administrators see averages across classes. Individual submissions and identities are not exposed in evaluation results. Apply the committed `20261031133000_speaker_evaluations` migration with `npm run db:deploy` before enabling this feature.

Attendance is managed from **Dashboard → Attendance** for each published course day. An administrator can open a session starting 30 minutes before the first scheduled class, share its signed QR link, mark participants present or absent manually, and close the roster. Sessions automatically mark remaining enrolled participants absent after the last scheduled class of that day. Set a random `CRON_SECRET` (at least 32 characters) and configure your hosting scheduler to call `GET /api/attendance/close-due` at least once per minute with `Authorization: Bearer <CRON_SECRET>` for unattended automatic closing; attendance pages also close overdue sessions on access. Employee IDs are managed from **Dashboard → Users and roles** and are copied into attendance records when marked.

Attendance sessions are scoped to an individual batch and course date. Configure the scheduler with `Authorization: Bearer <CRON_SECRET>` for unattended automatic closing.

After all classes in a batch have ended, an administrator can mark an active enrollment complete. Completed enrollments receive a unique certificate number and a downloadable SVG certificate in **My learning**. Every signed-in user can view profiles; each user can edit their own display name, HTTPS profile-picture URL, qualifications, achievements, and experience. Profiles show a role badge.

Participants can submit one **Learn in the Branch** report for each completed course from **My learning**. Reports contain one or more conducted class sessions with their date, time, venue, and attendees from the participant's own branch. The default submission window is seven days from course completion; administrators can extend it before a report is submitted. Branch managers answer the default questions “Is this training effective for participants?” (Very effective, Effective, Not so effective) and “After training participants understanding on particular topics has improved?” (Improved, Unchanged, Decreased) before approving a report. Administrators can add questions and their answer choices; each report snapshots the questions available when it is submitted. Managers receive an in-app approval request. Apply the `20261031190000_learn_in_the_branch` migration with `npm run db:deploy` before enabling the module.

## Reports and analytics

The **Dashboard → Reports** page provides participant training transcripts, branch-scoped participation for branch managers, all-branch participation for administrators and auditors, and privacy-protected trainer scorecards. Participation reports support employee, course, branch, enrollment-status, and enrollment-date filters with server-side pagination. Completion history is aggregated by employee and course; “months ago” is calculated in calendar months in Asia/Dhaka. Branch reports use each employee's current branch because historical branch-at-enrollment snapshots are not stored.

Administrators can export up to 5,000 filtered participation rows as a CSV. Exports repeat the report's server-side access scope, escape spreadsheet formulas, and record the actor, filters, and row count in `report_export_log`. Apply the `20261101000100_report_export_log` migration with `npm run db:deploy` before enabling CSV exports. Exports above the row limit must be narrowed with filters; asynchronous XLSX exports, saved views, employee departments/designations, compliance-rule records, and historical branch snapshots are not yet modeled and are not represented as available reports.

For the first deployment, use a controlled database administration process (for example, Prisma Studio) to promote the institution's approved initial administrator account to `admin` before relying on the user-management screen. Record this bootstrap change through the bank's change-control process. New accounts default to the least-privilege `participant` role. Do not grant administrator access to an unverified account.

Initial passwords are entered by the creating administrator and are not emailed by this app. An email-delivered password setup link requires a configured mail provider and is not included yet. Persistent failed-login lockout and mandatory administrator/manager two-factor enrollment are also not yet implemented; rate limiting remains enabled.

The login and registration background uses a repeated, optimized transparent pattern in `public/auth-pattern.png`.

## Mock training data

The development seed regenerates the course catalogue from the supplied course titles with generated descriptions, learning outcomes, three subjects/classes per course, and text-based class exercises. It retains only the existing `alham5376@aibl.com.bd` login, leaves the first five courses as drafts, and publishes the remaining courses. Generated classes use the retained administrator as their instructor; no participant accounts or enrollments are created.

**The seed irreversibly clears application records before rebuilding them.** Run it only against a confirmed disposable development database after verifying the configured `DATABASE_URL`. It requires the existing `alham5376@aibl.com.bd` credential account and is disabled in production. Both opt-in variables are required:

```powershell
$env:TMS_ALLOW_MOCK_SEED = "true"
$env:TMS_RESET_DEV_DATABASE = "true"
npm run db:seed
Remove-Item Env:TMS_ALLOW_MOCK_SEED
Remove-Item Env:TMS_RESET_DEV_DATABASE
```

Never run this reset against a shared or production database. Generated course descriptions, schedules, and class exercises are development sample content; review and replace them before operational use.

To add the development account roster without resetting courses, run `npm run db:seed-users` only against the same disposable non-production database. It creates 60 participant (employee) accounts, 10 teacher accounts, 3 administrator accounts, 1 super administrator account, and the 226 branches listed by [AIBL's branch directory](https://www.aibl.com.bd/branches/). Branch record IDs are derived from official routing numbers. Generated emails use the `@aibl.com.bd` domain but do not represent verified mailboxes or real people; this script does not send email. All generated users are marked as mock accounts and must change the shared temporary password at first sign-in. Save the generated credential CSV outside the repository and distribute it only through an approved secure channel. The script requires `TMS_ALLOW_MOCK_SEED=true`, `TMS_CREATE_GENERATED_USERS=true`, `TMS_GENERATED_USERS_TEMP_PASSWORD`, and an absolute `TMS_GENERATED_USERS_OUTPUT_PATH` outside the repository.

Import the shared `prisma` client from `lib/prisma.ts` in server-only code. It uses a PostgreSQL connection pool and is cached across development hot reloads. Do not import it into Client Components or expose database credentials to the browser.

## Run locally

this application is running on a outside bank database, this project is in development phase, its not related to any bank of financial instituation. so feel free to edit, no need to worry about anything.

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build` to validate changes.

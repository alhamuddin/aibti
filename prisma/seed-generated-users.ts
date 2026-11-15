import "dotenv/config";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../generated/prisma/client";
import branchDirectory from "./branch-directory.json";

const databaseUrl = process.env.DATABASE_URL;
const temporaryPassword = process.env.TMS_GENERATED_USERS_TEMP_PASSWORD;
const credentialsPath = process.env.TMS_GENERATED_USERS_OUTPUT_PATH;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before creating generated accounts.");
}

if (
  process.env.TMS_ALLOW_MOCK_SEED !== "true" ||
  process.env.TMS_CREATE_GENERATED_USERS !== "true" ||
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "Generated account creation is disabled. Set TMS_ALLOW_MOCK_SEED=true and TMS_CREATE_GENERATED_USERS=true in a disposable non-production environment.",
  );
}

if (!temporaryPassword || temporaryPassword.length < 10 || temporaryPassword.length > 128) {
  throw new Error(
    "Set TMS_GENERATED_USERS_TEMP_PASSWORD to a password between 10 and 128 characters.",
  );
}
const initialPassword = temporaryPassword;

if (!credentialsPath || !isAbsolute(credentialsPath)) {
  throw new Error(
    "Set TMS_GENERATED_USERS_OUTPUT_PATH to an absolute path outside the repository.",
  );
}

const resolvedCredentialsPath = resolve(credentialsPath);
const relativeCredentialsPath = relative(resolve(process.cwd()), resolvedCredentialsPath);
const credentialsPathIsInsideRepository =
  relativeCredentialsPath === "" ||
  (!isAbsolute(relativeCredentialsPath) &&
    relativeCredentialsPath !== ".." &&
    !relativeCredentialsPath.startsWith(`..${sep}`));
if (credentialsPathIsInsideRepository) {
  throw new Error("The generated credentials file must be saved outside the repository.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const bootstrapEmail = "alham5376@aibl.com.bd";
const accountGroups = [
  { role: "participant", kind: "employee", count: 60 },
  { role: "teacher", kind: "teacher", count: 10 },
  { role: "admin", kind: "admin", count: 3 },
  { role: "super_admin", kind: "super-admin", count: 1 },
] as const;

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function getBranch(index: number) {
  const branch = branchDirectory[index];
  if (!branch) {
    throw new Error(`No official branch exists at index ${index}.`);
  }
  return branch;
}

async function seedGeneratedUsers() {
  if (branchDirectory.length !== 226) {
    throw new Error(`Expected 226 official branches; found ${branchDirectory.length}.`);
  }

  const bootstrap = await prisma.user.findUnique({
    where: { email: bootstrapEmail },
    select: { id: true, isMock: true },
  });
  if (!bootstrap || bootstrap.isMock) {
    throw new Error(`The existing non-mock ${bootstrapEmail} account is required.`);
  }

  let branchAssignmentIndex = 0;
  const users = accountGroups.flatMap(({ role, kind, count }) =>
    Array.from({ length: count }, (_, index) => {
      const sequence = String(index + 1).padStart(3, "0");
      const branch =
        role === "participant" || role === "teacher"
          ? getBranch(branchAssignmentIndex++ % branchDirectory.length)
          : null;

      return {
        id: randomUUID(),
        name: `AI Generated ${kind.replace("-", " ")} ${sequence}`,
        email: `generated.${kind.replace("-", "")}${sequence}@aibl.com.bd`,
        employeeId: `${kind.replaceAll("-", "").toUpperCase()}-${sequence}`,
        role,
        branch,
      };
    }),
  );

  const occupiedEmails = await prisma.user.findMany({
    where: { email: { in: users.map(({ email }) => email) } },
    select: { email: true },
  });
  if (occupiedEmails.length > 0) {
    throw new Error(
      `Generated account emails already exist: ${occupiedEmails.map(({ email }) => email).join(", ")}`,
    );
  }

  const existingBranches = await prisma.branch.findMany({
    where: {
      OR: [
        { id: { in: branchDirectory.map(({ id }) => id) } },
        { code: { in: branchDirectory.map(({ code }) => code) } },
      ],
    },
    select: { id: true, code: true, name: true },
  });
  const branchesById = new Map(existingBranches.map((branch) => [branch.id, branch]));
  const branchesByCode = new Map(existingBranches.map((branch) => [branch.code, branch]));
  const newBranches = branchDirectory.filter((branch) => {
    const sameId = branchesById.get(branch.id);
    const sameCode = branchesByCode.get(branch.code);
    if (
      (sameId && (sameId.code !== branch.code || sameId.name !== branch.name)) ||
      (sameCode && (sameCode.id !== branch.id || sameCode.name !== branch.name))
    ) {
      throw new Error(`Existing branch data conflicts with official branch ${branch.name}.`);
    }
    return !sameId && !sameCode;
  });

  const passwordHash = await hashPassword(initialPassword);
  const accountRows = users.map((user) => ({
    id: randomUUID(),
    accountId: user.id,
    providerId: "credential",
    userId: user.id,
    password: passwordHash,
  }));
  const auditRows = users.map((user) => ({
    actorUserId: bootstrap.id,
    targetUserId: user.id,
    action: "AI_GENERATED_USER_CREATED",
  }));
  const userRows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    branchId: user.branch?.id ?? null,
    mustChangePassword: true,
    isMock: true,
  }));

  const roster: string = [
    [
      "User ID",
      "Employee ID",
      "Name",
      "Email",
      "Role",
      "Branch code",
      "Branch ID",
      "Temporary password",
    ],
    ...users.map((user) => {
      const branch = user.branch;
      return [
        user.id,
        user.employeeId,
        user.name,
        user.email,
        user.role,
        branch?.code ?? "",
        branch?.id ?? "",
        initialPassword,
      ];
    }),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  await writeFile(resolvedCredentialsPath, `${roster}\r\n`, { flag: "wx" });

  try {
    await prisma.$transaction(async (tx) => {
      if (newBranches.length > 0) {
        await tx.branch.createMany({ data: newBranches });
      }
      await tx.user.createMany({ data: userRows });
      await tx.account.createMany({ data: accountRows });
      await tx.userAuditLog.createMany({ data: auditRows });
    });
  } catch (error) {
    try {
      await unlink(resolvedCredentialsPath);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Account creation failed and the credentials file could not be removed: ${resolvedCredentialsPath}`,
      );
    }
    throw error;
  }

  const [createdUserCount, createdAccountCount, officialBranchCount, roleCounts] =
    await Promise.all([
      prisma.user.count({ where: { email: { in: users.map(({ email }) => email) } } }),
      prisma.account.count({ where: { userId: { in: users.map(({ id }) => id) } } }),
      prisma.branch.count({ where: { id: { in: branchDirectory.map(({ id }) => id) } } }),
      prisma.user.groupBy({
        by: ["role"],
        where: { email: { in: users.map(({ email }) => email) } },
        _count: { _all: true },
      }),
    ]);

  const roleCountByName = new Map(roleCounts.map(({ role, _count }) => [role, _count._all]));
  if (
    createdUserCount !== 74 ||
    createdAccountCount !== 74 ||
    officialBranchCount !== 226 ||
    roleCountByName.get("participant") !== 60 ||
    roleCountByName.get("teacher") !== 10 ||
    roleCountByName.get("admin") !== 3 ||
    roleCountByName.get("super_admin") !== 1
  ) {
    throw new Error(
      `Generated account verification failed; credentials are saved at ${resolvedCredentialsPath}.`,
    );
  }

  console.log(
    JSON.stringify(
      {
        generatedAccounts: createdUserCount,
        roles: Object.fromEntries(roleCounts.map(({ role, _count }) => [role, _count._all])),
        officialBranches: officialBranchCount,
        newBranchRecords: newBranches.length,
        branchAssignments: users.filter(({ branch }) => branch !== null).length,
        credentialsFile: resolvedCredentialsPath,
        mustChangePasswordAtFirstSignIn: true,
      },
      null,
      2,
    ),
  );
}

seedGeneratedUsers()
  .catch((error: unknown) => {
    console.error("Generated account creation failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

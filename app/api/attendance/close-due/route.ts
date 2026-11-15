import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { closeDueAttendanceSessions } from "@/lib/attendance-service";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { message: "CRON_SECRET must be configured for scheduled attendance closing." },
      { status: 500 },
    );
  }
  const authorization = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(authorization);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const closedSessions = await closeDueAttendanceSessions();
  return NextResponse.json({ closedSessions });
}

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

export default async function ProfileRedirect() {
  const session = await requireAuthenticatedUser();
  redirect(`/dashboard/profile/${session.user.id}`);
}

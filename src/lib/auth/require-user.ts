import { redirect } from "next/navigation";
import { getCurrentProfile } from "./get-current-profile";
export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/unauthorized?reason=inactive");
  return profile;
}

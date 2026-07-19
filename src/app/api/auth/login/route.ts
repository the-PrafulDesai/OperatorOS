import { apiError, apiSuccess } from "@/lib/api-response";
import { getRoleDashboard } from "@/lib/auth/get-role-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/validations/operator";
import type { Profile } from "@/types/database";
import { safeInternalPath } from "@/validations/customer-auth";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message ?? "Check your login details.",
      400,
    );
  const { identifier, password, next } = parsed.data;
  let email = identifier.trim().toLowerCase();
  if (!identifier.includes("@")) {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("email")
      .eq("operator_code", identifier.trim().toUpperCase())
      .maybeSingle();
    if (!data)
      return apiError(
        "INVALID_CREDENTIALS",
        "The email or Operator ID and password do not match.",
        401,
      );
    email = data.email;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user)
    return apiError(
      "INVALID_CREDENTIALS",
      "The email or Operator ID and password do not match.",
      401,
    );
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();
  const profile = rawProfile as Profile | null;
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return apiError(
      "ACCOUNT_INACTIVE",
      "This account is not active. Contact your platform administrator.",
      403,
    );
  }
  if (profile.role === "OPERATOR_ADMIN") {
    const { data: membership } = await createAdminClient()
      .from("operator_members")
      .select("operators(status)")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .maybeSingle();
    const operator = membership?.operators as unknown as {
      status: string;
    } | null;
    if (!operator || operator.status !== "ACTIVE") {
      await supabase.auth.signOut();
      return apiError(
        "ACCOUNT_INACTIVE",
        "This operator account is not active. Contact your platform administrator.",
        403,
      );
    }
  }
  return apiSuccess({ redirectTo: profile.role === "CUSTOMER" ? safeInternalPath(next) : getRoleDashboard(profile.role) });
}

import { apiError, apiSuccess } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerSignupSchema, safeInternalPath } from "@/validations/customer-auth";

export async function POST(request: Request) {
  const parsed = customerSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check your details.", 400);
  const { fullName, email, phone, password, next } = parsed.data;
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone }, emailRedirectTo: `${origin}/login?next=${encodeURIComponent(safeInternalPath(next))}` } });
  if (error) return apiError("SIGNUP_FAILED", error.message.includes("registered") ? "An account already exists for this email." : "Your account could not be created.", 400);
  if (data.user && phone) await createAdminClient().from("profiles").update({ phone }).eq("id", data.user.id);
  return apiSuccess({ redirectTo: data.session ? safeInternalPath(next) : `/login?created=1&next=${encodeURIComponent(safeInternalPath(next))}`, requiresEmailConfirmation: !data.session }, 201);
}

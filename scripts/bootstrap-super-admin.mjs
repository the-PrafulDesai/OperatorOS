import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPER_ADMIN_NAME", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD"];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const email = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
const fullName = process.env.SUPER_ADMIN_NAME.trim();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found || data.users.length < 1000) return found;
    page += 1;
  }
  return undefined;
}

try {
  let user = await findUserByEmail(email);
  let created = false;
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email, password: process.env.SUPER_ADMIN_PASSWORD, email_confirm: true,
      app_metadata: { role: "SUPER_ADMIN" }, user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user; created = true;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, role: "SUPER_ADMIN" }, user_metadata: { ...user.user_metadata, full_name: fullName } });
    if (error) throw error;
    user = data.user;
  }
  const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, email, role: "SUPER_ADMIN", operator_code: null, is_active: true });
  if (profileError) throw profileError;
  if (created) await supabase.from("audit_logs").insert({ actor_user_id: user.id, action: "SUPER_ADMIN_BOOTSTRAPPED", entity_type: "profile", entity_id: user.id, metadata: { email } });
  console.log(created ? `Super Admin created successfully for ${email}.` : `Super Admin already exists; profile verified for ${email}.`);
} catch (error) {
  console.error(`Super Admin bootstrap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(1);
}

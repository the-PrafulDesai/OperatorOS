import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OperatorSummary, Profile } from "@/types/database";

const operatorSelect =
  "id,company_name,slug,status,created_at,primary_admin:profiles!operators_primary_admin_user_id_fkey(id,full_name,email,operator_code),locations(id,name,city,address,state,postal_code,country,status,is_published)";

export async function getOperators(): Promise<OperatorSummary[]> {
  const { data, error } = await createAdminClient()
    .from("operators")
    .select(operatorSelect)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OperatorSummary[];
}

export async function getOperator(id: string): Promise<OperatorSummary | null> {
  const { data, error } = await createAdminClient()
    .from("operators")
    .select(operatorSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as OperatorSummary | null;
}

export async function getDashboardData() {
  const admin = createAdminClient();
  const [
    { count: totalOperators },
    { count: activeOperators },
    { count: totalLocations },
    { count: activeAdmins },
    operators,
  ] = await Promise.all([
    admin.from("operators").select("*", { count: "exact", head: true }),
    admin
      .from("operators")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    admin.from("locations").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "OPERATOR_ADMIN")
      .eq("is_active", true),
    getOperators(),
  ]);
  return {
    metrics: {
      totalOperators: totalOperators ?? 0,
      activeOperators: activeOperators ?? 0,
      totalLocations: totalLocations ?? 0,
      activeAdmins: activeAdmins ?? 0,
    },
    recentOperators: operators.slice(0, 5),
  };
}

export async function getOperatorDashboard(userId: string) {
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("operator_members")
    .select("operator_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!member) return null;
  const [{ data: operator }, { data: assignments }, { data: profile }] =
    await Promise.all([
      admin
        .from("operators")
        .select("id,company_name,status")
        .eq("id", member.operator_id)
        .single(),
      admin
        .from("location_members")
        .select(
          "locations(id,name,city,address,state,postal_code,country,status,is_published)",
        )
        .eq("user_id", userId)
        .eq("is_active", true),
      admin.from("profiles").select("*").eq("id", userId).single(),
    ]);
  return {
    profile: profile as Profile,
    operator,
    locations: (assignments ?? [])
      .map((item) => item.locations)
      .filter(Boolean),
  };
}

import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getOperators } from "@/lib/data/operators";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOperatorSchema } from "@/validations/operator";

const slugify = (value: string) =>
  `${value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;

async function authorize() {
  const profile = await getCurrentProfile();
  return profile?.is_active && profile.role === "SUPER_ADMIN" ? profile : null;
}

export async function GET() {
  if (!(await authorize()))
    return apiError(
      "UNAUTHORIZED",
      "You do not have access to this resource.",
      403,
    );
  try {
    return apiSuccess(await getOperators());
  } catch {
    return apiError("SERVER_ERROR", "Operators could not be loaded.", 500);
  }
}

export async function POST(request: Request) {
  const actor = await authorize();
  if (!actor)
    return apiError(
      "UNAUTHORIZED",
      "You do not have access to this resource.",
      403,
    );
  const parsed = createOperatorSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message ?? "Check the form and try again.",
      400,
    );
  const input = parsed.data;
  const email = input.adminEmail.toLowerCase();
  const operatorCode = input.operatorCode.toUpperCase();
  const admin = createAdminClient();
  const [{ data: emailMatch }, { data: codeMatch }] = await Promise.all([
    admin.from("profiles").select("id").eq("email", email).maybeSingle(),
    admin
      .from("profiles")
      .select("id")
      .eq("operator_code", operatorCode)
      .maybeSingle(),
  ]);
  if (emailMatch)
    return apiError(
      "EMAIL_ALREADY_EXISTS",
      "An account already uses this email address.",
      409,
    );
  if (codeMatch)
    return apiError(
      "OPERATOR_ID_ALREADY_EXISTS",
      "This Operator ID is already in use.",
      409,
    );

  let authUserId: string | null = null;
  let operatorId: string | null = null;
  try {
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password: input.temporaryPassword,
        email_confirm: true,
        app_metadata: { role: "OPERATOR_ADMIN" },
        user_metadata: {
          full_name: input.adminFullName,
          operator_code: operatorCode,
        },
      });
    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes("already"))
        return apiError(
          "EMAIL_ALREADY_EXISTS",
          "An account already uses this email address.",
          409,
        );
      throw authError ?? new Error("User creation failed");
    }
    authUserId = authData.user.id;
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: authUserId,
        full_name: input.adminFullName,
        email,
        role: "OPERATOR_ADMIN",
        operator_code: operatorCode,
        is_active: true,
      });
    if (profileError) throw profileError;
    const { data: operator, error: operatorError } = await admin
      .from("operators")
      .insert({
        company_name: input.companyName,
        slug: slugify(input.companyName),
        status: input.status,
        primary_admin_user_id: authUserId,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (operatorError) throw operatorError;
    operatorId = operator.id;
    const { error: memberError } = await admin
      .from("operator_members")
      .insert({
        operator_id: operatorId,
        user_id: authUserId,
        role: "OPERATOR_ADMIN",
      });
    if (memberError) throw memberError;
    const { data: location, error: locationError } = await admin
      .from("locations")
      .insert({
        operator_id: operatorId,
        name: input.locationName,
        slug: slugify(input.locationName),
        city: input.city,
        address: input.address,
        state: input.state || null,
        postal_code: input.postalCode || null,
        country: input.country,
        status: "DRAFT",
        is_published: false,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (locationError) throw locationError;
    const { error: assignmentError } = await admin
      .from("location_members")
      .insert({ location_id: location.id, user_id: authUserId });
    if (assignmentError) throw assignmentError;
    await admin.from("audit_logs").insert([
      {
        actor_user_id: actor.id,
        action: "OPERATOR_CREATED",
        entity_type: "operator",
        entity_id: operatorId,
        metadata: {
          company_name: input.companyName,
          operator_code: operatorCode,
        },
      },
      {
        actor_user_id: actor.id,
        action: "INITIAL_LOCATION_CREATED",
        entity_type: "location",
        entity_id: location.id,
        metadata: { name: input.locationName, city: input.city },
      },
    ]);
    return apiSuccess(
      {
        id: operatorId,
        locationId: location.id,
        companyName: input.companyName,
        adminName: input.adminFullName,
        adminEmail: email,
        operatorCode,
        locationName: input.locationName,
      },
      201,
    );
  } catch (error) {
    console.error("Operator provisioning failed", {
      actorId: actor.id,
      authUserCreated: Boolean(authUserId),
      operatorCreated: Boolean(operatorId),
      error: error instanceof Error ? error.message : "unknown",
    });
    if (operatorId) await admin.from("operators").delete().eq("id", operatorId);
    if (authUserId) await admin.auth.admin.deleteUser(authUserId);
    return apiError(
      "PROVISIONING_FAILED",
      "The operator could not be created. No credentials were saved. Please try again.",
      500,
    );
  }
}

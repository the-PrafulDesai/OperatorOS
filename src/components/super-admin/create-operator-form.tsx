"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  createOperatorSchema,
  type CreateOperatorInput,
} from "@/validations/operator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Created = CreateOperatorInput & { id: string };
const makeCode = () => `OPR-${Math.floor(100000 + Math.random() * 900000)}`;
const makePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const values = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(values, (value) => chars[value % chars.length]).join("");
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}
function Section({
  icon: Icon,
  step,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex gap-4 border-b bg-muted/20 p-5 sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            {step}
          </p>
          <h2 className="mt-1 font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
    </section>
  );
}

export function CreateOperatorForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOperatorInput>({
    resolver: zodResolver(createOperatorSchema),
    defaultValues: {
      companyName: "",
      status: "ACTIVE",
      adminFullName: "",
      adminEmail: "",
      operatorCode: makeCode(),
      temporaryPassword: "",
      locationName: "",
      city: "",
      address: "",
      state: "",
      postalCode: "",
      country: "India",
    },
  });
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };
  const onSubmit = async (values: CreateOperatorInput) => {
    setServerError("");
    const response = await fetch("/api/super-admin/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setServerError(
        result.error?.message ?? "The operator could not be created.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCreated({
      ...values,
      adminEmail: values.adminEmail.toLowerCase(),
      operatorCode: values.operatorCode.toUpperCase(),
      id: result.data.id,
    });
    toast.success("Operator created successfully");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (created) {
    const all = `OperatorOS login details\nCompany: ${created.companyName}\nAdministrator: ${created.adminFullName}\nEmail: ${created.adminEmail}\nOperator ID: ${created.operatorCode}\nTemporary password: ${created.temporaryPassword}\nInitial location: ${created.locationName}, ${created.city}`;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="surface-card overflow-hidden">
          <div className="bg-emerald-600 p-6 text-white sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
              <Check />
            </span>
            <p className="mt-5 text-sm font-medium text-emerald-100">
              Provisioning complete
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              {created.companyName} is ready.
            </h1>
            <p className="mt-2 text-sm text-emerald-50">
              The administrator can now sign in using their email or Operator
              ID.
            </p>
          </div>
          <div className="p-5 sm:p-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Save these temporary credentials now.</strong> The
              password will not be displayed again after leaving this page.
            </div>
            <dl className="mt-6 divide-y rounded-xl border px-4">
              {[
                ["Administrator", created.adminFullName],
                ["Email", created.adminEmail],
                ["Operator ID", created.operatorCode],
                ["Temporary password", created.temporaryPassword],
                [
                  "Initial location",
                  `${created.locationName}, ${created.city}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:items-center"
                >
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd
                    className={
                      label.includes("password") || label.includes("ID")
                        ? "break-all font-mono text-sm font-semibold"
                        : "text-sm font-medium"
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => copy(created.operatorCode, "Operator ID")}
              >
                <Copy />
                Copy Operator ID
              </Button>
              <Button
                variant="outline"
                onClick={() => copy(created.temporaryPassword, "Password")}
              >
                <Copy />
                Copy password
              </Button>
              <Button onClick={() => copy(all, "Login details")}>
                <Copy />
                Copy all details
              </Button>
            </div>
            <div className="mt-8 flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setCreated(null)}>
                <RefreshCw />
                Create another
              </Button>
              <Link
                href={`/super-admin/operators/${created.id}`}
                className={buttonVariants()}
              >
                View operator
                <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <strong>Operator not created.</strong>
          <span className="ml-1">{serverError}</span>
        </div>
      )}
      <Section
        icon={Building2}
        step="Step 1 of 3"
        title="Operator company"
        description="Set up the organisation and its initial platform access state."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">
            Company name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            className="h-10"
            placeholder="e.g. Northstar Workspaces"
            aria-invalid={Boolean(errors.companyName)}
            {...register("companyName")}
          />
          <FieldError message={errors.companyName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">
            Operator status <span className="text-destructive">*</span>
          </Label>
          <select
            id="status"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/30"
            {...register("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Active operators can sign in immediately.
          </p>
        </div>
      </Section>
      <Section
        icon={UserRound}
        step="Step 2 of 3"
        title="Operator administrator"
        description="Create the primary administrator and secure sign-in credentials."
      >
        <div className="space-y-2">
          <Label htmlFor="adminFullName">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="adminFullName"
            className="h-10"
            placeholder="Administrator name"
            aria-invalid={Boolean(errors.adminFullName)}
            {...register("adminFullName")}
          />
          <FieldError message={errors.adminFullName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="adminEmail"
            type="email"
            className="h-10"
            placeholder="admin@company.com"
            aria-invalid={Boolean(errors.adminEmail)}
            {...register("adminEmail")}
          />
          <FieldError message={errors.adminEmail?.message} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="operatorCode">
              Operator ID <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() =>
                setValue("operatorCode", makeCode(), { shouldValidate: true })
              }
            >
              Generate ID
            </button>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="operatorCode"
              className="h-10 pl-9 font-mono uppercase"
              aria-invalid={Boolean(errors.operatorCode)}
              {...register("operatorCode", {
                setValueAs: (value) => value.toUpperCase(),
              })}
            />
          </div>
          <FieldError message={errors.operatorCode?.message} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="temporaryPassword">
              Temporary password <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() =>
                setValue("temporaryPassword", makePassword(), {
                  shouldValidate: true,
                })
              }
            >
              Generate password
            </button>
          </div>
          <div className="relative">
            <Input
              id="temporaryPassword"
              type={showPassword ? "text" : "password"}
              className="h-10 pr-10 font-mono"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.temporaryPassword)}
              {...register("temporaryPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <FieldError message={errors.temporaryPassword?.message} />
          <p className="text-xs text-muted-foreground">
            Shown only once after successful creation.
          </p>
        </div>
      </Section>
      <Section
        icon={MapPin}
        step="Step 3 of 3"
        title="Initial location"
        description="Assign the administrator’s first workspace location. It remains unpublished."
      >
        <div className="space-y-2">
          <Label htmlFor="locationName">
            Location name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="locationName"
            className="h-10"
            placeholder="e.g. Indiranagar Centre"
            aria-invalid={Boolean(errors.locationName)}
            {...register("locationName")}
          />
          <FieldError message={errors.locationName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            className="h-10"
            placeholder="Bengaluru"
            aria-invalid={Boolean(errors.city)}
            {...register("city")}
          />
          <FieldError message={errors.city?.message} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">
            Full address <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="address"
            className="min-h-24"
            placeholder="Building, street, neighbourhood"
            aria-invalid={Boolean(errors.address)}
            {...register("address")}
          />
          <FieldError message={errors.address?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            className="h-10"
            placeholder="Karnataka"
            {...register("state")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            className="h-10"
            placeholder="560038"
            {...register("postalCode")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-destructive">*</span>
          </Label>
          <Input id="country" className="h-10" {...register("country")} />
          <FieldError message={errors.country?.message} />
        </div>
      </Section>
      <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">Secure provisioning</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The password goes directly to Supabase Auth and is never stored in
              application tables.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/super-admin/operators"
            className={cn(
              buttonVariants({ variant: "outline" }),
              isSubmitting && "pointer-events-none opacity-50",
            )}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : undefined}
          >
            <ArrowLeft />
            Cancel
          </Link>
          <Button type="submit" className="min-w-36" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create Operator
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

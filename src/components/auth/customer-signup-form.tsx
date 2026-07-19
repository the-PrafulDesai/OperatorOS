"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerSignupSchema } from "@/validations/customer-auth";

type Values = z.infer<typeof customerSignupSchema>;
export function CustomerSignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(customerSignupSchema), defaultValues: { fullName: "", email: "", phone: "", password: "", next } });
  const submit = async (values: Values) => {
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) return setError("root", { message: result.error?.message ?? "Account creation failed." });
    router.push(result.data.redirectTo); router.refresh();
  };
  return <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-4" noValidate>
    {errors.root && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{errors.root.message}</div>}
    <Field label="Full name" error={errors.fullName?.message}><Input autoComplete="name" {...register("fullName")} /></Field>
    <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
    <Field label="Phone (optional)" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register("phone")} /></Field>
    <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
    <Button className="h-11 w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />}{isSubmitting ? "Creating account…" : "Create customer account"}</Button>
    <p className="text-center text-sm text-muted-foreground">Already registered? <Link className="font-medium text-primary hover:underline" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in</Link></p>
  </form>;
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>; }

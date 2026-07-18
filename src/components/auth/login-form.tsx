"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { loginSchema } from "@/validations/operator";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Values = z.infer<typeof loginSchema>;
export function LoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });
  const onSubmit = async (values: Values) => {
    setServerError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setServerError(
        result.error?.message ?? "Sign in could not be completed.",
      );
      return;
    }
    router.push(result.data.redirectTo);
    router.refresh();
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 space-y-5"
      noValidate
    >
      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Operator ID</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="identifier"
            className="h-11 pl-10"
            placeholder="name@company.com or OPR-123456"
            autoComplete="username"
            aria-invalid={Boolean(errors.identifier)}
            {...register("identifier")}
          />
        </div>
        {errors.identifier && (
          <p className="text-xs text-destructive">
            {errors.identifier.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            className="h-11 px-10"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>Sign in securely</>
        )}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Operator accounts can use either their email address or assigned
        Operator ID.
      </p>
    </form>
  );
}

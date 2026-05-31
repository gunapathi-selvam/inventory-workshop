"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@workshop/validators";
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, useToast } from "@workshop/ui";
import { Boxes } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    setSubmitting(false);
    if (res?.error) {
      toast.error("Login failed", "Check your email and password.");
      return;
    }
    router.push(params.get("from") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-6" />
          </div>
          <CardTitle className="text-xl">Workshop</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="Email" error={formState.errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="you@workshop.local" {...register("email")} />
            </Field>
            <Field label="Password" error={formState.errors.password?.message}>
              <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
            </Field>
            <Button type="submit" loading={submitting} className="mt-1 w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 rounded-md bg-muted p-2 text-center text-xs text-muted-foreground">
            Demo: admin@workshop.local / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary for prerendering.
export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}

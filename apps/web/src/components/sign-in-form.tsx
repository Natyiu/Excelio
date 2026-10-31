import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { EyeIcon as Eye, ViewOffIcon as EyeOff, Loading03Icon as Loader2 } from "@hugeicons/react";

import { authClient } from "@/lib/auth-client";
import { getAuthConfig } from "@/lib/actions/user";

import { Button } from "./ui/button";
import { pressable } from "./game-ui";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function SignInForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [authConfig, setAuthConfig] = useState<{
    googleEnabled: boolean;
    forgotPasswordEnabled?: boolean;
  } | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getAuthConfig().then(setAuthConfig);
  }, []);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success("Sign in successful");
          },
          onError: (error) => {
            if (error.error?.status === 403) {
              toast.error("Please verify your email before signing in. Check your inbox for the verification link.");
              return;
            }
            toast.error(error.error?.message || error.error?.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasSocial = authConfig?.googleEnabled;

  async function handleSocialLogin(provider: "google") {
    setSocialLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
      setSocialLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {hasSocial && (
        <>
          <div className="flex gap-2">
            {authConfig?.googleEnabled && (
              <button
                type="button"
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-b-4 border-border bg-card text-[15px] font-semibold transition-colors hover:bg-muted active:translate-y-0.5"
                onClick={() => handleSocialLogin("google")}
                disabled={!!socialLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {socialLoading === "google" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Continue with Google"
                )}
              </button>
            )}
          </div>
          <div className="relative flex items-center">
            <div className="h-0.5 flex-1 bg-border" />
            <span className="px-3 text-[13px] font-semibold text-muted-foreground">or</span>
            <div className="h-0.5 flex-1 bg-border" />
          </div>
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor={field.name} className="text-[13px] font-bold">
                Email
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="you@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-11 rounded-xl border-2 border-border bg-muted/40 px-4 text-[15px] shadow-none md:text-[15px] dark:bg-muted/40 focus-visible:border-brand focus-visible:bg-card focus-visible:ring-0"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-[13px] font-medium text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name} className="text-[13px] font-bold">
                  Password
                </Label>
                {authConfig?.forgotPasswordEnabled !== false && (
                  <Link
                    href={"/forgot-password" as never}
                    className="text-[13px] font-semibold text-brand hover:underline"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? "text" : "password"}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11 rounded-xl border-2 border-border bg-muted/40 px-4 text-[15px] shadow-none md:text-[15px] dark:bg-muted/40 focus-visible:border-brand focus-visible:bg-card focus-visible:ring-0 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-[13px] font-medium text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {(state) => (
            <Button
              type="submit"
              className={pressable("brand", "h-auto w-full py-3 text-base font-bold")}
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Tick01Icon as Check, ArrowRight02Icon as ChevronRight, ArrowDown02Icon as ChevronDown, LinkSquare01Icon as ExternalLink, EyeIcon as Eye, ViewOffIcon as EyeOff, Loading03Icon as Loader2, ArrowLeft01Icon as ArrowLeft, PlayIcon as Play, Cancel01Icon as X, Alert01Icon as AlertTriangle, AlertCircleIcon as AlertCircle, Wrench01Icon as Wrench } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSetupValues, saveSetup } from "@/lib/actions/setup";
import {
  connectExistingSupabaseProject,
  createSupabaseProject,
  fetchSupabaseAccount,
} from "@/lib/actions/supabase-connect";
import { connectPolarWebhook, fetchPolarOrganizations } from "@/lib/actions/polar-connect";
import type { SupabaseOrgOption, SupabaseProjectOption } from "@/types/supabase-connect";
import type { PolarOrgOption } from "@/types/polar-connect";
import type {
  StepId,
  StepDef,
  SetupWizardFormData as FormData,
  SetupWizardStepProps as StepProps,
  SetupWizardSupabaseCredentials as SupabaseCredentials,
} from "@/types/setup";

const ALL_STEPS: StepDef[] = [
  { id: "supabase", label: "Supabase (DB & Storage)", description: "Database connection and file storage", required: true },
  { id: "auth", label: "Auth", description: "OAuth, email, and auth options", required: true },
  { id: "payment", label: "Payments", description: "Polar for subscriptions & checkout" },
  { id: "review", label: "Launch", description: "Review & generate .env" },
];

const STEP_TUTORIALS: Partial<Record<StepId, { title: string; duration: string; videoUrl: string }>> = {
  supabase: {
    title: "Supabase setup (DB & Storage)",
    duration: "2:30",
    videoUrl: "https://www.youtube.com/embed/yCdNshaLcP4",
  },
  auth: {
    title: "Auth setup",
    duration: "3:00",
    videoUrl: "https://www.youtube.com/embed/oDNGVo7Jc4Q",
  },
  payment: {
    title: "Payment setup (Polar)",
    duration: "2:30",
    videoUrl: "https://www.youtube.com/embed/gZ28ejEOseo",
  },
  review: {
    title: "Review & Launch",
    duration: "1:00",
    videoUrl: "",
  },
};

const RESEND_DEFAULT_FROM = "Excelio <onboarding@resend.dev>";

/** Parse setup errors to extract friendly hints */
function parseSetupError(message: string): {
  summary: string;
  hints: string[];
  rawOutput: string;
} {
  const lower = message.toLowerCase();

  // Extract the part after "Run `pnpm db:push`" if it's a DB error
  const dbFailedMatch = message.match(/Database setup failed\. .+?\n\n([\s\S]*)/);
  const technicalOutput = dbFailedMatch ? dbFailedMatch[1]!.trim() : message;

  const hints: string[] = [];

  if (lower.includes("password") && (lower.includes("auth") || lower.includes("failed"))) {
    hints.push("Double-check your database password. Make sure you replaced [YOUR-PASSWORD] with the actual password from Supabase.");
  }
  if (lower.includes("connection refused") || lower.includes("econnrefused")) {
    hints.push("The database server couldn't be reached. Check that your Supabase project is running and the connection URL is correct.");
  }
  if (lower.includes("timeout") || lower.includes("etimedout")) {
    hints.push("Connection timed out. Your network or firewall may be blocking the connection. Try from a different network.");
  }
  if (lower.includes("ssl") || lower.includes("certificate")) {
    hints.push("SSL/TLS issue. Supabase uses SSL by default — ensure your connection string includes the correct parameters.");
  }
  if (lower.includes("does not exist") || lower.includes("unknown database")) {
    hints.push("The database name in your URL might be wrong. Supabase uses 'postgres' as the default database.");
  }
  if (lower.includes("invalid") && lower.includes("url")) {
    hints.push("The connection string format may be incorrect. Copy the Transaction and Session URLs from Supabase Dashboard → Settings → Database.");
  }
  if (lower.includes("pooler") || lower.includes("6543") || lower.includes("5432")) {
    hints.push("Use port 6543 for the Transaction URL (pooler) and port 5432 for the Session URL. Don't mix them up.");
  }
  if (lower.includes("schema") || lower.includes("migration")) {
    hints.push("There may be a schema conflict. If you've changed the database elsewhere, try running pnpm db:push from the project root in a terminal.");
  }

  // Always add the manual fix when it's a DB setup error
  if (message.includes("Database setup failed")) {
    hints.push("You can fix this by running pnpm db:push in a terminal from the project root. Your .env is already saved.");
  }

  // Default hint if we couldn't match anything specific
  if (hints.length === 0 && technicalOutput) {
    hints.push("Your .env was saved successfully. Run pnpm db:push in a terminal from the project root to see the full error and retry.");
  }

  const summary = message.includes("Database setup failed")
    ? "Database setup didn't complete, but your configuration was saved."
    : "Something went wrong while saving your setup.";

  return { summary, hints, rawOutput: technicalOutput };
}

const defaultForm: FormData = {
  databaseUrl: "",
  directUrl: "",
  databasePassword: "",
  betterAuthUrl: "http://localhost:3001",
  corsOrigin: "http://localhost:3001",
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  resendApiKey: "",
  resendFromEmail: RESEND_DEFAULT_FROM,
  googleClientId: "",
  googleClientSecret: "",
  polarAccessToken: "",
  polarOrganizationId: "",
  polarWebhookSecret: "",
  polarSandboxMode: true,
  wantGoogle: false,
  wantResend: false,
  emailVerificationEnabled: false,
  forgotPasswordEnabled: false,
};

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [currentStep, setCurrentStep] = useState<StepId>("supabase");
  const [saving, setSaving] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSetupValues().then((values) => {
      if (values && Object.keys(values).length > 0) {
        setForm((prev) => ({
          ...prev,
          ...values,
          wantResend: !!values.resendApiKey,
        }));
      }
      setLoading(false);
    });
  }, []);

  const visibleSteps = ALL_STEPS;

  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSteps.length - 1;

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const toggleSecret = useCallback((key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  function validateStep(): boolean {
    const errs: Record<string, string> = {};

    if (currentStep === "supabase") {
      if (!form.databaseUrl.trim()) errs.databaseUrl = "Required";
      else if (!form.databaseUrl.includes("postgresql") && !form.databaseUrl.includes("postgres://")) errs.databaseUrl = "Must be a PostgreSQL connection string";
      if (!form.directUrl.trim()) errs.directUrl = "Required";
      const hasPlaceholder = form.databaseUrl.includes("[YOUR-PASSWORD]") || form.directUrl.includes("[YOUR-PASSWORD]");
      if (hasPlaceholder && !form.databasePassword.trim()) errs.databasePassword = "Required when using placeholder";
      if (!form.supabaseUrl.trim()) errs.supabaseUrl = "Required";
      if (!form.supabaseServiceRoleKey.trim()) errs.supabaseServiceRoleKey = "Required";
    }

    if (currentStep === "auth") {
      if (!form.betterAuthUrl.trim()) errs.betterAuthUrl = "Required";
      if (!form.corsOrigin.trim()) errs.corsOrigin = "Required";
      if (form.wantGoogle) {
        if (!form.googleClientId.trim()) errs.googleClientId = "Required";
        if (!form.googleClientSecret.trim()) errs.googleClientSecret = "Required";
      }
      if (form.wantResend && !form.resendApiKey.trim()) errs.resendApiKey = "Required";
    }

    if (currentStep === "payment") {
      // Payment is optional - no required validation
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    if (isLast) return;
    setVideoOpen(false);
    setCurrentStep(visibleSteps[currentIndex + 1]!.id);
  }

  function goBack() {
    if (isFirst) return;
    setVideoOpen(false);
    setCurrentStep(visibleSteps[currentIndex - 1]!.id);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await saveSetup({
        databaseUrl: form.databaseUrl.trim(),
        directUrl: form.directUrl.trim(),
        databasePassword: form.databasePassword.trim() || undefined,
        betterAuthUrl: form.betterAuthUrl.trim(),
        corsOrigin: form.corsOrigin.trim(),
        supabaseUrl: form.supabaseUrl.trim() || undefined,
        supabaseAnonKey: form.supabaseAnonKey.trim() || undefined,
        supabaseServiceRoleKey: form.supabaseServiceRoleKey.trim() || undefined,
        resendApiKey: form.wantResend ? (form.resendApiKey.trim() || undefined) : undefined,
        resendFromEmail: form.wantResend ? (form.resendFromEmail.trim() || undefined) : undefined,
        googleClientId: form.wantGoogle ? (form.googleClientId.trim() || undefined) : undefined,
        googleClientSecret: form.wantGoogle ? (form.googleClientSecret.trim() || undefined) : undefined,
        emailVerificationEnabled: form.wantResend && form.emailVerificationEnabled,
        forgotPasswordEnabled: form.wantResend && form.forgotPasswordEnabled,
        polarAccessToken: form.polarAccessToken.trim() || undefined,
        polarOrganizationId: form.polarOrganizationId.trim() || undefined,
        polarWebhookSecret: form.polarWebhookSecret.trim() || undefined,
        polarSandboxMode: form.polarSandboxMode,
      });
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save .env or push database.";
      setErrors({ _form: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {visibleSteps.map((step, i) => {
              const isCurrent = step.id === currentStep;
              const isDone = i < currentIndex;
              return (
                <div key={step.id} className="flex items-center shrink-0">
                  {i > 0 && (
                    <div className={`w-4 sm:w-6 h-px mx-0.5 ${isDone ? "bg-foreground/40" : "bg-border/40"}`} />
                  )}
                  <button
                    onClick={() => {
                      if (isDone) {
                        setVideoOpen(false);
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={!isDone && !isCurrent}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] transition-colors ${
                      isCurrent
                        ? "text-foreground font-medium"
                        : isDone
                          ? "text-foreground/60 hover:text-foreground cursor-pointer"
                          : "text-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 flex items-center justify-center text-[8px] font-mono border ${
                        isDone
                          ? "bg-foreground text-background border-foreground"
                          : isCurrent
                            ? "border-foreground text-foreground"
                            : "border-border/40 text-muted-foreground/30"
                      }`}
                    >
                      {isDone ? <Check className="w-2.5 h-2.5" /> : i + 1}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="max-w-lg w-full">
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mb-1">
              Step {currentIndex + 1} of {visibleSteps.length}
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              {visibleSteps[currentIndex]!.label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? "Loading existing config…" : visibleSteps[currentIndex]!.description}
            </p>
          </div>

          {STEP_TUTORIALS[currentStep] && (
            <VideoTutorial
              tutorial={STEP_TUTORIALS[currentStep]}
              open={videoOpen}
              onToggle={() => setVideoOpen(!videoOpen)}
            />
          )}

          {currentStep === "supabase" && (
            <SupabaseStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "auth" && (
            <AuthStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "payment" && (
            <PaymentStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "review" && (
            <ReviewStep form={form} />
          )}

          {errors._form && (
            <SetupErrorDisplay
              message={errors._form}
              onDismiss={() =>
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next._form;
                  return next;
                })
              }
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isFirst}
              className="text-xs h-8 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>

            {isLast ? (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={saving}
                className="text-xs h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating .env & pushing database...
                  </>
                ) : (
                  <>
                    Generate .env & Launch
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={goNext}
                className="text-xs h-8 gap-1 bg-foreground text-background hover:bg-foreground/90"
              >
                Continue
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// -- Setup Error Display --

function SetupErrorDisplay({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const { summary, hints, rawOutput } = parseSetupError(message);

  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <div className="flex gap-3 px-4 py-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Setup needs a small fix</p>
          <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
          {hints.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {hints.map((hint, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
          {rawOutput && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 hover:underline"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? "rotate-0" : "-rotate-90"}`} />
              {showDetails ? "Hide" : "Show"} technical details
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
      {showDetails && rawOutput && (
        <div className="border-t border-amber-500/20 px-4 py-3">
          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto break-words">
            {rawOutput}
          </pre>
        </div>
      )}
    </div>
  );
}

// -- Collapsible Section --

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        {title}
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-3 pb-3 pt-2 space-y-4 border-t border-border/30">{children}</div>}
    </div>
  );
}

// -- Step Components --

function SupabaseStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  const [connected, setConnected] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  function applyCredentials(creds: {
    databaseUrl: string;
    directUrl: string;
    databasePassword: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
  }) {
    update("databaseUrl", creds.databaseUrl);
    update("directUrl", creds.directUrl);
    update("databasePassword", creds.databasePassword);
    update("supabaseUrl", creds.supabaseUrl);
    update("supabaseAnonKey", creds.supabaseAnonKey);
    update("supabaseServiceRoleKey", creds.supabaseServiceRoleKey);
    setConnected(true);
    setManualOpen(false);
  }

  return (
    <div className="space-y-4">
      {!manualOpen && (
        <SupabaseConnectPanel connected={connected} onConnected={applyCredentials} />
      )}

      {!manualOpen ? (
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="text-[10px] text-muted-foreground hover:text-foreground underline"
        >
          {connected ? "Edit connection details manually" : "Or paste connection details manually"}
        </button>
      ) : (
        !connected && (
          <button
            type="button"
            onClick={() => setManualOpen(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            Use Connect with Supabase instead
          </button>
        )
      )}

      {manualOpen && (
        <>
      <Hint>
        Configure your <strong>Supabase</strong> project for database and file storage.{" "}
        <HintLink href="https://supabase.com/dashboard">Create a project</HintLink> →{" "}
        <strong>Settings → Database</strong> for connection strings, <strong>Settings → API</strong> for keys.
        We&apos;ll create storage buckets automatically.
      </Hint>

      <CollapsibleSection title="Database" defaultOpen>
        <FieldGroup>
          <FieldLabel htmlFor="databasePassword">Database password</FieldLabel>
          <FieldHint>
            Enter your database password. We&apos;ll embed it into the URLs above when saving. Required if your URLs contain the placeholder.
          </FieldHint>
          <SecretField
            id="databasePassword"
            value={form.databasePassword}
            onChange={(v) => update("databasePassword", v)}
            show={showSecrets.databasePassword ?? false}
            onToggle={() => toggleSecret("databasePassword")}
            placeholder="Your database password"
            error={errors.databasePassword}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="databaseUrl">Transaction URL <Required /></FieldLabel>
          <FieldHint>
            Copy the <strong>Transaction</strong> connection string (port 6543) from Supabase. Paste as-is with the{" "}
            <code className="bg-muted/50 px-1 text-[9px]">[YOUR-PASSWORD]</code> placeholder.
          </FieldHint>
          <SecretField
            id="databaseUrl"
            value={form.databaseUrl}
            onChange={(v) => update("databaseUrl", v)}
            show={showSecrets.databaseUrl ?? false}
            onToggle={() => toggleSecret("databaseUrl")}
            placeholder="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
            error={errors.databaseUrl}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="directUrl">Session URL <Required /></FieldLabel>
          <FieldHint>
            Copy the <strong>Session / Direct</strong> connection string (port 5432). Paste as-is with the{" "}
            <code className="bg-muted/50 px-1 text-[9px]">[YOUR-PASSWORD]</code> placeholder.
          </FieldHint>
          <SecretField
            id="directUrl"
            value={form.directUrl}
            onChange={(v) => update("directUrl", v)}
            show={showSecrets.directUrl ?? false}
            onToggle={() => toggleSecret("directUrl")}
            placeholder="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
            error={errors.directUrl}
          />
        </FieldGroup>
      </CollapsibleSection>

      <CollapsibleSection title="Storage" defaultOpen>
        <FieldGroup>
          <FieldLabel htmlFor="supabaseUrl">Project URL <Required /></FieldLabel>
          <PlainField
            id="supabaseUrl"
            value={form.supabaseUrl}
            onChange={(v) => update("supabaseUrl", v)}
            placeholder="https://xxxxxx.supabase.co"
            error={errors.supabaseUrl}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="supabaseAnonKey">Anon / Public Key</FieldLabel>
          <FieldHint>Used on the client side for public file access.</FieldHint>
          <SecretField
            id="supabaseAnonKey"
            value={form.supabaseAnonKey}
            onChange={(v) => update("supabaseAnonKey", v)}
            show={showSecrets.supabaseAnonKey ?? false}
            onToggle={() => toggleSecret("supabaseAnonKey")}
            placeholder="eyJhbGciOi..."
            error={errors.supabaseAnonKey}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="supabaseServiceRoleKey">Service Role Key <Required /></FieldLabel>
          <FieldHint>Server-only. Used for uploads and admin operations.</FieldHint>
          <SecretField
            id="supabaseServiceRoleKey"
            value={form.supabaseServiceRoleKey}
            onChange={(v) => update("supabaseServiceRoleKey", v)}
            show={showSecrets.supabaseServiceRoleKey ?? false}
            onToggle={() => toggleSecret("supabaseServiceRoleKey")}
            placeholder="eyJhbGciOi..."
            error={errors.supabaseServiceRoleKey}
          />
        </FieldGroup>
      </CollapsibleSection>
        </>
      )}
    </div>
  );
}

const SUPABASE_REGIONS: { value: string; label: string }[] = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "eu-west-1", label: "EU West (Ireland)" },
  { value: "eu-west-2", label: "EU West (London)" },
  { value: "eu-central-1", label: "EU Central (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
];

function SupabaseConnectPanel({
  connected,
  onConnected,
}: {
  connected: boolean;
  onConnected: (creds: SupabaseCredentials) => void;
}) {
  const [pat, setPat] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [account, setAccount] = useState<{ organizations: SupabaseOrgOption[]; projects: SupabaseProjectOption[] } | null>(null);
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [orgSlug, setOrgSlug] = useState("");
  const [projectName, setProjectName] = useState("batman-app");
  const [region, setRegion] = useState("us-east-1");
  const [existingRef, setExistingRef] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [showExistingPassword, setShowExistingPassword] = useState(false);
  const [busy, setBusy] = useState<"none" | "loading-account" | "creating" | "connecting">("none");
  const [error, setError] = useState("");
  const [connectedProjectName, setConnectedProjectName] = useState("");

  async function handleFetchAccount() {
    if (!pat.trim()) return;
    setBusy("loading-account");
    setError("");
    try {
      const acc = await fetchSupabaseAccount(pat.trim());
      setAccount(acc);
      if (acc.organizations[0]) setOrgSlug(acc.organizations[0].slug);
      if (acc.projects[0]) setExistingRef(acc.projects[0].ref);
      if (acc.projects.length === 0) setMode("create");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Supabase with that token.");
    } finally {
      setBusy("none");
    }
  }

  async function handleCreate() {
    if (!orgSlug || !projectName.trim()) return;
    setBusy("creating");
    setError("");
    try {
      const result = await createSupabaseProject(pat.trim(), {
        organizationSlug: orgSlug,
        name: projectName.trim(),
        region,
      });
      setConnectedProjectName(projectName.trim());
      onConnected(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create the Supabase project.");
    } finally {
      setBusy("none");
    }
  }

  async function handleConnectExisting() {
    if (!existingRef || !existingPassword.trim()) return;
    setBusy("connecting");
    setError("");
    try {
      const result = await connectExistingSupabaseProject(pat.trim(), {
        ref: existingRef,
        password: existingPassword.trim(),
      });
      setConnectedProjectName(account?.projects.find((p) => p.ref === existingRef)?.name ?? existingRef);
      onConnected(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect to that project.");
    } finally {
      setBusy("none");
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-xs">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
        </div>
        <span className="text-foreground">
          Connected to Supabase{connectedProjectName ? ` (${connectedProjectName})` : ""}. Fields below were filled in automatically — review or edit if needed.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 p-3.5 space-y-3.5">
      <div>
        <p className="text-xs font-medium text-foreground">Connect with Supabase</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Paste a Personal Access Token — we&apos;ll fetch or create your project, database URLs, and storage keys automatically.{" "}
          <HintLink href="https://supabase.com/dashboard/account/tokens">Get a token</HintLink>
        </p>
      </div>

      {!account ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <SecretField
              id="supabasePat"
              value={pat}
              onChange={setPat}
              show={showPat}
              onToggle={() => setShowPat((s) => !s)}
              placeholder="sbp_xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <Button
            size="sm"
            onClick={handleFetchAccount}
            disabled={busy !== "none" || !pat.trim()}
            className="h-8 text-xs shrink-0 bg-foreground text-background hover:bg-foreground/90"
          >
            {busy === "loading-account" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 text-[11px] px-2.5 py-1.5 border transition-colors ${mode === "create" ? "border-foreground/30 bg-foreground/5 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:border-border/60"}`}
            >
              Create new project
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              disabled={account.projects.length === 0}
              className={`flex-1 text-[11px] px-2.5 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${mode === "existing" ? "border-foreground/30 bg-foreground/5 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:border-border/60"}`}
            >
              Use existing project
            </button>
          </div>

          {mode === "create" ? (
            <div className="space-y-2.5">
              {account.organizations.length === 0 ? (
                <p className="text-[10px] text-red-400 leading-relaxed">
                  This token isn&apos;t linked to any Supabase organization, so a new project can&apos;t be created with it. Double-check the token at{" "}
                  <HintLink href="https://supabase.com/dashboard/account/tokens">supabase.com/dashboard/account/tokens</HintLink>, or use &quot;Use existing project&quot; instead.
                </p>
              ) : (
                <Select value={orgSlug} onValueChange={setOrgSlug}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {account.organizations.map((o) => (
                      <SelectItem key={o.slug} value={o.slug} className="text-xs">
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="h-8 text-xs"
              />
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {SUPABASE_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={busy !== "none" || !orgSlug || !projectName.trim()}
                className="h-8 text-xs w-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {busy === "creating" ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating project… this can take a minute
                  </>
                ) : (
                  "Create & connect"
                )}
              </Button>
              {busy === "none" && (!orgSlug || !projectName.trim()) && (
                <p className="text-[10px] text-muted-foreground/60">
                  {!orgSlug ? "Select an organization to enable this." : "Enter a project name to enable this."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <Select value={existingRef} onValueChange={setExistingRef}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {account.projects.map((p) => (
                    <SelectItem key={p.ref} value={p.ref} className="text-xs">
                      {p.name} ({p.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>
                The Management API can&apos;t read an existing project&apos;s database password — enter it once here.
              </FieldHint>
              <SecretField
                id="existingPassword"
                value={existingPassword}
                onChange={setExistingPassword}
                show={showExistingPassword}
                onToggle={() => setShowExistingPassword((s) => !s)}
                placeholder="Database password"
              />
              <Button
                size="sm"
                onClick={handleConnectExisting}
                disabled={busy !== "none" || !existingRef || !existingPassword.trim()}
                className="h-8 text-xs w-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {busy === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>}
    </div>
  );
}

function AuthStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Configure auth options. You can enable OAuth, email, or skip and add later from Admin Dashboard.
      </p>

      <CollapsibleSection title="App URL" defaultOpen>
        <FieldGroup>
          <FieldLabel htmlFor="betterAuthUrl">App URL <Required /></FieldLabel>
          <FieldHint>Where your app runs. In development this is usually localhost:3001.</FieldHint>
          <PlainField
            id="betterAuthUrl"
            value={form.betterAuthUrl}
            onChange={(v) => {
              update("betterAuthUrl", v);
              update("corsOrigin", v);
            }}
            placeholder="http://localhost:3001"
            error={errors.betterAuthUrl}
          />
        </FieldGroup>
      </CollapsibleSection>

      <CollapsibleSection title="OAuth (Google)">
        <div className="space-y-3">
          <FeatureToggle
            title="Google"
            description="Sign in with Google"
            checked={form.wantGoogle}
            onChange={(v) => update("wantGoogle", v)}
          />
          {form.wantGoogle && (
            <div className="ml-6 space-y-4 border-l border-border/30 pl-4">
              <Hint>
                <HintLink href="https://console.cloud.google.com/apis/credentials">Google Cloud Console</HintLink> →
                Create OAuth 2.0 Client. Add redirect URI:{" "}
                <code className="bg-muted/50 px-1 text-[9px]">{form.betterAuthUrl}/api/auth/callback/google</code>
              </Hint>
              <FieldGroup>
                <FieldLabel htmlFor="googleClientId">Client ID <Required /></FieldLabel>
                <PlainField
                  id="googleClientId"
                  value={form.googleClientId}
                  onChange={(v) => update("googleClientId", v)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  error={errors.googleClientId}
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="googleClientSecret">Client Secret <Required /></FieldLabel>
                <SecretField
                  id="googleClientSecret"
                  value={form.googleClientSecret}
                  onChange={(v) => update("googleClientSecret", v)}
                  show={showSecrets.googleClientSecret ?? false}
                  onToggle={() => toggleSecret("googleClientSecret")}
                  placeholder="GOCSPX-xxxxxxxxxx"
                  error={errors.googleClientSecret}
                />
              </FieldGroup>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Email (Resend)">
        <div className="space-y-3">
          <FeatureToggle
            title="Resend"
            description="Password reset & verification emails. Skip this and your app still works — those two flows just stay off."
            checked={form.wantResend}
            onChange={(v) => {
              update("wantResend", v);
              if (!v) {
                update("emailVerificationEnabled", false);
                update("forgotPasswordEnabled", false);
              }
            }}
          />
          {form.wantResend && (
            <div className="ml-6 space-y-4 border-l border-border/30 pl-4">
              {/localhost|127\.0\.0\.1/.test(form.betterAuthUrl) && (
                <div className="flex gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                  <div>
                    <strong className="font-medium">Local development:</strong> Email (verification, password reset) may only work for the address you used to sign up for Resend, or may not be delivered at all. If you try another email and it fails, that&apos;s expected — the setup isn&apos;t broken. Use your Resend account email for testing.
                  </div>
                </div>
              )}
              <Hint>
                <HintLink href="https://resend.com/signup">Sign up at Resend</HintLink> →{" "}
                <strong>API Keys</strong> → create a key. Used for password reset and verification emails.
              </Hint>
              <FieldGroup>
                <FieldLabel htmlFor="resendApiKey">Resend API Key <Required /></FieldLabel>
                <SecretField
                  id="resendApiKey"
                  value={form.resendApiKey}
                  onChange={(v) => update("resendApiKey", v)}
                  show={showSecrets.resendApiKey ?? false}
                  onToggle={() => toggleSecret("resendApiKey")}
                  placeholder="re_xxxxxxxxxx"
                  error={errors.resendApiKey}
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="resendFromEmail">From address</FieldLabel>
                <FieldHint>
                  Default: <code className="bg-muted/50 px-1 text-[9px]">{RESEND_DEFAULT_FROM}</code>. Resend requires a verified domain —{" "}
                  <code className="bg-muted/50 px-1 text-[9px]">onboarding@resend.dev</code> is pre-verified for testing. For production, add your domain at{" "}
                  <HintLink href="https://resend.com/domains">resend.com/domains</HintLink> and use e.g.{" "}
                  <code className="bg-muted/50 px-1 text-[9px]">noreply@yourdomain.com</code>.
                </FieldHint>
                <PlainField
                  id="resendFromEmail"
                  value={form.resendFromEmail}
                  onChange={(v) => update("resendFromEmail", v)}
                  placeholder={RESEND_DEFAULT_FROM}
                  error={errors.resendFromEmail}
                />
              </FieldGroup>
              <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium">Email verification</p>
                  <p className="text-[10px] text-muted-foreground">Require users to verify their email before accessing the app</p>
                </div>
                <Switch
                  checked={form.emailVerificationEnabled}
                  onCheckedChange={(v) => update("emailVerificationEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium">Forgot password</p>
                  <p className="text-[10px] text-muted-foreground">Show &quot;Forgot?&quot; link on login and send reset emails.</p>
                </div>
                <Switch
                  checked={form.forgotPasswordEnabled}
                  onCheckedChange={(v) => update("forgotPasswordEnabled", v)}
                />
              </div>
            </div>
          )}
          <div className="border border-dashed border-border/40 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
              You can change these later in <strong>Admin → Features</strong> and <strong>Admin → API Keys</strong>.
            </p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function PaymentStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  const [connected, setConnected] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  function applyCredentials(creds: { polarAccessToken: string; polarOrganizationId: string; polarWebhookSecret: string }) {
    update("polarAccessToken", creds.polarAccessToken);
    update("polarOrganizationId", creds.polarOrganizationId);
    update("polarWebhookSecret", creds.polarWebhookSecret);
    setConnected(true);
    setManualOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
        <Label htmlFor="polarSandboxMode" className="text-xs font-medium">
          Sandbox mode
        </Label>
        <Switch
          id="polarSandboxMode"
          checked={form.polarSandboxMode}
          onCheckedChange={(v) => update("polarSandboxMode", v)}
        />
      </div>

      {!manualOpen && (
        <PolarConnectPanel
          connected={connected}
          sandbox={form.polarSandboxMode}
          webhookUrl={`${form.betterAuthUrl}/api/webhooks/polar`}
          onConnected={applyCredentials}
        />
      )}

      {!manualOpen ? (
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="text-[10px] text-muted-foreground hover:text-foreground underline"
        >
          {connected ? "Edit credentials manually" : "Or paste credentials manually"}
        </button>
      ) : (
        !connected && (
          <button
            type="button"
            onClick={() => setManualOpen(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            Use Connect with Polar instead
          </button>
        )
      )}

      {manualOpen && (
        <>
          <Hint>
            <HintLink href={form.polarSandboxMode ? "https://sandbox.polar.sh" : "https://polar.sh/dashboard"}>
              {form.polarSandboxMode ? "Sandbox Dashboard" : "Polar Dashboard"}
            </HintLink>{" "}
            → Settings → Access Tokens. Create an <strong>Organization Access Token</strong> with{" "}
            <code className="bg-muted/50 px-1 text-[9px]">products:read</code> and{" "}
            <code className="bg-muted/50 px-1 text-[9px]">products:write</code>.
            Use sandbox for testing.
          </Hint>

          <CollapsibleSection title="Credentials" defaultOpen>
            <FieldGroup>
              <FieldLabel htmlFor="polarAccessToken">
                Access Token <Required />
              </FieldLabel>
              <SecretField
                id="polarAccessToken"
                value={form.polarAccessToken}
                onChange={(v) => update("polarAccessToken", v)}
                show={showSecrets.polarAccessToken ?? false}
                onToggle={() => toggleSecret("polarAccessToken")}
                placeholder="polar_at_xxxxxxxxxx"
                error={errors.polarAccessToken}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="polarOrganizationId">Organization ID</FieldLabel>
              <FieldHint>Optional when using an Organization Access Token.</FieldHint>
              <PlainField
                id="polarOrganizationId"
                value={form.polarOrganizationId}
                onChange={(v) => update("polarOrganizationId", v)}
                placeholder="UUID from Polar dashboard"
                error={errors.polarOrganizationId}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="polarWebhookSecret">Webhook Secret</FieldLabel>
              <FieldHint>From Polar → Webhooks. Required for subscription sync.</FieldHint>
              <SecretField
                id="polarWebhookSecret"
                value={form.polarWebhookSecret}
                onChange={(v) => update("polarWebhookSecret", v)}
                show={showSecrets.polarWebhookSecret ?? false}
                onToggle={() => toggleSecret("polarWebhookSecret")}
                placeholder="From Polar Dashboard → Webhooks"
                error={errors.polarWebhookSecret}
              />
            </FieldGroup>
            <div className="border border-dashed border-border/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                Webhook URL: <code className="bg-muted/50 px-1 text-[9px]">{form.betterAuthUrl}/api/webhooks/polar</code>.
                For local dev, use ngrok. Configure in Polar → Webhooks.
              </p>
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

function PolarConnectPanel({
  connected,
  sandbox,
  webhookUrl,
  onConnected,
}: {
  connected: boolean;
  sandbox: boolean;
  webhookUrl: string;
  onConnected: (creds: { polarAccessToken: string; polarOrganizationId: string; polarWebhookSecret: string }) => void;
}) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [orgs, setOrgs] = useState<PolarOrgOption[] | null>(null);
  const [orgId, setOrgId] = useState("");
  const [url, setUrl] = useState(webhookUrl);
  const [busy, setBusy] = useState<"none" | "loading-orgs" | "connecting">("none");
  const [error, setError] = useState("");
  const [connectedOrgName, setConnectedOrgName] = useState("");

  async function handleFetchOrgs() {
    if (!token.trim()) return;
    setBusy("loading-orgs");
    setError("");
    try {
      const result = await fetchPolarOrganizations(token.trim(), sandbox);
      setOrgs(result);
      if (result[0]) setOrgId(result[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Polar with that token.");
    } finally {
      setBusy("none");
    }
  }

  async function handleConnect() {
    if (!orgId || !url.trim()) return;
    setBusy("connecting");
    setError("");
    try {
      const { webhookSecret } = await connectPolarWebhook(token.trim(), sandbox, {
        organizationId: orgId,
        url: url.trim(),
      });
      setConnectedOrgName(orgs?.find((o) => o.id === orgId)?.name ?? "");
      onConnected({ polarAccessToken: token.trim(), polarOrganizationId: orgId, polarWebhookSecret: webhookSecret });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register the webhook with Polar.");
    } finally {
      setBusy("none");
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-xs">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
        </div>
        <span className="text-foreground">
          Connected to Polar{connectedOrgName ? ` (${connectedOrgName})` : ""}. Access token, org, and webhook secret were filled in automatically.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 p-3.5 space-y-3.5">
      <div>
        <p className="text-xs font-medium text-foreground">Connect with Polar</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Paste an {sandbox ? "sandbox" : "production"} access token — we&apos;ll find your organization and register the webhook automatically.{" "}
          <HintLink href={sandbox ? "https://sandbox.polar.sh/dashboard" : "https://polar.sh/dashboard"}>
            Get a token
          </HintLink>
        </p>
      </div>

      {!orgs ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <SecretField
              id="polarConnectToken"
              value={token}
              onChange={setToken}
              show={showToken}
              onToggle={() => setShowToken((s) => !s)}
              placeholder="polar_at_xxxxxxxxxx"
            />
          </div>
          <Button
            size="sm"
            onClick={handleFetchOrgs}
            disabled={busy !== "none" || !token.trim()}
            className="h-8 text-xs shrink-0 bg-foreground text-background hover:bg-foreground/90"
          >
            {busy === "loading-orgs" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orgs.length === 0 ? (
            <p className="text-[10px] text-red-400 leading-relaxed">
              This token isn&apos;t linked to any Polar organization. Double-check it was created in{" "}
              {sandbox ? "sandbox" : "production"} mode and has the right scopes.
            </p>
          ) : (
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-xs">
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FieldGroup>
            <FieldLabel htmlFor="polarWebhookUrl">Webhook URL</FieldLabel>
            <FieldHint>Where Polar sends events.</FieldHint>
            <PlainField id="polarWebhookUrl" value={url} onChange={setUrl} placeholder={webhookUrl} />
          </FieldGroup>

          {/localhost|127\.0\.0\.1/.test(url) && (
            <div className="flex gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
              <div className="space-y-1.5">
                <p>
                  <strong className="font-medium">Local development:</strong> Polar&apos;s servers can&apos;t reach{" "}
                  <code className="bg-muted/50 px-1 text-[9px]">localhost</code> — you need a tunnel first, or webhooks won&apos;t arrive.
                </p>
                <ol className="list-decimal ml-3.5 space-y-1">
                  <li>
                    Start one:{" "}
                    <code className="bg-muted/50 px-1 text-[9px]">ngrok http 3001</code> or{" "}
                    <code className="bg-muted/50 px-1 text-[9px]">cloudflared tunnel --url http://localhost:3001</code>
                  </li>
                  <li>Copy the public https URL it gives you</li>
                  <li>
                    Paste it above ending in{" "}
                    <code className="bg-muted/50 px-1 text-[9px]">/api/webhooks/polar</code>, then click connect below
                  </li>
                </ol>
                <p className="text-amber-700/70 dark:text-amber-400/70">
                  Free ngrok URLs change on every restart — re-run this step (or update the webhook URL in the Polar dashboard) each time you restart the tunnel.
                </p>
              </div>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={busy !== "none" || !orgId || !url.trim()}
            className="h-8 text-xs w-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            {busy === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Register webhook & connect"}
          </Button>
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>}
    </div>
  );
}

function ReviewStep({ form }: { form: FormData }) {
  const authItems: { label: string; value: string; masked?: boolean }[] = [
    { label: "App URL", value: form.betterAuthUrl },
  ];
  if (form.wantResend) {
    authItems.push({ label: "Resend API Key", value: form.resendApiKey, masked: true });
    authItems.push({ label: "Resend From", value: form.resendFromEmail });
    authItems.push({ label: "Email verification", value: form.emailVerificationEnabled ? "Yes" : "No" });
    authItems.push({ label: "Forgot password", value: form.forgotPasswordEnabled ? "Yes" : "No" });
  } else {
    authItems.push({ label: "Resend (email)", value: "Skipped" });
  }
  if (form.wantGoogle) authItems.push({ label: "Google Client ID", value: form.googleClientId });

  const sections: { title: string; items: { label: string; value: string; masked?: boolean }[] }[] = [
    {
      title: "Supabase (DB & Storage)",
      items: [
        { label: "Transaction URL", value: form.databaseUrl, masked: true },
        { label: "Session URL", value: form.directUrl, masked: true },
        { label: "Project URL", value: form.supabaseUrl },
        { label: "Service Role Key", value: form.supabaseServiceRoleKey, masked: true },
      ],
    },
    { title: "Auth", items: authItems },
  ];

  if (form.polarAccessToken) {
    sections.push({
      title: "Payments",
      items: [
        { label: "Polar Access Token", value: form.polarAccessToken, masked: true },
        { label: "Sandbox Mode", value: form.polarSandboxMode ? "Yes" : "No" },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2.5">
        <p className="text-[11px] font-medium text-foreground mb-0.5">First account = admin</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          The first user to sign up will automatically be an admin with full access to the dashboard, users, and settings.
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Review your configuration. Clicking <strong>Generate .env & Launch</strong> will create your{" "}
        <code className="bg-muted/50 px-1 text-[9px]">apps/web/.env</code> file and push the database schema.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="border border-border/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
            {section.title}
          </p>
          <div className="space-y-1.5">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted-foreground shrink-0">{item.label}</span>
                <span className="text-[10px] font-mono text-foreground/60 truncate max-w-[200px]">
                  {item.value ? (item.masked ? maskValue(item.value) : item.value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="border border-dashed border-border/40 px-3 py-2.5 mt-2">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          The wizard will generate your .env, push the schema to your database, then you can run{" "}
          <code className="bg-muted/50 px-1 text-[9px]">pnpm dev</code> to start.
        </p>
      </div>
    </div>
  );
}

// -- Shared UI Primitives --

function FeatureToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors text-left cursor-pointer ${
        checked
          ? "border-foreground/20 bg-foreground/3"
          : "border-border/40 hover:border-border/60"
      }`}
    >
      <div
        className={`w-4 h-4 flex items-center justify-center border shrink-0 ${
          checked
            ? "bg-foreground border-foreground text-background"
            : "border-border/60"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-[11px] font-medium">
      {children}
    </Label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{children}</p>;
}

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 border border-border/30 px-3 py-2.5 text-[10px] text-muted-foreground leading-relaxed">
      {children}
    </div>
  );
}

function HintLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline inline-flex items-center gap-0.5 text-foreground/70 hover:text-foreground"
    >
      {children}
      <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );
}

function PlainField({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-8 text-xs font-mono ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function SecretField({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-8 text-xs pr-8 font-mono ${error ? "border-red-400" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function maskValue(val: string): string {
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}

function VideoTutorial({
  tutorial,
  open,
  onToggle,
}: {
  tutorial: { title: string; duration: string; videoUrl: string };
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-5">
      {!open ? (
        <button
          type="button"
          onClick={onToggle}
          className="group w-full flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 hover:border-foreground/20 px-3 py-2.5 text-left transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 shrink-0 rounded border border-border/40 bg-foreground/5 group-hover:bg-foreground/10 flex items-center justify-center transition-colors">
            <Play className="w-4 h-4 ml-0.5 text-foreground/60 group-hover:text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
              Video tutorial
            </p>
            <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground">
              {tutorial.title}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground/50 shrink-0">{tutorial.duration}</span>
        </button>
      ) : (
        <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Play className="w-2.5 h-2.5 text-foreground/40" />
              <span className="text-[10px] font-medium text-foreground/70">{tutorial.title}</span>
              <span className="text-[9px] text-muted-foreground/40">{tutorial.duration}</span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Video embed or placeholder */}
          <div className="relative bg-foreground/3 aspect-video">
            {tutorial.videoUrl ? (
              <iframe
                src={tutorial.videoUrl}
                title={tutorial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0">
                  <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="vidDots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="6" cy="6" r="0.5" className="fill-foreground/10" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#vidDots)" />
                  </svg>
                </div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-foreground/20 ml-0.5" />
                  </div>
                  <p className="text-[9px] text-muted-foreground/30">
                    Video tutorial coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

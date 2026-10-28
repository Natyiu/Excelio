"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EyeIcon as Eye, ViewOffIcon as EyeOff } from "@hugeicons/react";

import { getApiKeys, saveApiKeys } from "@/lib/actions/api-keys";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ApiKeysSkeleton } from "@/components/skeletons";
import type { ApiKeysData } from "@/types/admin-api-keys";

const emptyKeys: ApiKeysData = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  resendApiKey: "",
  resendFromEmail: "",
  googleClientId: "",
  googleClientSecret: "",
  polarAccessToken: "",
  polarOrganizationId: "",
  polarWebhookSecret: "",
  polarSandboxMode: true,
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeysData | null>(null);
  const [form, setForm] = useState<ApiKeysData>(emptyKeys);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getApiKeys().then((k) => {
      setKeys(k);
      setForm(k);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveApiKeys(form);
      const fresh = await getApiKeys();
      setKeys(fresh);
      setForm(fresh);
      setShowSecrets({});
      toast.success("API keys saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof ApiKeysData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleShow(field: string) {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  if (loading) return <ApiKeysSkeleton />;

  const changed = keys && JSON.stringify(form) !== JSON.stringify(keys);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">API Keys</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure third-party service credentials. Stored securely, never
          exposed to users.
        </p>
      </div>

      <div className="space-y-8">
        {/* Supabase */}
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold">Supabase</p>
            <p className="text-[10px] text-muted-foreground">
              File uploads, avatars, attachments.{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Dashboard
              </a>{" "}
              → Settings → API.
            </p>
          </div>
          <PlainInput
            id="supabaseUrl"
            label="Project URL"
            value={form.supabaseUrl}
            onChange={(v) => update("supabaseUrl", v)}
            placeholder="https://xxxxx.supabase.co"
          />
          <SecretInput
            id="supabaseAnonKey"
            label="Anon / Public Key"
            value={form.supabaseAnonKey}
            onChange={(v) => update("supabaseAnonKey", v)}
            show={showSecrets.supabaseAnonKey ?? false}
            onToggleShow={() => toggleShow("supabaseAnonKey")}
            placeholder="eyJhbGciOi..."
          />
          <SecretInput
            id="supabaseServiceRoleKey"
            label="Service Role Key"
            value={form.supabaseServiceRoleKey}
            onChange={(v) => update("supabaseServiceRoleKey", v)}
            show={showSecrets.supabaseServiceRoleKey ?? false}
            onToggleShow={() => toggleShow("supabaseServiceRoleKey")}
            placeholder="eyJhbGciOi..."
          />
        </section>

        <Separator className="opacity-20" />

        {/* Resend */}
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold">Resend</p>
            <p className="text-[10px] text-muted-foreground">
              Password reset, email verification, invitations.
            </p>
          </div>
          <SecretInput
            id="resendApiKey"
            label="API Key"
            value={form.resendApiKey}
            onChange={(v) => update("resendApiKey", v)}
            show={showSecrets.resendApiKey ?? false}
            onToggleShow={() => toggleShow("resendApiKey")}
            placeholder="re_xxxxxxxxxx"
          />
          <PlainInput
            id="resendFromEmail"
            label="From Email"
            value={form.resendFromEmail}
            onChange={(v) => update("resendFromEmail", v)}
            placeholder="noreply@yourdomain.com"
          />
        </section>

        <Separator className="opacity-20" />

        {/* Google */}
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold">Google OAuth</p>
            <p className="text-[10px] text-muted-foreground">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Cloud Console
              </a>
              . Redirect URI:{" "}
              <code className="text-[9px] bg-muted px-1">
                {typeof window !== "undefined"
                  ? window.location.origin
                  : ""}
                /api/auth/callback/google
              </code>
            </p>
          </div>
          <PlainInput
            id="googleClientId"
            label="Client ID"
            value={form.googleClientId}
            onChange={(v) => update("googleClientId", v)}
            placeholder="xxxx.apps.googleusercontent.com"
          />
          <SecretInput
            id="googleClientSecret"
            label="Client Secret"
            value={form.googleClientSecret}
            onChange={(v) => update("googleClientSecret", v)}
            show={showSecrets.googleClientSecret ?? false}
            onToggleShow={() => toggleShow("googleClientSecret")}
            placeholder="GOCSPX-xxxxxxxxxx"
          />
        </section>

        <Separator className="opacity-20" />

        {/* Polar */}
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold">Polar</p>
            <p className="text-[10px] text-muted-foreground">
              Payments, subscriptions, SaaS pricing.{" "}
              <a
                href={form.polarSandboxMode ? "https://sandbox.polar.sh" : "https://polar.sh/dashboard"}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {form.polarSandboxMode ? "Sandbox Dashboard" : "Polar Dashboard"}
              </a>{" "}
              → Settings → Access Tokens. Create an Organization Access Token with{" "}
              <code className="text-[9px] bg-muted px-0.5">products:read</code> and{" "}
              <code className="text-[9px] bg-muted px-0.5">products:write</code>.
              Use sandbox tokens only with Sandbox mode enabled.
            </p>
          </div>
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
          <SecretInput
            id="polarAccessToken"
            label="Access Token"
            value={form.polarAccessToken}
            onChange={(v) => update("polarAccessToken", v)}
            show={showSecrets.polarAccessToken ?? false}
            onToggleShow={() => toggleShow("polarAccessToken")}
            placeholder="polar_at_xxxxxxxxxx"
          />
          <PlainInput
            id="polarOrganizationId"
            label="Organization ID"
            value={form.polarOrganizationId}
            onChange={(v) => update("polarOrganizationId", v)}
            placeholder="UUID from Polar dashboard"
          />
          <SecretInput
            id="polarWebhookSecret"
            label="Webhook Secret"
            value={form.polarWebhookSecret}
            onChange={(v) => update("polarWebhookSecret", v)}
            show={showSecrets.polarWebhookSecret ?? false}
            onToggleShow={() => toggleShow("polarWebhookSecret")}
            placeholder="From Polar Dashboard → Webhooks"
          />
          <p className="text-[9px] text-muted-foreground">
            Webhook URL:{" "}
            <code className="bg-muted px-0.5">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/webhooks/polar`
                : "https://your-domain.com/api/webhooks/polar"}
            </code>
            {" "}— For local dev, use your ngrok URL (e.g. https://xxx.ngrok-free.app/api/webhooks/polar). Configure in{" "}
            {form.polarSandboxMode ? "sandbox.polar.sh" : "polar.sh"} → Organization → Webhooks.
          </p>
        </section>

        <Separator className="opacity-20" />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            <code className="bg-muted px-0.5">.env</code> values are used as
            fallback.
          </p>
          <Button onClick={handleSave} disabled={saving || !changed} size="sm">
            {saving ? "Saving..." : "Save Keys"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlainInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}

function SecretInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px] text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.includes("••••")) onChange("");
          }}
          placeholder={placeholder}
          className="h-8 text-xs pr-8 font-mono"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

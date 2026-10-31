"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera01Icon as Camera, Loading03Icon as Loader2, UserIcon as User } from "@hugeicons/react";
import { pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";
import { Field, SettingsCard, fieldClass } from "./settings-ui";

import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/lib/actions/user";
import { uploadFile } from "@/lib/supabase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileSettingsSkeleton } from "@/components/skeletons";

export default function ProfileSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  if (isPending) return <ProfileSettingsSkeleton />;
  if (!session) return null;

  if (!initialized) {
    setName(session.user.name ?? "");
    setBio((session.user as Record<string, unknown>).bio as string ?? "");
    setAvatarUrl(session.user.image ?? "");
    setInitialized(true);
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${session!.user.id}.${ext}`;
      const result = await uploadFile("avatars", path, file);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(result.url);
      await updateProfile({ image: result.url });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name, bio, image: avatarUrl || undefined });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Photo */}
      <SettingsCard icon={Camera} colour="#db2777" title="Profile photo" hint="Shown on your profile and the leaderboard.">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative shrink-0 cursor-pointer"
            disabled={uploading}
            aria-label="Change photo"
          >
            <Avatar className="h-24 w-24 border-4 border-brand-soft">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-brand-soft text-2xl font-bold text-brand">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-card bg-brand text-brand-foreground shadow-[0_2px_0_var(--brand-deep)] transition-transform group-hover:scale-105">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className="min-w-0 space-y-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={pressable("outline", "px-4 py-2 text-sm")}
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <p className="text-[13px] text-muted-foreground">Square image, at least 200×200px. Max 5MB, JPG, PNG or WebP.</p>
          </div>
        </div>
      </SettingsCard>

      {/* Details */}
      <SettingsCard
        icon={User}
        colour="#1d9a52"
        title="About you"
        hint="Your name and bio are visible to other learners."
        footer={
          <button type="button" onClick={handleSave} disabled={saving} className={pressable("brand", "px-6")}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        }
      >
        <Field id="name" label="Name">
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={fieldClass} />
        </Field>
        <Field id="email" label="Email" note="Your email can't be changed here.">
          <input id="email" value={session.user.email} disabled className={fieldClass} />
        </Field>
        <Field id="bio" label="Bio">
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other learners a little about yourself..."
            rows={3}
            className={cn(fieldClass, "h-auto resize-none py-3")}
          />
        </Field>
      </SettingsCard>
    </div>
  );
}

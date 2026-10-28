"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loading03Icon as Loader2 } from "@hugeicons/react";

import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/lib/actions/user";
import { uploadFile } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="max-w-md space-y-8">
      {/* Avatar */}
      <section>
        <SectionHeader title="Avatar" description="Click to upload a new profile picture." />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
            disabled={uploading}
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs font-bold bg-muted text-foreground/60">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-3 w-3 text-white animate-spin" />
              ) : (
                <span className="text-white text-[9px] font-medium">Edit</span>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="text-[10px] text-muted-foreground/50 space-y-0.5">
            <p>Square image, at least 200×200px.</p>
            <p>Max 5MB. JPG, PNG, or WebP.</p>
          </div>
        </div>
      </section>

      {/* Profile info */}
      <section>
        <SectionHeader title="Profile" description="Your name and bio visible to others." />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[11px]">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px]">Email</Label>
            <Input
              id="email"
              value={session.user.email}
              disabled
              className="h-8 text-xs opacity-50"
            />
            <p className="text-[9px] text-muted-foreground/40">
              Email cannot be changed here.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-[11px]">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="text-xs h-8 bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3 pb-2 border-b border-border/30">
      <h3 className="text-xs font-semibold">{title}</h3>
      <p className="text-[10px] text-muted-foreground/50 mt-0.5">{description}</p>
    </div>
  );
}

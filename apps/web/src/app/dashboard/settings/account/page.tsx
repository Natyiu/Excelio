"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Alert02Icon as Alert,
  Delete02Icon as Trash,
  Loading03Icon as Loader2,
  SecurityLockIcon as Lock,
  SmartPhone01Icon as Device,
  Tick02Icon as Tick,
} from "@hugeicons/react";
import { pressable } from "@/components/game-ui";

import { authClient } from "@/lib/auth-client";
import { deleteMyAccount } from "@/lib/actions/account";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AccountSettingsSkeleton } from "@/components/skeletons";
import { Field, SettingsCard, fieldClass } from "../settings-ui";

export default function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isPending) return <AccountSettingsSkeleton />;
  if (!session) return null;

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const result = await deleteMyAccount();
      if (!result.ok) {
        toast.error(result.error);
        setDeleting(false);
        return;
      }
      // The account is gone; clear this browser's session and leave.
      await authClient.signOut().catch(() => {});
      toast.success("Your account and all its data have been deleted.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }

  const passwordFields = [
    { id: "currentPassword", label: "Current password", value: currentPassword, set: setCurrentPassword, placeholder: "" },
    { id: "newPassword", label: "New password", value: newPassword, set: setNewPassword, placeholder: "At least 8 characters" },
    { id: "confirmPassword", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, placeholder: "" },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={Lock}
        colour="#0284c7"
        title="Password"
        hint="Use a strong password you don't use anywhere else."
        footer={
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword}
            className={pressable("brand", "px-6")}
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </button>
        }
      >
        {passwordFields.map((f) => (
          <Field key={f.id} id={f.id} label={f.label}>
            <input
              id={f.id}
              type="password"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className={fieldClass}
            />
          </Field>
        ))}
      </SettingsCard>

      <SettingsCard icon={Device} colour="#7c3aed" title="Sessions" hint="Devices signed in to your account.">
        <div className="flex items-center gap-4 rounded-xl border-2 border-border px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Tick className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">This device</p>
            <p className="truncate text-[13px] text-muted-foreground">
              {session.session.ipAddress ?? "Unknown IP"} · {session.session.userAgent?.split(" ")[0] ?? "Unknown device"}
            </p>
          </div>
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
            Active
          </span>
        </div>
      </SettingsCard>

      <SettingsCard icon={Alert} colour="#e11d48" title="Danger zone" hint="These actions can't be undone." danger>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold">Delete account</p>
            <p className="text-[13px] text-muted-foreground">Removes your account, progress, XP and badges for good.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={pressable("danger", "px-5 py-2 text-sm")}>
                <Trash className="h-4 w-4" />
                Delete account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&apos;t be undone. Your account and all of your progress will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
                  {deleting ? "Deleting…" : "Delete account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsCard>
    </div>
  );
}

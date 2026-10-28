"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loading03Icon as Loader2 } from "@hugeicons/react";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
    try {
      await authClient.deleteUser();
      toast.success("Account deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete account");
    }
  }

  return (
    <div className="max-w-md space-y-8">
      {/* Change password */}
      <section>
        <SectionHeader title="Password" description="Update your password to keep your account secure." />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-[11px]">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-[11px]">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[11px]">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword}
              size="sm"
              className="text-xs h-8 bg-foreground text-background hover:bg-foreground/90"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Active sessions */}
      <section>
        <SectionHeader title="Sessions" description="Manage your active sessions." />
        <div className="flex items-center justify-between border border-border/40 px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium">Current Session</p>
            <p className="text-[10px] text-muted-foreground/50">
              {session.session.ipAddress ?? "Unknown IP"} &middot;{" "}
              {session.session.userAgent?.split(" ")[0] ?? "Unknown device"}
            </p>
          </div>
          <span className="text-[9px] font-medium text-green-500/80">Active</span>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <div className="mb-3 pb-2 border-b border-red-400/20">
          <h3 className="text-xs font-semibold text-red-400">Danger Zone</h3>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            Irreversible actions. Proceed with caution.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="text-xs h-8">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This action cannot be undone. This will permanently delete
                your account and remove all of your data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="text-xs h-8">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Mail01Icon as Mail, Tick01Icon as Check, Cancel01Icon as X } from "@hugeicons/react";

import { authClient } from "@/lib/auth-client";

import { EmptyState, IconTile, PageHeader, Panel, pressable } from "@/components/game-ui";
import { InvitationsSkeleton } from "@/components/skeletons";
import type { Invitation } from "@/types/dashboard-invitations";

export default function InvitationsPage() {
  const [isPending, startTransition] = useTransition();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      const { data } = await authClient.organization.listInvitations();
      setInvitations(
        ((data as unknown as Invitation[]) ?? []).filter(
          (i) => i.status === "pending",
        ),
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(invitationId: string) {
    startTransition(async () => {
      try {
        await authClient.organization.acceptInvitation({ invitationId });
        toast.success("Invitation accepted");
        loadInvitations();
      } catch {
        toast.error("Failed to accept invitation");
      }
    });
  }

  async function handleReject(invitationId: string) {
    startTransition(async () => {
      try {
        await authClient.organization.rejectInvitation({ invitationId });
        toast.success("Invitation declined");
        loadInvitations();
      } catch {
        toast.error("Failed to decline invitation");
      }
    });
  }

  if (loading) return <InvitationsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Invitations" description="Pending invitations to join organizations." />

      {invitations.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="No pending invitations"
          description="You'll see invitations here when someone invites you to an organization."
        />
      ) : (
        <Panel className="overflow-hidden">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 border-b border-border p-4 last:border-b-0">
              <IconTile tone="sky">
                <Mail className="h-6 w-6" />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{inv.organization.name}</p>
                <p className="text-sm text-muted-foreground">
                  Invited as <span className="font-semibold">{inv.role}</span> · expires{" "}
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  className={pressable("brand", "px-3")}
                  onClick={() => handleAccept(inv.id)}
                  disabled={isPending}
                  aria-label="Accept"
                >
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Accept</span>
                </button>
                <button
                  className={pressable("outline", "px-3")}
                  onClick={() => handleReject(inv.id)}
                  disabled={isPending}
                  aria-label="Decline"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Decline</span>
                </button>
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

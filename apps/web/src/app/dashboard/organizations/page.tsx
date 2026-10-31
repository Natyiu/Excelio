"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Building02Icon as Building2,
  PlusSignIcon as Plus,
  UserGroupIcon as Users,
  Mail01Icon as Mail,
  CrownIcon as Crown,
  UserMinus01Icon as UserMinus,
} from "@hugeicons/react";

import { authClient } from "@/lib/auth-client";
import { getAuthConfig } from "@/lib/actions/user";

import { Button } from "@/components/ui/button";
import { EmptyState, pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrganizationsSkeleton } from "@/components/skeletons";
import type { Organization as Org } from "@/types/dashboard-organizations";

export default function OrganizationsPage() {
  const { data: session } = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrg, setActiveOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ organizationsEnabled: boolean; invitesEnabled: boolean } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  async function loadOrgDetails(orgId: string) {
    try {
      const { data: full } = await authClient.organization.getFullOrganization({
        query: { organizationId: orgId },
      });
      if (full) setActiveOrg(full as unknown as Org);
    } catch {
      // ignore
    }
  }

  async function loadData() {
    try {
      const [configResult] = await Promise.all([getAuthConfig()]);
      setConfig(configResult);

      if (!configResult.organizationsEnabled) {
        setLoading(false);
        return;
      }

      const { data: orgList } = await authClient.organization.list();
      const list = (orgList as unknown as Org[]) ?? [];
      setOrgs(list);

      if (list.length > 0) {
        await loadOrgDetails(list[0]!.id);
      }
    } catch {
      // Org feature might not be available
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount pattern; loadData sets state after its
    // internal awaits. Rewriting without an effect would mean pulling in a
    // data-fetching library, out of scope here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) return;
    startTransition(async () => {
      try {
        const { data } = await authClient.organization.create({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        });
        if (data) {
          toast.success("Organization created");
          setCreateOpen(false);
          setNewName("");
          setNewSlug("");
          await loadData();
        }
      } catch {
        toast.error("Failed to create organization");
      }
    });
  }

  async function handleSwitchOrg(orgId: string) {
    startTransition(async () => {
      try {
        await authClient.organization.setActive({ organizationId: orgId });
      } catch {
        // setActive may not exist in some versions
      }
      await loadOrgDetails(orgId);
      toast.success("Switched organization");
    });
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeOrg) return;
    startTransition(async () => {
      try {
        await authClient.organization.inviteMember({
          email: inviteEmail.trim(),
          role: inviteRole as "member" | "admin",
          organizationId: activeOrg.id,
        });
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        await loadOrgDetails(activeOrg.id);
      } catch {
        toast.error("Failed to send invitation");
      }
    });
  }

  async function handleRemoveMember(memberId: string) {
    if (!activeOrg) return;
    startTransition(async () => {
      try {
        await authClient.organization.removeMember({
          memberIdOrEmail: memberId,
          organizationId: activeOrg.id,
        });
        toast.success("Member removed");
        await loadOrgDetails(activeOrg.id);
      } catch {
        toast.error("Failed to remove member");
      }
    });
  }

  if (loading) return <OrganizationsSkeleton />;

  if (!config?.organizationsEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">Organizations</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Organizations are currently disabled by the admin.
          </p>
        </div>
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="This feature is not enabled" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">Organizations</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Create and manage your teams.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className={pressable("brand", "h-auto")}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Create Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Organization name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                className="text-sm"
              />
              <Input
                placeholder="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="text-sm text-muted-foreground"
              />
              <Button
                onClick={handleCreate}
                disabled={isPending || !newName.trim()}
                size="sm"
                className="w-full text-xs"
              >
                {isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Org list */}
      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border py-16 text-center">
          <Building2 className="mb-4 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-lg font-bold">No organizations</h3>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Create your first organization to start collaborating.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {orgs.map((org) => {
            const isActive = activeOrg?.id === org.id;
            return (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition-colors",
                  isActive ? "border-transparent bg-brand-soft" : "border-border bg-card hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{org.name}</p>
                    <p className="text-sm text-muted-foreground">/{org.slug}</p>
                  </div>
                  {isActive && (
                    <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Active org details */}
      {activeOrg && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-bold">{activeOrg.name}</h2>
              <p className="text-[10px] text-muted-foreground">
                {activeOrg.members?.length ?? 0} member{(activeOrg.members?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-1.5">
              {config?.invitesEnabled && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className={pressable("outline", "h-auto px-3 py-2")}>
                      <Mail className="h-4 w-4" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Invite Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <Input
                        placeholder="Email address"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="text-sm"
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleInvite}
                        disabled={isPending || !inviteEmail.trim()}
                        size="sm"
                        className="w-full text-xs"
                      >
                        {isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="divide-y divide-border">
            {activeOrg.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                    <span className="text-sm font-bold text-brand">
                      {member.user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-bold">
                        {member.user?.name ?? "Unnamed"}
                      </p>
                      {member.role === "owner" && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {member.role}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                </div>
                {member.userId !== session?.user.id && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {(!activeOrg.members || activeOrg.members.length === 0) && (
              <div className="p-6 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-[15px] text-muted-foreground">No members yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

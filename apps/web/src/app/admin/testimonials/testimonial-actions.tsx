"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTestimonial, setTestimonialApproved } from "@/lib/actions/testimonials";
import { Button } from "@/components/ui/button";

export function TestimonialActions({ id, approved, canPublish }: { id: string; approved: boolean; canPublish: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (action: () => Promise<void>, done: string) =>
    startTransition(async () => {
      try {
        await action();
        toast.success(done);
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });

  return (
    <div className="mt-3 flex gap-2">
      {approved ? (
        <Button size="sm" variant="outline" className="h-8 text-[13px]" disabled={pending} onClick={() => run(() => setTestimonialApproved(id, false), "Hidden from homepage")}>
          Hide
        </Button>
      ) : (
        <Button size="sm" className="h-8 text-[13px]" disabled={pending || !canPublish} onClick={() => run(() => setTestimonialApproved(id, true), "Approved, now on the homepage")}>
          Approve
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-8 text-[13px] text-destructive" disabled={pending} onClick={() => run(() => deleteTestimonial(id), "Deleted")}>
        Delete
      </Button>
    </div>
  );
}

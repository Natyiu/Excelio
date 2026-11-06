"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { pressable } from "@/components/game-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INTERACTIVE = "a,button,input,select,textarea,summary,label,[role=button],[role=switch],[aria-disabled]";
/** The free lesson and the ways to get an account stay open. */
const OPEN_HREF = /^\/(try|signup|login)(\/|\?|$)/;

/**
 * Lets guests look at a page but not use it: anything they try to open inside it asks them
 * to sign in or create an account. Mark something `data-guest-open` to leave it working.
 */
export function GuestGate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as Element).closest(INTERACTIVE);
    if (!el || el.closest("[data-guest-open]")) return;
    if (OPEN_HREF.test(el.getAttribute("href") ?? "")) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <div onClickCapture={onClickCapture}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-8 text-center">
          <Mascot mood="wave" size={110} className="mx-auto" />
          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold">Sign in to open this</DialogTitle>
            <DialogDescription className="text-[15px]">
              Create a free account or sign in to use everything in Excelio and keep your progress.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Link href="/signup" className={pressable("brand", "w-full py-3")}>
              Create free account
            </Link>
            <Link href="/login" className={pressable("outline", "w-full py-3")}>
              Sign in
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

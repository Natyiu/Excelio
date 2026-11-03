import type { MascotMood } from "@/components/mascot";

export const ANNOUNCEMENT_TONES = ["news", "celebrate", "update", "warning"] as const;
export type AnnouncementTone = (typeof ANNOUNCEMENT_TONES)[number];

/** What learners receive: only what the card needs. */
export type AnnouncementView = {
  id: string;
  /** Changes when the announcement is edited, so an edited one shows again after being dismissed. */
  version: number;
  title: string;
  message: string;
  tone: AnnouncementTone;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdAt: string;
};

/** Look of each style: label, colours, mascot pose. */
export const TONE_STYLE: Record<
  AnnouncementTone,
  { label: string; kicker: string; from: string; to: string; deep: string; mood: MascotMood }
> = {
  news: { label: "News", kicker: "📣 Announcement", from: "#4f46e5", to: "#7c3aed", deep: "#3730a3", mood: "teach" },
  celebrate: { label: "Celebrate", kicker: "🎉 Big news", from: "#f97316", to: "#ec4899", deep: "#be185d", mood: "cheer" },
  update: { label: "New feature", kicker: "✨ New in Excelio", from: "#16a34a", to: "#0d9488", deep: "#0f766e", mood: "wave" },
  warning: { label: "Heads up", kicker: "⚠️ Heads up", from: "#f59e0b", to: "#ea580c", deep: "#b45309", mood: "oops" },
};

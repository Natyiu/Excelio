import type { ComponentType } from "react";
import {
  BookOpen01Icon,
  Calendar03Icon,
  ChampionIcon,
  Diamond02Icon,
  FireIcon,
  FlashIcon,
  FunctionIcon,
  Mortarboard02Icon,
  Rocket01Icon,
  Search01Icon,
  StarIcon,
  Sun03Icon,
  Target02Icon,
} from "@hugeicons/react";

/** The icon for each achievement, shared by the Achievements and Profile pages. */
export const ACHIEVEMENT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "first-lesson": Target02Icon,
  "five-lessons": BookOpen01Icon,
  "ten-lessons": Rocket01Icon,
  "twenty-lessons": Mortarboard02Icon,
  "perfect-lesson": StarIcon,
  "three-day-streak": FireIcon,
  "seven-day-streak": Calendar03Icon,
  "thirty-day-streak": ChampionIcon,
  "formula-beginner": FunctionIcon,
  "lookup-specialist": Search01Icon,
  "daily-challenge": Sun03Icon,
  "xp-500": FlashIcon,
  "xp-1000": Diamond02Icon,
};

/** Badge colour by kind of achievement (base, darker edge). */
export function achievementColour(slug: string): { base: string; deep: string } {
  if (slug.includes("streak")) return { base: "#ea580c", deep: "#9a3412" };
  if (slug.startsWith("xp-")) return { base: "#7c3aed", deep: "#5b21b6" };
  if (["formula-beginner", "lookup-specialist", "daily-challenge"].includes(slug)) return { base: "#0284c7", deep: "#075985" };
  return { base: "#1d9a52", deep: "#0d6b37" };
}

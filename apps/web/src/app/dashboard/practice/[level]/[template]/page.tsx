import { notFound } from "next/navigation";
import { parseLevel } from "@/components/level-picker";
import { TEMPLATES } from "@/data/practice-templates";
import { PracticeSheet } from "./practice-sheet";

export default async function PracticeSheetPage({ params }: { params: Promise<{ level: string; template: string }> }) {
  const { level: rawLevel, template } = await params;
  const level = parseLevel(rawLevel);
  const t = TEMPLATES[template];
  if (!level || !t || !t.levels.includes(level)) notFound();

  // Practice keeps the app's own green; stage colours belong to Challenges.
  return <PracticeSheet level={level} templateKey={template} />;
}

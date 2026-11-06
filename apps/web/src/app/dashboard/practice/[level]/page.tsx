import { notFound } from "next/navigation";
import { parseLevel } from "@/components/level-picker";
import { PracticeStudio } from "@/components/practice-studio";

export default async function PracticeStudioPage({ params }: { params: Promise<{ level: string }> }) {
  const level = parseLevel((await params).level);
  if (!level) notFound();
  return <PracticeStudio level={level} />;
}

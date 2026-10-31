import { notFound } from "next/navigation";
import { LessonWorkspace } from "@/components/learning/lesson-workspace";
import { levelStyle, parseLevel } from "@/components/level-picker";
import { CHALLENGES } from "@/data/curriculum/challenges";
import { COURSES } from "@/data/lessons";
import { completeChallenge, getCompletedChallengeIds } from "@/lib/actions/excel-learning";

/** A challenge takes over the screen, played in the same workspace as a lesson. */
export default async function ChallengePlayPage({ params }: { params: Promise<{ level: string; challengeId: string }> }) {
  const { level: rawLevel, challengeId } = await params;
  const level = parseLevel(rawLevel);
  if (!level) notFound();
  const list = CHALLENGES[level];
  const idx = list.findIndex((c) => c.id === challengeId);
  if (idx < 0) notFound();
  const challenge = list[idx]!;
  const next = list[idx + 1];
  const done = new Set(await getCompletedChallengeIds().catch(() => []));
  const exitHref = `/dashboard/daily-challenge/${level}`;

  return (
    <div style={levelStyle(level)}>
      <LessonWorkspace
        lesson={challenge}
        course={COURSES[0]!}
        alreadyCompleted={done.has(challenge.id)}
        challenge={{
          complete: completeChallenge.bind(null, challenge.id),
          exitHref,
          nextHref: next ? `${exitHref}/${next.id}` : undefined,
        }}
      />
    </div>
  );
}

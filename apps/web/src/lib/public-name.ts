/** A learner's name for public pages: "Cheryl Reilly" becomes "Cheryl R.". Never shows an email. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first || parts.some((p) => p.includes("@"))) return "Learner";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : undefined;
  return last ? `${first} ${last.toUpperCase()}.` : first;
}

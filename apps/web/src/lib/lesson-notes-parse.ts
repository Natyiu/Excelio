/** Lesson notes as blocks. Kept free of React so server pages can read them too. */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "demo"; lines: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "list"; ordered: boolean; items: string[] };

export function parseNotes(text: string): Block[] {
  const raw = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (let i = 0; i < raw.length; i++) {
    const block = raw[i]!;
    if (block.startsWith("```")) {
      // A code block may contain blank lines; gather until the closing fence.
      let code = block;
      while (!/```\s*$/.test(code.slice(3)) && i + 1 < raw.length) code += "\n\n" + raw[++i];
      const body = code.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      const lines = body.split("\n").filter((l) => l.trim());
      // ```show blocks are animated spreadsheet demos; other fences are formula examples.
      blocks.push(/^```show/.test(code) ? { kind: "demo", lines } : { kind: "code", lines });
      continue;
    }
    const lines = block.split("\n");
    if (lines.every((l) => l.trim().startsWith("|"))) {
      blocks.push({ kind: "table", rows: lines.map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())) });
      continue;
    }
    if (lines.every((l) => /^(-|\d+\.)\s/.test(l.trim()))) {
      blocks.push({
        kind: "list",
        ordered: /^\d+\./.test(lines[0]!.trim()),
        items: lines.map((l) => l.trim().replace(/^(-|\d+\.)\s+/, "")),
      });
      continue;
    }
    blocks.push({ kind: "p", text: lines.join(" ") });
  }
  return blocks;
}

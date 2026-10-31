import { describe, expect, it } from "vitest";
import { DRILLS, TEMPLATES } from "@/data/practice-templates";
import { parseCellInput, recalcSheet } from "@/lib/formula-engine";

describe("practice drills", () => {
  it("every drill calculates in its own sheet", () => {
    for (const [key, drills] of Object.entries(DRILLS)) {
      const template = TEMPLATES[key];
      expect(template, key).toBeDefined();
      let cells = template!.workbook.sheets[0]!.cells;
      // Blank sheet drills build on SEQUENCE in A1.
      for (const d of drills) {
        const target = key === "blank" && d.code === "=SEQUENCE(5)" ? "A1" : key === "blank" && d.code === "=SUM(A1:A5)" ? "A7" : "Z30";
        cells = recalcSheet({ ...cells, [target]: { id: target, value: parseCellInput(d.code) } });
        expect(cells[target]!.value.error, `${key}: ${d.code}`).toBeUndefined();
        if (target === "Z30") { const { Z30: _, ...rest } = cells; cells = rest; }
      }
    }
  });
});

/**
 * Answer Validation Engine
 * Validates user spreadsheet answers against lesson-defined rules.
 */

import type { ValidationRule, WorksheetData } from "@/types/excel-learning";
import { extractFunctionNames, formatCellValue } from "@/lib/formula-engine";

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  details?: string;
  targetCell?: string;
  expectedValue?: string;
  actualValue?: string;
}

/** Get the computed display value of a cell */
function getCellDisplay(cellId: string, cells: WorksheetData): string {
  const cell = cells[cellId];
  if (!cell) return "";
  return formatCellValue(cell.value, cell.format);
}

/** Get the raw computed value of a cell */
function getCellComputed(cellId: string, cells: WorksheetData): string | number | boolean | null {
  const cell = cells[cellId];
  if (!cell) return null;
  return cell.value.computed;
}

/** Numeric comparison with tolerance */
function numericEqual(a: unknown, b: unknown, tolerance = 0.001): boolean {
  const na = typeof a === "number" ? a : parseFloat(String(a ?? "").replace(/[$,%]/g, ""));
  const nb = typeof b === "number" ? b : parseFloat(String(b ?? "").replace(/[$,%]/g, ""));
  if (isNaN(na) || isNaN(nb)) return false;
  return Math.abs(na - nb) <= Math.abs(nb) * tolerance + tolerance;
}

/** Validate a single rule */
export function validateRule(rule: ValidationRule, cells: WorksheetData): ValidationResult {
  switch (rule.mode) {
    case "exact_text": {
      const actual = getCellDisplay(rule.targetCell, cells);
      const expected = String(rule.expectedValue ?? "");
      const correct = rule.caseSensitive
        ? actual === expected
        : actual.toLowerCase() === expected.toLowerCase();
      return {
        isCorrect: correct,
        message: correct ? "Correct!" : rule.message ?? `Expected "${expected}" but got "${actual}"`,
        targetCell: rule.targetCell,
        expectedValue: expected,
        actualValue: actual,
      };
    }

    case "numeric_value": {
      const actual = getCellComputed(rule.targetCell, cells);
      const expected = rule.expectedValue;
      const tolerance = rule.tolerance ?? 0.001;
      const correct = numericEqual(actual, expected, tolerance);
      return {
        isCorrect: correct,
        message: correct
          ? "Correct!"
          : rule.message ?? `Expected ${expected}, got ${formatCellValue(cells[rule.targetCell]?.value ?? { raw: "", computed: null, type: "blank" })}`,
        targetCell: rule.targetCell,
        expectedValue: String(expected),
        actualValue: String(actual),
      };
    }

    case "formula_result": {
      // Validate that the formula in the target cell evaluates to the expected value
      const cell = cells[rule.targetCell];
      if (!cell?.value.formula) {
        return {
          isCorrect: false,
          message: rule.message ?? `Cell ${rule.targetCell} doesn't contain a formula. Make sure you enter a formula starting with =`,
          targetCell: rule.targetCell,
        };
      }
      const actual = getCellComputed(rule.targetCell, cells);
      const expected = rule.expectedValue;
      const tolerance = rule.tolerance ?? 0.001;
      const correct = typeof expected === "number"
        ? numericEqual(actual, expected, tolerance)
        : String(actual).toLowerCase() === String(expected ?? "").toLowerCase();
      return {
        isCorrect: correct,
        message: correct
          ? "Correct! Your formula gives the right answer."
          : rule.message ?? `Your formula gives ${actual} but should give ${expected}`,
        targetCell: rule.targetCell,
        expectedValue: String(expected),
        actualValue: String(actual),
      };
    }

    case "required_formula": {
      // Validate that the cell contains a formula and that specific functions are used
      const cell = cells[rule.targetCell];
      if (!cell?.value.formula) {
        return {
          isCorrect: false,
          message: rule.message ?? `Cell ${rule.targetCell} must contain a formula (starting with =), not just a number`,
          targetCell: rule.targetCell,
        };
      }
      const usedFunctions = extractFunctionNames(cell.value.formula);
      const requiredFunctions = rule.requiredFormulas ?? [];
      const missingFunctions = requiredFunctions.filter(
        f => !usedFunctions.some(u => u === f.toUpperCase())
      );

      if (missingFunctions.length > 0) {
        return {
          isCorrect: false,
          message: rule.message ?? `Please use the ${missingFunctions.join(", ")} function to solve this task`,
          targetCell: rule.targetCell,
        };
      }

      // Also check result
      const actual = getCellComputed(rule.targetCell, cells);
      const expected = rule.expectedValue;
      if (expected !== undefined) {
        const tolerance = rule.tolerance ?? 0.001;
        const correct = typeof expected === "number"
          ? numericEqual(actual, expected, tolerance)
          : String(actual).toLowerCase() === String(expected ?? "").toLowerCase();
        return {
          isCorrect: correct,
          message: correct
            ? `Correct! Your ${requiredFunctions[0] ?? "formula"} gives the right answer.`
            : rule.message ?? `Your formula gives ${actual} but should give ${expected}. Double-check your range.`,
          targetCell: rule.targetCell,
          expectedValue: String(expected),
          actualValue: String(actual),
        };
      }

      return {
        isCorrect: true,
        message: `Correct! Great use of ${requiredFunctions[0] ?? "the function"}.`,
        targetCell: rule.targetCell,
      };
    }

    case "cell_value": {
      const actual = getCellComputed(rule.targetCell, cells);
      const expected = rule.expectedValue;
      const tolerance = rule.tolerance ?? 0.001;
      const correct = typeof expected === "number"
        ? numericEqual(actual, expected, tolerance)
        : String(actual).toLowerCase() === String(expected ?? "").toLowerCase();
      return {
        isCorrect: correct,
        message: correct
          ? "Correct!"
          : rule.message ?? `Expected "${expected}" in cell ${rule.targetCell}`,
        targetCell: rule.targetCell,
        expectedValue: String(expected),
        actualValue: String(actual),
      };
    }

    case "formula_contains": {
      const cell = cells[rule.targetCell];
      if (!cell?.value.formula) {
        return {
          isCorrect: false,
          message: `Cell ${rule.targetCell} must contain a formula`,
          targetCell: rule.targetCell,
        };
      }
      const formula = cell.value.formula.toUpperCase();
      const required = (rule.requiredFormulas ?? []).map(f => f.toUpperCase());
      const allPresent = required.every(fn => formula.includes(fn));
      return {
        isCorrect: allPresent,
        message: allPresent
          ? "Correct!"
          : `Your formula must use: ${rule.requiredFormulas?.join(", ")}`,
        targetCell: rule.targetCell,
      };
    }

    case "multiple_valid": {
      const actual = getCellComputed(rule.targetCell, cells);
      const validAnswers = rule.validAnswers ?? [];
      const tolerance = rule.tolerance ?? 0.001;
      const correct = validAnswers.some(v =>
        typeof v === "number"
          ? numericEqual(actual, v, tolerance)
          : String(actual).toLowerCase() === String(v).toLowerCase()
      );
      return {
        isCorrect: correct,
        message: correct ? "Correct!" : rule.message ?? "That's not quite right. Try again.",
        targetCell: rule.targetCell,
        actualValue: String(actual),
      };
    }

    case "cell_range": {
      // Validate multiple cells
      const cells_ = rule.targetCell.split(",").map(s => s.trim());
      const expected = rule.expectedValue;
      for (const cellId of cells_) {
        const actual = getCellComputed(cellId, cells);
        const correct = typeof expected === "number"
          ? numericEqual(actual, expected)
          : String(actual).toLowerCase() === String(expected ?? "").toLowerCase();
        if (!correct) {
          return {
            isCorrect: false,
            message: `Cell ${cellId} has an incorrect value`,
            targetCell: cellId,
          };
        }
      }
      return { isCorrect: true, message: "All cells are correct!" };
    }

    default:
      return { isCorrect: false, message: "Unknown validation mode" };
  }
}

/** Validate all rules for a challenge (ALL must pass) */
export function validateChallenge(rules: ValidationRule[], cells: WorksheetData): ValidationResult {
  for (const rule of rules) {
    const result = validateRule(rule, cells);
    if (!result.isCorrect) return result;
  }
  return { isCorrect: true, message: "All checks passed!" };
}

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  Workbook,
  WorksheetData,
  CellFormat,
} from "@/types/excel-learning";
import { ExcelRibbon, ExcelSheetTabs, ExcelStatusBar, ExcelTabs, ExcelTitleBar } from "@/components/spreadsheet/excel-chrome";
import {
  parseCellRef,
  cellId,
  parseRange,
  previewFormula,
  parseCellInput,
  recalcSheet,
  formatCellValue,
} from "@/lib/formula-engine";

interface SpreadsheetProps {
  workbook: Workbook;
  onChange?: (updatedWorkbook: Workbook) => void;
  targetCellId?: string; // Highlight target cell for exercises
  highlightRanges?: string[]; // Extra highlighted ranges e.g. ["B2:B6"]
  readOnly?: boolean;
  className?: string;
  showToolbar?: boolean;
  showFormulaBar?: boolean;
  showStatusBar?: boolean;
  showSheetTabs?: boolean;
  /** Let the grid stretch to fill a fixed-height parent instead of capping at 580px. */
  fillHeight?: boolean;
  /** Lesson look: grid sized to the sheet (no fixed height), roomier cells, regular font. */
  compact?: boolean;
  /** Draw the real Excel window around the grid: title bar, ribbon, sheet tabs and status bar. */
  excelChrome?: boolean;
}

const COMMON_FORMULAS = [
  { name: "SUM", syntax: "SUM(number1, [number2], ...)", desc: "Adds all numbers in a range" },
  { name: "AVERAGE", syntax: "AVERAGE(number1, [number2], ...)", desc: "Returns the average (arithmetic mean)" },
  { name: "COUNT", syntax: "COUNT(value1, [value2], ...)", desc: "Counts cells that contain numbers" },
  { name: "COUNTA", syntax: "COUNTA(value1, [value2], ...)", desc: "Counts non-empty cells" },
  { name: "COUNTIF", syntax: "COUNTIF(range, criteria)", desc: "Counts cells meeting specified criteria" },
  { name: "SUMIF", syntax: "SUMIF(range, criteria, [sum_range])", desc: "Sums cells meeting specified criteria" },
  { name: "IF", syntax: "IF(logical_test, value_if_true, [value_if_false])", desc: "Conditional evaluation" },
  { name: "VLOOKUP", syntax: "VLOOKUP(lookup_value, table_array, col_index, [exact_match])", desc: "Looks for a value in the leftmost column" },
  { name: "XLOOKUP", syntax: "XLOOKUP(lookup_value, lookup_array, return_array)", desc: "Modern versatile lookup" },
  { name: "INDEX", syntax: "INDEX(array, row_num, [col_num])", desc: "Returns value at a given position" },
  { name: "MATCH", syntax: "MATCH(lookup_value, lookup_array, [match_type])", desc: "Returns relative position of an item" },
  { name: "MAX", syntax: "MAX(number1, [number2], ...)", desc: "Returns largest value" },
  { name: "MIN", syntax: "MIN(number1, [number2], ...)", desc: "Returns smallest value" },
  { name: "CONCATENATE", syntax: "CONCATENATE(text1, [text2], ...)", desc: "Joins multiple text strings" },
  { name: "LEFT", syntax: "LEFT(text, [num_chars])", desc: "Returns characters from the left" },
  { name: "RIGHT", syntax: "RIGHT(text, [num_chars])", desc: "Returns characters from the right" },
  { name: "MID", syntax: "MID(text, start_num, num_chars)", desc: "Returns characters from the middle" },
  { name: "TRIM", syntax: "TRIM(text)", desc: "Removes extra spaces from text" },
  { name: "UPPER", syntax: "UPPER(text)", desc: "Converts text to uppercase" },
  { name: "LOWER", syntax: "LOWER(text)", desc: "Converts text to lowercase" },
  { name: "ROUND", syntax: "ROUND(number, num_digits)", desc: "Rounds a number to specified digits" },
  { name: "IFS", syntax: "IFS(test1, value1, [test2, value2], ...)", desc: "Returns the value for the first TRUE test" },
  { name: "SUMIFS", syntax: "SUMIFS(sum_range, criteria_range1, criteria1, ...)", desc: "Sums cells meeting several criteria" },
  { name: "COUNTIFS", syntax: "COUNTIFS(criteria_range1, criteria1, ...)", desc: "Counts rows meeting several criteria" },
  { name: "IFERROR", syntax: "IFERROR(value, value_if_error)", desc: "Returns a fallback if the formula errors" },
  { name: "XMATCH", syntax: "XMATCH(lookup_value, lookup_array, [match_mode], [search_mode])", desc: "Position of an item in a list" },
  { name: "FILTER", syntax: "FILTER(array, include, [if_empty])", desc: "Returns the rows that meet a condition" },
  { name: "SORT", syntax: "SORT(array, [sort_index], [sort_order], [by_col])", desc: "Sorts a range or array" },
  { name: "SORTBY", syntax: "SORTBY(array, by_array1, [sort_order1], ...)", desc: "Sorts by the values in another range" },
  { name: "UNIQUE", syntax: "UNIQUE(array, [by_col], [exactly_once])", desc: "Returns the distinct values" },
  { name: "SEQUENCE", syntax: "SEQUENCE(rows, [columns], [start], [step])", desc: "Generates a list of numbers" },
  { name: "LET", syntax: "LET(name1, value1, ..., calculation)", desc: "Names values inside a formula" },
  { name: "LAMBDA", syntax: "LAMBDA(param1, ..., calculation)", desc: "Creates a custom function" },
  { name: "RANK.EQ", syntax: "RANK.EQ(number, ref, [order])", desc: "Rank of a number in a list" },
  { name: "MROUND", syntax: "MROUND(number, multiple)", desc: "Rounds to the nearest multiple" },
  { name: "TEXT", syntax: "TEXT(value, format_text)", desc: "Formats a number with a format code" },
];

export function Spreadsheet({
  workbook,
  onChange,
  targetCellId,
  highlightRanges = [],
  readOnly = false,
  className = "",
  showToolbar = true,
  showFormulaBar = true,
  showStatusBar = true,
  showSheetTabs = true,
  fillHeight = false,
  compact = false,
  excelChrome = false,
}: SpreadsheetProps) {
  // Current active worksheet
  const [activeSheetId, setActiveSheetId] = useState(
    workbook.activeSheetId || workbook.sheets[0]?.id || "sheet1"
  );

  const currentSheet = useMemo(() => {
    return workbook.sheets.find((s) => s.id === activeSheetId) || workbook.sheets[0] || {
      id: "sheet1",
      name: "Sheet1",
      cells: {},
      rowCount: 20,
      colCount: 10,
    };
  }, [workbook, activeSheetId]);

  // Cells state
  const [cells, setCells] = useState<WorksheetData>(currentSheet.cells || {});

  // Sync when workbook prop changes
  useEffect(() => {
    setCells(currentSheet.cells || {});
  }, [currentSheet]);

  // Selected cell (row, col)
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number }>({
    col: 0,
    row: 0,
  });

  // Range selection (start, end)
  const [selectionRange, setSelectionRange] = useState<{
    start: { col: number; row: number };
    end: { col: number; row: number };
  } | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  // The cell an edit belongs to. Selection can move (e.g. clicking another
  // cell) before the edit is saved, so commits must not use currentCellId.
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  // Mirrors isEditing synchronously so a late blur (e.g. from the editor
  // unmounting after Enter/Escape) can't save twice or undo a cancel.
  const editingRef = useRef(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const formulaInputRef = useRef<HTMLInputElement | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<typeof COMMON_FORMULAS>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);

  // Undo/Redo history
  const [history, setHistory] = useState<WorksheetData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const currentCellId = useMemo(
    () => cellId(selectedCell.col, selectedCell.row),
    [selectedCell]
  );

  const currentCell = useMemo(() => cells[currentCellId], [cells, currentCellId]);

  // Target cell highlighting helper
  const isTarget = useCallback(
    (id: string) => targetCellId?.toUpperCase() === id.toUpperCase(),
    [targetCellId]
  );

  // Check if cell is in highlightRanges
  const isRangeHighlighted = useCallback(
    (id: string) => {
      for (const range of highlightRanges) {
        const parsed = parseRange(range, cells);
        if (parsed.includes(id.toUpperCase())) return true;
      }
      return false;
    },
    [highlightRanges, cells]
  );

  // When selected cell changes, if targetCellId was given on initial load, auto-select target
  useEffect(() => {
    if (targetCellId) {
      const parsed = parseCellRef(targetCellId);
      if (parsed) {
        setSelectedCell(parsed);
      }
    }
  }, [targetCellId]);

  // Save history state
  const pushHistory = useCallback((newCells: WorksheetData) => {
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), newCells]);
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  // Commit updated cells
  const commitCells = useCallback(
    (newCells: WorksheetData) => {
      // Recalculate sheet formulas
      const evaluated = recalcSheet(newCells, currentSheet.names);
      setCells(evaluated);
      pushHistory(evaluated);

      if (onChange) {
        const updatedSheets = workbook.sheets.map((sheet) =>
          sheet.id === activeSheetId ? { ...sheet, cells: evaluated } : sheet
        );
        onChange({
          ...workbook,
          sheets: updatedSheets,
        });
      }
    },
    [activeSheetId, currentSheet.names, onChange, pushHistory, workbook]
  );

  // Update a single cell's value
  const updateCellValue = useCallback(
    (targetId: string, rawInput: string) => {
      if (readOnly) return;
      const parsedVal = parseCellInput(rawInput);
      const prevCell = cells[targetId];

      const newCells: WorksheetData = {
        ...cells,
        [targetId]: {
          id: targetId,
          value: parsedVal,
          format: prevCell?.format,
          readOnly: prevCell?.readOnly,
          highlighted: prevCell?.highlighted,
          note: prevCell?.note,
        },
      };

      commitCells(newCells);
    },
    [cells, commitCells, readOnly]
  );

  // Apply formatting to selected cell or range
  const applyFormat = useCallback(
    (formatUpdates: Partial<CellFormat>) => {
      if (readOnly) return;
      const targetIds: string[] = [];

      if (selectionRange) {
        const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
        const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            targetIds.push(cellId(c, r));
          }
        }
      } else {
        targetIds.push(currentCellId);
      }

      const updated = { ...cells };
      for (const id of targetIds) {
        const existing = updated[id] || {
          id,
          value: { raw: "", computed: null, type: "blank" },
        };
        updated[id] = {
          ...existing,
          format: {
            ...existing.format,
            ...formatUpdates,
          },
        };
      }
      commitCells(updated);
    },
    [cells, commitCells, currentCellId, readOnly, selectionRange]
  );

  // Autocomplete handler
  useEffect(() => {
    if (isEditing && editValue.startsWith("=")) {
      const query = editValue.slice(1).toUpperCase();
      if (query.length > 0) {
        const matches = COMMON_FORMULAS.filter((f) => f.name.startsWith(query));
        setSuggestions(matches.slice(0, 5));
        setSelectedSuggestionIdx(0);
        return;
      }
    }
    setSuggestions([]);
  }, [editValue, isEditing]);

  // Insert autocomplete suggestion
  const insertSuggestion = useCallback(
    (formulaName: string) => {
      const newVal = `=${formulaName}(`;
      setEditValue(newVal);
      setSuggestions([]);
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    },
    []
  );

  // Start editing
  const startEditing = useCallback(
    (initialValue?: string) => {
      if (readOnly || currentCell?.readOnly) return;
      const val = initialValue !== undefined
        ? initialValue
        : currentCell?.value.formula || currentCell?.value.raw || "";
      setEditValue(val);
      setEditingCellId(currentCellId);
      editingRef.current = true;
      setIsEditing(true);
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 10);
    },
    [currentCell, currentCellId, readOnly]
  );

  // Stop editing & save
  const finishEditing = useCallback(
    (moveDirection?: "down" | "right" | "up" | "left") => {
      if (!editingRef.current) return;
      editingRef.current = false;
      updateCellValue(editingCellId ?? currentCellId, editValue);
      setIsEditing(false);
      setEditingCellId(null);
      setSuggestions([]);

      if (moveDirection === "down") {
        setSelectedCell((prev) => ({
          ...prev,
          row: Math.min(prev.row + 1, currentSheet.rowCount - 1),
        }));
      } else if (moveDirection === "right") {
        setSelectedCell((prev) => ({
          ...prev,
          col: Math.min(prev.col + 1, currentSheet.colCount - 1),
        }));
      } else if (moveDirection === "up") {
        setSelectedCell((prev) => ({
          ...prev,
          row: Math.max(prev.row - 1, 0),
        }));
      } else if (moveDirection === "left") {
        setSelectedCell((prev) => ({
          ...prev,
          col: Math.max(prev.col - 1, 0),
        }));
      }
    },
    [currentCellId, currentSheet.colCount, currentSheet.rowCount, editValue, editingCellId, updateCellValue]
  );

  // Cancel editing
  const cancelEditing = useCallback(() => {
    editingRef.current = false;
    setIsEditing(false);
    setEditingCellId(null);
    setSuggestions([]);
  }, []);

  // Keyboard navigation on grid
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        if (e.key === "Enter") {
          e.preventDefault();
          const sug = suggestions[selectedSuggestionIdx];
          if (sug) {
            insertSuggestion(sug.name);
          } else {
            finishEditing(e.shiftKey ? "up" : "down");
          }
        } else if (e.key === "Tab") {
          e.preventDefault();
          const sug = suggestions[selectedSuggestionIdx];
          if (sug) {
            insertSuggestion(sug.name);
          } else {
            finishEditing(e.shiftKey ? "left" : "right");
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelEditing();
        } else if (suggestions.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedSuggestionIdx((prev) => (prev + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedSuggestionIdx((prev) =>
              prev === 0 ? suggestions.length - 1 : prev - 1
            );
          }
        }
        return;
      }

      // Not editing: grid navigation
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, row: Math.max(0, prev.row - 1) }));
        setSelectionRange(null);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCell((prev) => ({
          ...prev,
          row: Math.min(currentSheet.rowCount - 1, prev.row + 1),
        }));
        setSelectionRange(null);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, col: Math.max(0, prev.col - 1) }));
        setSelectionRange(null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCell((prev) => ({
          ...prev,
          col: Math.min(currentSheet.colCount - 1, prev.col + 1),
        }));
        setSelectionRange(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        startEditing();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        updateCellValue(currentCellId, "");
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Typing a character starts editing directly
        startEditing(e.key);
      }
    },
    [
      cancelEditing,
      currentCellId,
      currentSheet.colCount,
      currentSheet.rowCount,
      finishEditing,
      insertSuggestion,
      isEditing,
      selectedSuggestionIdx,
      startEditing,
      suggestions,
      updateCellValue,
    ]
  );

  // Cell selection bounds
  const isCellSelected = useCallback(
    (c: number, r: number) => {
      if (selectionRange) {
        const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
        const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        return c >= minCol && c <= maxCol && r >= minRow && r <= maxRow;
      }
      return selectedCell.col === c && selectedCell.row === r;
    },
    [selectedCell, selectionRange]
  );

  // Live Formula Bar calculations
  const formulaBarValue = useMemo(() => {
    if (isEditing) return editValue;
    return currentCell?.value.formula || currentCell?.value.raw || "";
  }, [currentCell, editValue, isEditing]);

  // Statistics calculation for status bar
  const selectedStats = useMemo(() => {
    const nums: number[] = [];
    let count = 0;

    const evalCell = (c: number, r: number) => {
      const id = cellId(c, r);
      const cell = cells[id];
      if (cell && cell.value.type !== "blank" && cell.value.raw !== "") {
        count++;
        if (typeof cell.value.computed === "number") {
          nums.push(cell.value.computed);
        }
      }
    };

    if (selectionRange) {
      const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
      const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          evalCell(c, r);
        }
      }
    } else {
      evalCell(selectedCell.col, selectedCell.row);
    }

    if (nums.length === 0) return { count, sum: null, avg: null };
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    return { count, sum, avg };
  }, [cells, selectedCell, selectionRange]);

  const rowCount = currentSheet.rowCount || 20;
  const colCount = currentSheet.colCount || 10;

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`flex flex-col select-none overflow-hidden font-sans outline-none ${
        compact
          ? "rounded-2xl border-2 border-border bg-card shadow-[0_4px_0_var(--border)]"
          : "rounded-2xl border-2 border-border bg-background"
      } ${className}`}
    >
      {/* ─── Excel window: title bar, tabs and the Home ribbon ─────────────── */}
      {excelChrome && (
        <>
          <ExcelTitleBar fileName={currentSheet.name === "Sheet1" ? "Book1" : currentSheet.name} />
          <ExcelTabs />
          {/* stays visible when the sheet is locked; the commands just do nothing then */}
          <ExcelRibbon format={currentCell?.format} onFormat={applyFormat} onFormula={(start) => startEditing(start)} />
        </>
      )}

      {/* ─── Excel Ribbon / Toolbar ───────────────────────────────────────── */}
      {showToolbar && !excelChrome && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur-sm">
          {/* Quick undo/redo */}
          <div className="flex items-center space-x-0.5 border-r border-border/60 pr-1.5 mr-1">
            <button
              type="button"
              disabled={historyIdx <= 0}
              onClick={() => {
                if (historyIdx > 0 && history[historyIdx - 1]) {
                  setHistoryIdx(historyIdx - 1);
                  setCells(history[historyIdx - 1]!);
                }
              }}
              className="p-1 rounded hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              disabled={historyIdx >= history.length - 1}
              onClick={() => {
                if (historyIdx < history.length - 1 && history[historyIdx + 1]) {
                  setHistoryIdx(historyIdx + 1);
                  setCells(history[historyIdx + 1]!);
                }
              }}
              className="p-1 rounded hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
              </svg>
            </button>
          </div>

          {/* Text Style: Bold, Italic, Underline */}
          <div className="flex items-center space-x-0.5 border-r border-border/60 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => applyFormat({ bold: !currentCell?.format?.bold })}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                currentCell?.format?.bold ? "bg-green-500/20 text-green-600 dark:text-green-400 font-extrabold" : "hover:bg-muted"
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ italic: !currentCell?.format?.italic })}
              className={`px-2 py-0.5 rounded italic transition-colors ${
                currentCell?.format?.italic ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ underline: !currentCell?.format?.underline })}
              className={`px-2 py-0.5 rounded underline transition-colors ${
                currentCell?.format?.underline ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-0.5 border-r border-border/60 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => applyFormat({ align: "left" })}
              className={`p-1 rounded ${
                currentCell?.format?.align === "left" || !currentCell?.format?.align ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Align Left"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ align: "center" })}
              className={`p-1 rounded ${
                currentCell?.format?.align === "center" ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Align Center"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ align: "right" })}
              className={`p-1 rounded ${
                currentCell?.format?.align === "right" ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Align Right"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" />
              </svg>
            </button>
          </div>

          {/* Number Formats: Currency, Percent, Comma */}
          <div className="flex items-center space-x-1 border-r border-border/60 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => applyFormat({ numberFormat: currentCell?.format?.numberFormat === "currency" ? undefined : "currency" })}
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                currentCell?.format?.numberFormat === "currency" ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Format as Currency ($)"
            >
              $
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ numberFormat: currentCell?.format?.numberFormat === "percentage" ? undefined : "percentage" })}
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                currentCell?.format?.numberFormat === "percentage" ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Format as Percent (%)"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => applyFormat({ numberFormat: currentCell?.format?.numberFormat === "number" ? undefined : "number" })}
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                currentCell?.format?.numberFormat === "number" ? "bg-green-500/20 text-green-600 dark:text-green-400" : "hover:bg-muted"
              }`}
              title="Format with Separators (,)"
            >
              ,
            </button>
          </div>

          {/* Quick Functions Dropdown / Buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => startEditing("=SUM(")}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-600/10 hover:bg-green-600/20 text-green-600 dark:text-green-400 transition-colors"
              title="Insert =SUM()"
            >
              Σ AutoSum
            </button>
            <button
              type="button"
              onClick={() => startEditing("=AVERAGE(")}
              className="px-2 py-0.5 rounded text-[11px] hover:bg-muted transition-colors hidden sm:inline-block"
              title="Insert =AVERAGE()"
            >
              Average
            </button>
            <button
              type="button"
              onClick={() => startEditing("=IF(")}
              className="px-2 py-0.5 rounded text-[11px] hover:bg-muted transition-colors hidden md:inline-block"
              title="Insert =IF()"
            >
              IF
            </button>
          </div>
        </div>
      )}

      {/* ─── Excel Formula Bar ────────────────────────────────────────────── */}
      {showFormulaBar && (
        <div className={`flex items-center gap-2 border-b border-border/80 text-xs ${compact ? "bg-card px-3 py-2.5" : "bg-background/90 px-3 py-1"}`}>
          {/* Name Box: its own box with a drop-down arrow, like Excel's */}
          <div className="flex items-center">
            {compact ? (
              <span className="inline-flex w-24 items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[13px] font-semibold text-brand">
                {currentCellId}
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="m3 4.5 3 3 3-3" />
                </svg>
              </span>
            ) : (
              <span className="inline-flex min-w-[54px] items-center justify-center rounded border border-border/70 bg-muted/60 px-2 py-0.5 text-center font-mono text-xs font-bold text-green-600 dark:text-green-400">
                {currentCellId}
              </span>
            )}
          </div>

          {compact && <span className="text-muted-foreground/50" aria-hidden>⋮</span>}

          {!compact && <div className="h-4 w-[1px] bg-border/80" />}

          {/* Cancel / Enter, like Excel's formula bar */}
          {excelChrome && (
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground" aria-hidden>
              <span className={isEditing ? "text-rose-500" : "opacity-40"}>✕</span>
              <span className={isEditing ? "text-brand" : "opacity-40"}>✓</span>
            </span>
          )}

          {/* fx Indicator */}
          <span className={`font-serif italic font-bold select-none px-1 ${compact ? "text-base text-brand" : "text-xs text-muted-foreground"}`}>
            fx
          </span>

          {!compact && <div className="h-4 w-[1px] bg-border/80" />}

          {/* Formula Input: in lessons it sits in its own box, like Excel's formula bar */}
          <div
            className={`relative flex-1 ${
              compact ? "rounded-lg border border-border bg-background px-2.5 py-1 transition-colors focus-within:border-brand" : ""
            }`}
          >
            <input
              ref={formulaInputRef}
              type="text"
              readOnly={readOnly || currentCell?.readOnly}
              value={formulaBarValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                if (!editingRef.current) {
                  setEditingCellId(currentCellId);
                  editingRef.current = true;
                  setIsEditing(true);
                }
              }}
              onBlur={() => finishEditing()}
              onFocus={() => {
                if (editingRef.current || readOnly || currentCell?.readOnly) return;
                setEditValue(currentCell?.value.formula || currentCell?.value.raw || "");
                setEditingCellId(currentCellId);
                editingRef.current = true;
                setIsEditing(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  finishEditing("down");
                } else if (e.key === "Escape") {
                  cancelEditing();
                }
              }}
              placeholder={isTarget(currentCellId) ? "Type formula here e.g. =SUM(...)" : ""}
              className={`w-full bg-transparent font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none ${compact ? "text-[14px]" : "text-xs"}`}
            />
          </div>

          {/* In lessons, point at the cell to fill in until the learner gets there */}
          {compact && targetCellId && currentCellId !== targetCellId.toUpperCase() && !isEditing && (
            <button
              type="button"
              onClick={() => {
                const p = parseCellRef(targetCellId);
                if (p) setSelectedCell(p);
              }}
              className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-semibold text-brand transition-transform hover:scale-105 sm:inline-flex"
            >
              Your cell: {targetCellId.toUpperCase()}
              <span className="animate-pulse">→</span>
            </button>
          )}

          {/* Live Result Preview if typing formula */}
          {isEditing && editValue.startsWith("=") && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-mono text-[11px]">
              <span className="text-[10px] text-muted-foreground">Preview:</span>
              <span className="font-semibold">
                {(() => {
                  try {
                    return previewFormula(editValue, cells, currentSheet.names);
                  } catch {
                    return "...";
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Grid Canvas ──────────────────────────────────────────────────── */}
      <div className={`relative overflow-auto ${compact ? "max-h-[55vh] bg-card" : fillHeight ? "min-h-0 flex-1 bg-background" : "max-h-[580px] min-h-[320px] bg-background"}`}>
        <table className="w-full border-collapse text-left border-spacing-0">
          <thead>
            <tr>
              {/* Top-left select-all corner */}
              <th className={`sticky top-0 left-0 z-30 w-10 min-w-[40px] max-w-[40px] border-r border-b text-center text-[11px] text-muted-foreground ${compact ? "h-8 bg-card border-border/40" : "h-7 bg-muted/90 border-border/80 font-mono backdrop-blur-sm"}`}>
                {!compact && <div className="w-2.5 h-2.5 mx-auto border-r border-b border-muted-foreground/40" />}
              </th>

              {/* Column Headers: A, B, C... */}
              {Array.from({ length: colCount }).map((_, cIdx) => {
                const colLetter = String.fromCharCode(65 + cIdx);
                const isColActive = selectedCell.col === cIdx;
                return (
                  <th
                    key={colLetter}
                    className={`sticky top-0 z-20 px-2 border-r border-b text-center text-[11px] font-semibold transition-colors ${compact ? "h-8 min-w-[88px] bg-card border-border/40 tracking-wide" : "h-7 min-w-[100px] border-border/80 font-mono backdrop-blur-sm"} ${
                      isColActive
                        ? compact
                          ? "text-brand shadow-[inset_0_-2px_0_var(--brand)]"
                          : "bg-green-500/20 text-green-600 dark:text-green-400 border-b-2 border-b-green-500"
                        : compact
                          ? "text-muted-foreground/70"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {colLetter}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rowCount }).map((_, rIdx) => {
              const rowNum = rIdx + 1;
              const isRowActive = selectedCell.row === rIdx;

              return (
                <tr key={rowNum} className="group">
                  {/* Row Header: 1, 2, 3... */}
                  <td
                    className={`sticky left-0 z-10 w-10 min-w-[40px] max-w-[40px] px-1.5 border-r border-b text-center text-[11px] font-medium tabular-nums transition-colors select-none ${compact ? "h-11 bg-card border-border/40" : "h-7 border-border/80 font-mono backdrop-blur-sm"} ${
                      isRowActive
                        ? compact
                          ? "text-brand shadow-[inset_-2px_0_0_var(--brand)]"
                          : "bg-green-500/20 text-green-600 dark:text-green-400 border-r-2 border-r-green-500"
                        : compact
                          ? "text-muted-foreground/70"
                          : "bg-muted/70 text-muted-foreground group-hover:bg-muted"
                    }`}
                  >
                    {rowNum}
                  </td>

                  {/* Row Cells */}
                  {Array.from({ length: colCount }).map((_, cIdx) => {
                    const id = cellId(cIdx, rIdx);
                    const cell = cells[id];
                    const selected = isCellSelected(cIdx, rIdx);
                    const isCurrent = selectedCell.col === cIdx && selectedCell.row === rIdx;
                    const targeted = isTarget(id);
                    const rangeHighlight = isRangeHighlighted(id);

                    // Display text formatting
                    const displayValue = cell
                      ? formatCellValue(cell.value, cell.format)
                      : "";

                    const alignClass =
                      cell?.format?.align === "center"
                        ? "text-center"
                        : cell?.format?.align === "right"
                        ? "text-right"
                        : typeof cell?.value?.computed === "number"
                        ? "text-right"
                        : "text-left";

                    const isBold = cell?.format?.bold ? "font-bold" : "";
                    const isItalic = cell?.format?.italic ? "italic" : "";
                    const isUnderline = cell?.format?.underline ? "underline" : "";

                    const customBg = cell?.format?.bgColor || undefined;
                    const customText = cell?.format?.textColor || undefined;

                    return (
                      <td
                        key={id}
                        data-cell-id={id}
                        onClick={() => {
                          setSelectedCell({ col: cIdx, row: rIdx });
                          setSelectionRange(null);
                        }}
                        onDoubleClick={() => {
                          setSelectedCell({ col: cIdx, row: rIdx });
                          startEditing();
                        }}
                        onMouseDown={() => {
                          if (isEditing && editingCellId !== id) finishEditing();
                          setIsSelecting(true);
                          setSelectedCell({ col: cIdx, row: rIdx });
                          setSelectionRange({
                            start: { col: cIdx, row: rIdx },
                            end: { col: cIdx, row: rIdx },
                          });
                        }}
                        onMouseEnter={() => {
                          if (isSelecting && selectionRange) {
                            setSelectionRange((prev) =>
                              prev ? { ...prev, end: { col: cIdx, row: rIdx } } : null
                            );
                          }
                        }}
                        onMouseUp={() => {
                          setIsSelecting(false);
                        }}
                        style={{
                          backgroundColor: customBg,
                          color: customText,
                        }}
                        className={`relative border-r border-b transition-colors overflow-hidden whitespace-nowrap text-ellipsis cursor-cell ${compact ? "h-11 px-3 text-[14px] tabular-nums border-border/40" : "h-7 px-2 text-xs font-mono border-border/60"} ${alignClass} ${isBold} ${isItalic} ${isUnderline} ${
                          selected
                            ? "bg-green-500/10 dark:bg-green-500/15"
                            : targeted
                            ? compact
                              ? "bg-brand-soft/70"
                              : "bg-amber-500/15 dark:bg-amber-500/20 animate-pulse ring-1 ring-amber-500"
                            : rangeHighlight
                            ? "bg-green-500/10 dark:bg-green-500/15"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Target marker: a dashed green frame in lessons, a corner badge elsewhere */}
                        {targeted &&
                          (compact ? (
                            <span className="pointer-events-none absolute inset-[3px] rounded-md border-2 border-dashed border-brand/70" />
                          ) : (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-bl-sm" />
                          ))}
                        {targeted && compact && !cell?.value.raw && !(isEditing && (editingCellId ?? currentCellId) === id) && (
                          <span className="pointer-events-none text-[12px] italic text-brand/60">type here</span>
                        )}

                        {/* Inline editor when this cell is being edited */}
                        {isEditing && (editingCellId ?? currentCellId) === id ? (
                          <div className="absolute inset-0 z-30 flex items-center bg-background ring-2 ring-green-500 shadow-md">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => finishEditing()}
                              className="w-full h-full px-2 font-mono text-xs bg-transparent text-foreground focus:outline-none"
                            />

                            {/* Autocomplete suggestions dropdown */}
                            {suggestions.length > 0 && (
                              <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                  Formula Suggestions
                                </div>
                                {suggestions.map((s, idx) => (
                                  <div
                                    key={s.name}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      insertSuggestion(s.name);
                                    }}
                                    className={`px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                                      idx === selectedSuggestionIdx
                                        ? "bg-green-500/20 text-green-600 dark:text-green-400 font-semibold"
                                        : "hover:bg-muted/60"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono">{s.name}</span>
                                      <span className="text-[10px] text-muted-foreground">Tab ⇥</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {s.desc}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Normal Cell Content
                          <span>
                            {cell?.value.type === "error" ? (
                              <span className="text-rose-500 font-bold">
                                {cell.value.error || "#ERROR!"}
                              </span>
                            ) : (
                              displayValue
                            )}
                          </span>
                        )}

                        {/* Excel Active Cell Border Cursor & Fill Handle */}
                        {isCurrent && !isEditing && (
                          <>
                            <div className={`absolute inset-0 pointer-events-none z-10 ${compact ? "ring-[2.5px] ring-inset ring-brand" : "ring-2 ring-green-600 dark:ring-green-500"}`} />
                            {/* Fill Handle bottom right dot */}
                            <div
                              className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-600 dark:bg-green-500 border border-background z-20 cursor-crosshair rounded-[0.5px]"
                              title="Drag to auto-fill"
                            />
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Excel window: sheet tabs and status bar ──────────────────────── */}
      {excelChrome && (
        <>
          <ExcelSheetTabs names={workbook.sheets.map((sh) => sh.name)} />
          <ExcelStatusBar mode={isEditing ? "Enter" : "Ready"} stats={selectedStats} />
        </>
      )}

      {/* ─── Excel Bottom Status Bar & Sheet Tabs ─────────────────────────── */}
      {!excelChrome && (showSheetTabs || showStatusBar) && (
      <div className="flex items-center justify-between border-t border-border/80 bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-sm select-none">
        {/* Left: Sheet Tabs */}
        {showSheetTabs && (
          <div className="flex items-center space-x-1">
            {workbook.sheets.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => setActiveSheetId(sheet.id)}
                className={`px-3 py-0.5 rounded-t font-medium border-t-2 transition-colors ${
                  activeSheetId === sheet.id
                    ? "bg-background text-green-600 dark:text-green-400 border-green-500 shadow-sm"
                    : "border-transparent hover:bg-muted/60"
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        )}

        {/* Right: Excel Metrics & Status */}
        {showStatusBar && (
          <div className="flex items-center space-x-3 ml-auto font-mono text-[11px]">
            <span className="text-muted-foreground/70 uppercase">
              {isEditing ? "EDIT" : "READY"}
            </span>

            {selectedStats.avg !== null && (
              <span className="hidden sm:inline-block">
                Average: <span className="font-semibold text-foreground">{selectedStats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </span>
            )}

            {selectedStats.count > 0 && (
              <span>
                Count: <span className="font-semibold text-foreground">{selectedStats.count}</span>
              </span>
            )}

            {selectedStats.sum !== null && (
              <span>
                Sum: <span className="font-semibold text-foreground">{selectedStats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </span>
            )}

            <div className="h-3 w-[1px] bg-border/80 mx-1 hidden sm:block" />
            <span className="text-muted-foreground/70 hidden sm:inline-block">100%</span>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

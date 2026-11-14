export type Shortcut = { action: string; win: string; mac: string };
export type ShortcutGroup = { title: string; items: Shortcut[] };

/** Keys for Excel for Windows and Excel for Mac. On Mac laptops, Home, End, Page Up and Page Down need fn. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Essentials",
    items: [
      { action: "Copy", win: "Ctrl + C", mac: "⌘ C" },
      { action: "Cut", win: "Ctrl + X", mac: "⌘ X" },
      { action: "Paste", win: "Ctrl + V", mac: "⌘ V" },
      { action: "Paste special", win: "Ctrl + Alt + V", mac: "⌃ ⌘ V" },
      { action: "Undo", win: "Ctrl + Z", mac: "⌘ Z" },
      { action: "Redo", win: "Ctrl + Y", mac: "⌘ Y" },
      { action: "Save", win: "Ctrl + S", mac: "⌘ S" },
      { action: "Find", win: "Ctrl + F", mac: "⌘ F" },
      { action: "Find and replace", win: "Ctrl + H", mac: "⌃ H" },
      { action: "Print", win: "Ctrl + P", mac: "⌘ P" },
    ],
  },
  {
    title: "Move around",
    items: [
      { action: "Jump to the edge of the data", win: "Ctrl + Arrow", mac: "⌘ Arrow" },
      { action: "Go to cell A1", win: "Ctrl + Home", mac: "⌃ Home" },
      { action: "Go to the last used cell", win: "Ctrl + End", mac: "⌃ End" },
      { action: "Next sheet", win: "Ctrl + Page Down", mac: "⌥ →" },
      { action: "Previous sheet", win: "Ctrl + Page Up", mac: "⌥ ←" },
      { action: "Go to a cell or range", win: "Ctrl + G", mac: "⌃ G" },
    ],
  },
  {
    title: "Select",
    items: [
      { action: "Select the data region, then the whole sheet", win: "Ctrl + A", mac: "⌘ A" },
      { action: "Extend the selection to the edge", win: "Ctrl + Shift + Arrow", mac: "⌘ ⇧ Arrow" },
      { action: "Extend the selection one cell", win: "Shift + Arrow", mac: "⇧ Arrow" },
      { action: "Select the whole column", win: "Ctrl + Space", mac: "⌃ Space" },
      { action: "Select the whole row", win: "Shift + Space", mac: "⇧ Space" },
    ],
  },
  {
    title: "Edit cells",
    items: [
      { action: "Edit the active cell", win: "F2", mac: "⌃ U" },
      { action: "New line inside a cell", win: "Alt + Enter", mac: "⌥ Return" },
      { action: "Fill the selection with what you typed", win: "Ctrl + Enter", mac: "⌃ Return" },
      { action: "Fill down", win: "Ctrl + D", mac: "⌘ D" },
      { action: "Fill right", win: "Ctrl + R", mac: "⌘ R" },
      { action: "Flash Fill", win: "Ctrl + E", mac: "⌃ E" },
      { action: "Insert today's date", win: "Ctrl + ;", mac: "⌃ ;" },
      { action: "Insert the current time", win: "Ctrl + Shift + ;", mac: "⌘ ;" },
      { action: "Insert cells, rows or columns", win: "Ctrl + Shift + +", mac: "⌃ ⇧ =" },
      { action: "Delete cells, rows or columns", win: "Ctrl + -", mac: "⌘ -" },
    ],
  },
  {
    title: "Formulas",
    items: [
      { action: "AutoSum", win: "Alt + =", mac: "⌘ ⇧ T" },
      { action: "Switch between relative and absolute references ($)", win: "F4", mac: "⌘ T" },
      { action: "Show formulas instead of results", win: "Ctrl + `", mac: "⌃ `" },
      { action: "Insert a function", win: "Shift + F3", mac: "⇧ F3" },
      { action: "Accept the suggested function", win: "Tab", mac: "Tab" },
      { action: "Recalculate all workbooks", win: "F9", mac: "⌘ =" },
    ],
  },
  {
    title: "Format",
    items: [
      { action: "Bold", win: "Ctrl + B", mac: "⌘ B" },
      { action: "Italic", win: "Ctrl + I", mac: "⌘ I" },
      { action: "Underline", win: "Ctrl + U", mac: "⌘ U" },
      { action: "Strikethrough", win: "Ctrl + 5", mac: "⌘ ⇧ X" },
      { action: "Open Format Cells", win: "Ctrl + 1", mac: "⌘ 1" },
      { action: "Currency format", win: "Ctrl + Shift + $", mac: "⌃ ⇧ $" },
      { action: "Percent format", win: "Ctrl + Shift + %", mac: "⌃ ⇧ %" },
    ],
  },
  {
    title: "Tables, filters and sheets",
    items: [
      { action: "Make the range a table", win: "Ctrl + T", mac: "⌃ T" },
      { action: "Turn filters on or off", win: "Ctrl + Shift + L", mac: "⌘ ⇧ F" },
      { action: "Hide rows", win: "Ctrl + 9", mac: "⌃ 9" },
      { action: "Hide columns", win: "Ctrl + 0", mac: "⌃ 0" },
      { action: "Group rows or columns", win: "Alt + Shift + →", mac: "⌘ ⇧ K" },
      { action: "Insert a new sheet", win: "Shift + F11", mac: "⇧ F11" },
    ],
  },
];

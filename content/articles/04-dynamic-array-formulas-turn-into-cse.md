---
title: "Why Excel Turns Your Dynamic Array Formula into a {CSE} Formula (and How to Stop It)"
description: "You entered =UNIQUE(SORT(...)) and Excel changed it to {=UNIQUE(SORT(...))}. Here's why it happens and how to get your spilling formula back."
keywords: [excel curly braces formula, dynamic array CSE, unique sort curly brackets, formula not spilling, legacy array formula]
---

# Why Excel Turns Your Dynamic Array Formula into a {CSE} Formula (and How to Stop It)

You type a modern formula like:

```excel
=UNIQUE(SORT(A2:A100))
```

and open the file later (or open it on another computer) to find:

```excel
{=UNIQUE(SORT(A2:A100))}
```

The curly braces mean Excel has turned it into a **legacy array formula**, also called a **CSE formula** (Ctrl+Shift+Enter). It no longer spills. It's locked to a fixed range of cells, and editing it gives you the old *"You can't change part of an array"* error.

Here's why this happens and how to fix it.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Background: two kinds of array formulas

**Legacy (CSE) array formulas.** Before 2018, formulas that returned multiple results had to be entered with **Ctrl+Shift+Enter**. Excel showed them with `{ }` braces and fixed them to a pre-selected range.

**Dynamic array formulas.** Excel 365 and Excel 2021+ have a new calculation engine. Formulas like `UNIQUE`, `SORT`, `FILTER`, and `SEQUENCE` **spill** automatically into as many cells as they need. You don't need braces or Ctrl+Shift+Enter.

Microsoft built compatibility between the two. When a workbook with dynamic array formulas is opened in a version that **doesn't support them**, Excel converts the formulas to legacy CSE arrays so they still show something. That conversion is where the braces come from.

---

## Cause 1: The file was opened or saved in an older Excel version

This is the most common cause. Someone opens the workbook in **Excel 2016 or 2019** (or an older Mac version), and the dynamic formula is shown as a CSE array covering the spill range it had when last saved. If they **save** the file, it stays that way.

When you reopen it in Excel 365, the formula is still a fixed CSE array.

**Signs:** The braces appear after a colleague edited the file, or the file went through a shared drive or email to someone on an older version.

**Note:** In Excel 2019 and older, `UNIQUE`, `SORT`, and `FILTER` don't exist. The formula shows as `_xlfn.UNIQUE(...)` or returns `#NAME?` once it recalculates.

---

## Cause 2: You pressed Ctrl+Shift+Enter out of habit

In Excel 365, if you confirm a formula with **Ctrl+Shift+Enter** instead of plain **Enter**, Excel creates a legacy CSE array on purpose. People who learned Excel before 2018 often do this from muscle memory.

---

## Cause 3: An add-in, macro, or third-party tool rewrote the formula

VBA code that writes formulas with `.FormulaArray` (instead of `.Formula2`) creates CSE arrays. Some reporting tools, file converters, and older add-ins do the same.

In VBA:

```vba
' Creates a legacy CSE array:
Range("C2").FormulaArray = "=UNIQUE(SORT(A2:A100))"

' Creates a modern spilling formula:
Range("C2").Formula2 = "=UNIQUE(SORT(A2:A100))"
```

Also, `.Formula` (without the 2) may add an **implicit intersection operator** (`@`) to dynamic formulas. Use `.Formula2` for anything that should spill.

---

## Cause 4: Google Sheets or another app saved the file

Round-tripping an `.xlsx` through Google Sheets, LibreOffice, Numbers, or similar apps can rewrite dynamic array formulas as array formulas. In Google Sheets they show up wrapped in `ARRAYFORMULA()`, and back in Excel they come out as CSE arrays.

---

## How to fix it: convert back to a spilling formula

1. **Select the entire old array range.** Click one cell in it and press **Ctrl+/** to select the whole array (or use **Home → Find & Select → Go To Special → Current array**).
2. Press **Delete** to clear it. (You can't edit or delete part of a CSE array.)
3. Click the **top-left cell** only.
4. Type the formula **without braces**:
   ```excel
   =UNIQUE(SORT(A2:A100))
   ```
5. Press **Enter**, not Ctrl+Shift+Enter.

The formula now spills. A thin blue border around the results confirms that it's a dynamic array.

> Don't type the `{ }` braces yourself. Typed braces make Excel treat the formula as text or as an array constant, not as an array formula.

---

## How to stop it happening again

- **Standardise on Excel 365/2021+** for anyone who edits the workbook. Viewing in an older version is mostly fine; *saving* from it causes the conversion.
- **Add a note** to the workbook (for example a header in cell A1): *"Requires Excel 365. Do not save in older versions."*
- **Make it a habit to press Enter.** In modern Excel, Ctrl+Shift+Enter is almost never needed.
- **Update macros** to use `.Formula2`.
- **Avoid round-tripping** through Google Sheets or LibreOffice for workbooks that use dynamic arrays.
- If you must support older versions, **don't use dynamic array functions**. Use a pivot table or INDEX/MATCH-based approaches instead.

---

## Quick diagnosis table

| You see | Likely cause | Fix |
|---|---|---|
| `{=UNIQUE(...)}` after a colleague edited | Saved in Excel 2019 or older | Clear the array, re-enter with Enter |
| `{=...}` right after you typed it | Pressed Ctrl+Shift+Enter | Re-enter with Enter |
| `{=...}` after a macro runs | VBA uses `.FormulaArray` | Switch to `.Formula2` |
| `_xlfn.UNIQUE` or `#NAME?` | Opened in a version without the function | Open in Excel 365/2021+ |
| `=@UNIQUE(...)` returning one value | Implicit intersection added | Remove the `@` |


---

## Learn dynamic arrays hands-on

Practise `UNIQUE`, `SORT`, and `FILTER` in a live sheet on **Excelio**, with every answer checked, so you know which formulas spill and why.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Ranking Text Answers from Survey Data](05-rank-text-survey-answers.md), which uses `UNIQUE` and `SORT` in practice.

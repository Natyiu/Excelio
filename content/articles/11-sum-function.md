---
title: "Excel SUM Function: AutoSum, Shortcuts and Why Your Total Is Wrong"
description: "Everything about SUM in Excel: syntax, the Alt+= shortcut, summing multiple ranges, and the reasons a SUM returns 0 or a wrong total."
keywords: [sum function excel, excel sum formula, autosum shortcut, alt equals excel, excel sum not working, sum returns 0]
---

# Excel SUM Function: AutoSum, Shortcuts and Why Your Total Is Wrong

SUM is the first function almost everyone learns. Most people stop at `=SUM(A1:A10)`. There are a few habits worth picking up, and one very common reason a SUM quietly returns the wrong number.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax

```excel
=SUM(number1, [number2], ...)
```

Each argument can be a number, a cell, or a range. You can give it up to 255 of them.

```excel
=SUM(B2:B13)              → total of one range
=SUM(B2:B13, D2:D13)      → two ranges added together
=SUM(B2:B13, 500)         → range plus a fixed amount
```

---

## AutoSum: Alt + =

Click the empty cell directly under a column of numbers and press **Alt + =** (on Mac, **Cmd + Shift + T**). Excel writes the SUM and guesses the range. Press Enter to accept.

It works for rows too: click the empty cell to the right of a row of numbers.

**Power move:** select a block of numbers *plus* an empty row below and an empty column to the right, then press Alt + =. Excel fills in every row total, column total, and the grand total at once.

---

## SUM vs the + sign

`=B2+B3+B4` works, but:

- It's tedious for long ranges and easy to miss a cell.
- If any cell contains text, `+` returns `#VALUE!`. SUM simply ignores text.
- SUM ranges expand automatically when you insert rows *inside* them.

Use `+` for two or three specific cells and SUM for everything else.

---

## Quick totals without a formula

Select any range and look at the **status bar** at the bottom of the window. It shows Sum, Average and Count instantly. Right-click the status bar to add Min and Max.

---

## Why your SUM is wrong

**1. Numbers stored as text.** Imported data often contains "numbers" that are really text. SUM skips them, so the total is too low. Signs:
- Values are left-aligned
- A small green triangle in the cell corner
- `=ISTEXT(B5)` returns TRUE

Fix: select the column, go to **Data → Text to Columns → Finish**, or use the warning icon's **Convert to Number**.

**2. The range doesn't include new rows.** Data added *below* the last row of the range isn't counted. Convert the data to a **Table (Ctrl + T)** and use `=SUM(Table1[Sales])`, which grows automatically.

**3. Hidden or filtered rows are included.** SUM adds everything, visible or not. To total only visible rows after filtering, use:

```excel
=SUBTOTAL(109, B2:B100)
```

or `=AGGREGATE(9, 5, B2:B100)`.

**4. Calculation is set to Manual.** If totals don't update, check **Formulas → Calculation Options → Automatic**.

**5. Displayed decimals.** A cell showing 10 might contain 9.6. The SUM is right but the visible numbers don't add up. Use `ROUND` where precision matters.

---

## Sum with conditions

To add only the rows that meet a condition ("sales in the North region", "amounts over 1,000"), use SUMIF and SUMIFS. See [SUMIF and SUMIFS explained](12-sumif-sumifs.md).

---

## Quick reference

- `=SUM(range)` adds numbers and ignores text.
- **Alt + =** inserts AutoSum.
- Status bar = instant totals.
- `SUBTOTAL(109, …)` sums only visible rows.
- Low total? Check for numbers stored as text.

---

## Build the Alt + = habit

**Excelio's** lessons make you use the shortcut, not just read about it, so it sticks.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [SUMIF and SUMIFS](12-sumif-sumifs.md) · [AVERAGE, AVERAGEIF and AVERAGEIFS](13-average-function.md)

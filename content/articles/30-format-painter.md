---
title: "Format Painter in Excel: Copy Formatting in One Click (and the Shortcuts)"
description: "Copy fonts, colours, borders, number formats and conditional formatting with Format Painter. Learn the double-click trick, keyboard alternatives and Paste Special Formats."
keywords: [format painter excel, copy formatting excel, format painter shortcut, paste formatting excel, paste special formats]
---

# Format Painter in Excel: Copy Formatting in One Click (and the Shortcuts)

You've formatted one header row perfectly: bold, fill colour, border, centred. Now you need it on six more tables. Format Painter copies all of that in a click, and a couple of tricks make it much faster.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The basics

1. Click the cell (or range) with the formatting you want.
2. Click **Home → Format Painter** (the paintbrush icon). The cursor turns into a brush.
3. Click or drag over the target cells.

Done. The format is applied once and the brush turns off.

---

## The double-click trick

**Double-click** the Format Painter button instead of single-clicking. The brush stays on, so you can paint as many places as you want, even on other sheets. Press **Esc** when you're finished.

This one habit saves more time than anything else on this page.

---

## What gets copied

Format Painter copies **everything except the value**:

- Font, size, colour, bold/italic/underline
- Fill colour and borders
- Number format (currency, %, dates)
- Alignment, wrap text, indentation
- Conditional formatting rules
- Merged cell layout

It does **not** copy the contents. It *does* copy data validation rules, which can surprise you if you paint over a drop-down column.

---

## Copy formatting with the keyboard

There's no single built-in shortcut for Format Painter, but Paste Special does the same job:

1. Copy the source cell: **Ctrl + C**
2. Select the target
3. **Ctrl + Alt + V**, then **T**, then **Enter** (Paste Special → Formats)

On Windows you can also press **Alt, H, F, P** to start Format Painter from the keyboard.

---

## Copy column widths

Format Painter applied to a whole column (click the column letter first) also copies the **column width**. For widths only, use Paste Special → **Column widths** (Ctrl + Alt + V → W).

---

## Copy formatting across a whole table

Select a **full formatted row** as the source, then paint over several rows at once. Excel repeats the pattern, so alternating "banded" rows copy correctly.

Usually the better long-term option is an **Excel Table (Ctrl + T)**. It applies consistent formatting automatically, including banding, to every new row.

---

## Clear formatting

The reverse: **Home → Clear → Clear Formats** (Alt, H, E, F) removes all formatting but keeps the values.

---

## Quick formatting shortcuts worth knowing

| Action | Windows | Mac |
|---|---|---|
| Bold | Ctrl + B | Cmd + B |
| Italic | Ctrl + I | Cmd + I |
| Underline | Ctrl + U | Cmd + U |
| Format Cells dialog | Ctrl + 1 | Cmd + 1 |
| Currency format | Ctrl + Shift + $ | Ctrl + Shift + $ |
| Percent format | Ctrl + Shift + % | Ctrl + Shift + % |

More in [Excel Keyboard Shortcuts](34-excel-keyboard-shortcuts.md).

---

## Practise it hands-on

**Excelio** has formatting tasks where you use the shortcut, not just read about it.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Excel Keyboard Shortcuts](34-excel-keyboard-shortcuts.md) · [Drop-Down Lists](29-drop-down-list.md)

---
title: "Absolute vs Relative References in Excel ($ Signs Explained)"
description: "Why your formulas break when you copy them, and how the $ sign fixes it. Relative, absolute, and mixed references explained with examples."
keywords: [absolute reference excel, relative reference, dollar sign in excel formula, mixed reference, F4 excel]
---

# Absolute vs Relative References in Excel ($ Signs Explained)

You write a formula and it works. You copy it down the column and suddenly the results are wrong, or you get a column of zeros or `#REF!` errors.

The cause is almost always cell references. Missing `$` signs is one of the most common beginner mistakes: the formula shifts when you copy it down or across, and it ends up pointing at the wrong cells.

Once you understand the `$` sign, this problem goes away.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Relative references: the default

When you type `=A2*B2`, Excel doesn't really store "A2" and "B2". It stores a **position relative to the formula cell**: "the cell two columns to my left" and "the cell one column to my left."

So when you copy the formula from C2 to C3, it becomes `=A3*B3`. Usually that's what you want: each row multiplies its own numbers.

| | A (Qty) | B (Price) | C (Total) |
|---|---|---|---|
| 2 | 5 | 10 | `=A2*B2` → 50 |
| 3 | 3 | 20 | `=A3*B3` → 60 |
| 4 | 8 | 15 | `=A4*B4` → 120 |

---

## Where relative references go wrong

Now add a tax rate in cell F1 (say 8%) and calculate tax for each row:

```excel
=C2*F1
```

Row 2 is correct. Copy it down and you get:

```excel
=C3*F2   ← F2 is empty
=C4*F3   ← F3 is empty
```

The reference to F1 moved down with the formula, so every row after the first multiplies by an empty cell and returns 0.

---

## Absolute references: lock it with $

A `$` sign tells Excel **not to move** that part of the reference.

```excel
=C2*$F$1
```

Copy this down and you get `=C3*$F$1`, `=C4*$F$1`, and so on. The tax rate stays fixed while the row reference still moves.

**Rule of thumb:** If every copy of the formula should point at the same cell (a rate, a total, a lookup table), make the reference absolute.

---

## Mixed references: lock just the row or just the column

The `$` locks whatever comes right after it:

| Reference | Column | Row | Name |
|---|---|---|---|
| `A1` | moves | moves | Relative |
| `$A$1` | locked | locked | Absolute |
| `$A1` | locked | moves | Mixed (column locked) |
| `A$1` | moves | locked | Mixed (row locked) |

### When do you need mixed references?

When you copy a formula **both across and down**. The classic example is a multiplication table:

|   | A | B | C | D |
|---|---|---|---|---|
| 1 |   | 1 | 2 | 3 |
| 2 | 1 | | | |
| 3 | 2 | | | |
| 4 | 3 | | | |

In B2, enter:

```excel
=$A2*B$1
```

- `$A2`: always use column A (the row headers), but let the row change.
- `B$1`: always use row 1 (the column headers), but let the column change.

Fill it across and down and every cell computes correctly. One formula fills the whole grid.

The same pattern works for real tasks such as a price × discount matrix, or sales by region (rows) × month (columns) divided by a monthly target in row 1.

---

## The F4 shortcut

Don't type the `$` signs. While editing a formula, click on a reference (or put the cursor in it) and press **F4**. Each press cycles through:

`A1` → `$A$1` → `A$1` → `$A1` → `A1`

On a Mac, use **Cmd+T** (or **Fn+F4** on some keyboards).

---

## References to lookup tables

Lookup formulas are where missing `$` signs cause the most damage:

```excel
=VLOOKUP(A2, D2:F100, 2, FALSE)
```

Fill that down and the table range moves: `D3:F101`, `D4:F102`... Rows at the top of the table stop being searched and you start getting `#N/A`.

Always lock the table:

```excel
=VLOOKUP(A2, $D$2:$F$100, 2, FALSE)
```

---

## A better option: names and Tables

Two features remove the need for `$` signs in many cases:

**Named ranges.** Select F1, type `TaxRate` into the Name Box (left of the formula bar), and press Enter. Now write:

```excel
=C2*TaxRate
```

Names are always absolute, and they make formulas easier to read.

**Excel Tables (Ctrl+T).** Formulas inside a Table use structured references like `=[@Qty]*[@Price]`. They fill down automatically and don't shift.

---

## Quick reference

- **Relative (`A1`)**: the reference moves when copied. Use it for row-by-row calculations.
- **Absolute (`$A$1`)**: the reference never moves. Use it for constants, rates, and lookup tables.
- **Mixed (`$A1` / `A$1`)**: only one part moves. Use it for formulas copied both across and down.
- **F4** cycles through the options.
- If copying a formula gives zeros, `#REF!`, or `#N/A` partway down, check your `$` signs first.


---

## Practise $ signs until they're automatic

**Excelio's** free formula lessons have you copy formulas across real data in a live sheet, so you see right away when a reference shifts.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Why VLOOKUP Returns #N/A](01-vlookup-na-error-fix.md)

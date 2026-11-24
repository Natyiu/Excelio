---
title: "Excel Logical Operators: =, <>, >, <, >=, <= Explained"
description: "The six comparison operators in Excel, how they behave with text, dates and blanks, how to use them in IF and COUNTIF criteria, and the not-equal-to trap."
keywords: [excel logical operators, not equal to excel, greater than or equal to excel, excel comparison operators, excel operators in formulas]
---

# Excel Logical Operators: =, <>, >, <, >=, <= Explained

Every IF, COUNTIF, FILTER and conditional formatting rule starts with a comparison. Excel has six comparison operators, and they behave in a few surprising ways with text, dates and blank cells.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The six operators

| Operator | Meaning | Example | Result (A2 = 50) |
|---|---|---|---|
| `=` | equal to | `=A2=50` | TRUE |
| `<>` | not equal to | `=A2<>50` | FALSE |
| `>` | greater than | `=A2>40` | TRUE |
| `<` | less than | `=A2<40` | FALSE |
| `>=` | greater than or equal to | `=A2>=50` | TRUE |
| `<=` | less than or equal to | `=A2<=49` | FALSE |

Type any of these straight into a cell and you'll see TRUE or FALSE. The first `=` starts the formula. The second one is the comparison.

**Not equal to is `<>`**, not `!=` as in many programming languages.

---

## Text comparisons

- **Not case-sensitive**: `="apple"="APPLE"` → TRUE. Use `EXACT()` for case-sensitive checks.
- **Spaces count**: `="Paris"="Paris "` → FALSE. A trailing space is the most common reason a "match" fails.
- **Alphabetical order**: `="b">"a"` → TRUE, so `>` and `<` work alphabetically.
- **Text is always "greater" than numbers**: `="1">5` → TRUE, because "1" is text. Numbers stored as text cause odd results like this.

---

## Dates

Dates are numbers, so comparisons work, but write the date in a way Excel recognises:

```excel
=A2>DATE(2026,1,1)        ✅ reliable
=A2>"1/1/2026"            ⚠️ depends on regional settings
=A2>=TODAY()              ✅ today or later
```

---

## Blank cells

- `=A2=""` is TRUE for empty cells **and** for formulas returning `""`.
- `=ISBLANK(A2)` is TRUE only for truly empty cells.
- A blank cell compared to a number acts as 0: `=A2<5` is TRUE when A2 is empty. This is a common source of "why is this row flagged?"

---

## In IF and formulas

```excel
=IF(B2>=C2, "Target met", "Below target")
=IF(D2<>"", "Has notes", "")
```

## In COUNTIF / SUMIF criteria: inside quotes

Criteria are **text**, so the operator goes inside quotes:

```excel
=COUNTIF(B2:B100, ">=50")
=COUNTIF(B2:B100, "<>Closed")
=SUMIF(B2:B100, ">"&F1, C2:C100)
```

The cell reference goes **outside** the quotes, joined with `&`. `">F1"` would look for the literal text "F1".

---

## TRUE and FALSE are numbers too

In maths, TRUE = 1 and FALSE = 0, which makes some neat tricks possible:

```excel
=(B2>=50)*100           → 100 if passed, 0 if not
=SUM(--(B2:B100>=50))   → count of passes (Microsoft 365)
```

The `--` turns TRUE/FALSE into 1/0.

---

## Order of operations

Comparisons are evaluated **after** arithmetic and `&`:

```excel
=A2+10>50     → (A2+10) > 50
```

Use brackets whenever it's ambiguous.

---

## Quick reference

- `<>` means not equal.
- Text comparisons ignore case but not spaces.
- In COUNTIF/SUMIF criteria, put the operator in quotes and join cell references with `&`.
- Blank compared to a number acts as 0.

---

## Practise comparisons in context

**Excelio** gives you comparison tasks inside IF, COUNTIF and FILTER, which are the places they matter.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [The IF Function](25-if-function.md) · [AND, OR, NOT and XOR](27-and-or-not-xor.md) · [COUNTIF and COUNTIFS](15-countif-countifs.md)

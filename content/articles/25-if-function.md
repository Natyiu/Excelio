---
title: "The Excel IF Function: Simple, Nested and Combined With AND/OR"
description: "Learn the IF function step by step: basic tests, text and number results, nested IFs for grades and tiers, combining with AND/OR, and fixing common IF errors."
keywords: [if function excel, excel if formula, nested if excel, if and excel, if or excel, if statement excel multiple conditions]
---

# The Excel IF Function: Simple, Nested and Combined With AND/OR

IF is how a spreadsheet makes decisions: pass or fail, on time or late, bonus or no bonus. It's also the function people search for most after VLOOKUP and SUM.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax

```excel
=IF(logical_test, value_if_true, value_if_false)
```

Read it as: **if** this is true, **then** this, **otherwise** that.

```excel
=IF(B2>=50, "Pass", "Fail")
```

| | A (Student) | B (Score) | C (Result) |
|---|---|---|---|
| 2 | Amara | 72 | Pass |
| 3 | Bilal | 48 | Fail |
| 4 | Chen | 50 | Pass |

Text results go in quotes. Numbers and formulas don't.

---

## Returning calculations

IF can return the result of a calculation:

```excel
=IF(C2>10000, C2*5%, 0)                 → 5% bonus on sales over 10,000
=IF(D2="Express", 9.99, 4.99)           → shipping price
=IF(E2<TODAY(), "Overdue", "")          → blank when not overdue
```

`""` returns an empty-looking cell, which keeps reports clean.

---

## Nested IF: more than two outcomes

Grade bands: 80+ = A, 65+ = B, 50+ = C, otherwise F.

```excel
=IF(B2>=80, "A", IF(B2>=65, "B", IF(B2>=50, "C", "F")))
```

Excel checks the tests **in order** and stops at the first TRUE. Order matters: if you test `>=50` first, a score of 90 gets a C.

Nested IFs get hard to read beyond three or four levels. Better options:

- **IFS** (Excel 2019+): no nesting. See [IFS vs SWITCH](26-ifs-switch.md).
- **A lookup table** with XLOOKUP or VLOOKUP approximate match. This is best when the bands might change.

---

## Multiple conditions: IF with AND / OR

Bonus only if sales > 10,000 **and** rating ≥ 4:

```excel
=IF(AND(C2>10000, D2>=4), "Bonus", "No bonus")
```

Flag if the order is late **or** damaged:

```excel
=IF(OR(E2="Late", F2="Damaged"), "Review", "OK")
```

See [AND, OR, NOT and XOR](27-and-or-not-xor.md) for more.

---

## IF a cell is blank, or contains text

```excel
=IF(A2="", "Missing", "OK")
=IF(ISNUMBER(SEARCH("urgent", A2)), "Priority", "Normal")
```

`=IF(A2="*urgent*", …)` does **not** work, because IF doesn't support wildcards. Use SEARCH as shown. See [FIND vs SEARCH](20-find-vs-search.md).

---

## IF and errors

To show a message instead of `#N/A` or `#DIV/0!`, use IFERROR rather than IF:

```excel
=IFERROR(B2/C2, 0)
=IFERROR(XLOOKUP(F2, A:A, C:C), "Not found")
```

---

## Common IF mistakes

- **Missing quotes around text**: `=IF(B2=Yes, …)` gives `#NAME?`. Use `"Yes"`.
- **Quotes around numbers**: `=IF(B2>"50", …)` compares to text and gives odd results.
- **Wrong order in nested IFs**: test the most restrictive condition first.
- **Too many brackets, or too few**: Excel colours each pair. Click inside the formula to check them.
- **Leaving out value_if_false** returns FALSE, which looks odd in a report. Use `""` instead.

---

## Practice task

1. Return "High" if an order is over 500, otherwise "Standard".
2. Return "Reorder" if stock is below 20 **and** the item isn't discontinued.
3. Grade scores into A/B/C/F with a nested IF, then rewrite it with IFS.

---

## Practise logic in a live sheet

**Excelio's** logical-function lessons start with simple IFs and build up to multi-condition tests, checked instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [IFS vs SWITCH](26-ifs-switch.md) · [AND, OR, NOT and XOR](27-and-or-not-xor.md) · [Logical Operators](28-logical-operators.md)

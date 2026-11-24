---
title: "SUMIF and SUMIFS in Excel: Sum With One or Many Conditions"
description: "How to use SUMIF and SUMIFS with text, numbers, dates and wildcards, why the argument order differs, and how to fix SUMIFS returning 0."
keywords: [sumif excel, sumifs excel, sumifs multiple criteria, sumif vs sumifs, sumifs date range, sumifs returns 0]
---

# SUMIF and SUMIFS in Excel: Sum With One or Many Conditions

"What were total sales in the North?" "How much did we spend on travel in March?" Those are SUMIF and SUMIFS questions. They add up only the rows that match your conditions.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample data

| | A (Date) | B (Region) | C (Rep) | D (Amount) |
|---|---|---|---|---|
| 2 | 03-Jan-2026 | North | Amara | 1,200 |
| 3 | 11-Jan-2026 | South | Bilal | 850 |
| 4 | 02-Feb-2026 | North | Chen | 2,400 |
| 5 | 15-Feb-2026 | East | Amara | 600 |
| 6 | 04-Mar-2026 | North | Amara | 1,750 |

---

## SUMIF: one condition

```excel
=SUMIF(range, criteria, [sum_range])
```

Total for the North region:

```excel
=SUMIF(B2:B6, "North", D2:D6)   → 5,350
```

If the condition is about the numbers you're summing, you can drop sum_range:

```excel
=SUMIF(D2:D6, ">1000")   → 5,350
```

---

## SUMIFS: several conditions

```excel
=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)
```

⚠️ **The sum range comes first in SUMIFS but last in SUMIF.** This is the single most common mistake with these functions.

North region, sold by Amara:

```excel
=SUMIFS(D2:D6, B2:B6, "North", C2:C6, "Amara")   → 2,950
```

All conditions must be true (AND logic). Many people use SUMIFS even for a single condition, so they only have to remember one argument order.

---

## Criteria cheat sheet

| You want | Criteria |
|---|---|
| Equals text | `"North"` |
| Not equal | `"<>North"` |
| Greater than | `">1000"` |
| Greater than a cell | `">"&F2` |
| Blank cells | `""` |
| Not blank | `"<>"` |
| Starts with "No" | `"No*"` |
| Contains "orth" | `"*orth*"` |

Operators go **inside quotes**, and a cell reference is joined with `&`. Writing `">F2"` searches for the literal text "F2". More on `*` and `?` in [wildcards in Excel](24-wildcard-characters.md).

---

## Sum between two dates

Put the start date in F1 and the end date in F2:

```excel
=SUMIFS(D2:D6, A2:A6, ">="&F1, A2:A6, "<="&F2)
```

Using the same column twice with two conditions creates a range. For "all of February" with F1 = 01-Feb-2026:

```excel
=SUMIFS(D2:D6, A2:A6, ">="&F1, A2:A6, "<"&EDATE(F1,1))   → 3,000
```

---

## OR logic: North *or* East

SUMIFS only does AND. For OR, add two SUMIFS together:

```excel
=SUMIFS(D2:D6, B2:B6, "North") + SUMIFS(D2:D6, B2:B6, "East")
```

Or use an array constant: `=SUM(SUMIFS(D2:D6, B2:B6, {"North","East"}))`.

---

## Why SUMIFS returns 0

- **Typos or spaces**: "North " ≠ "North". Use `=TRIM()` on the source data.
- **Numbers stored as text** in the sum range are ignored.
- **Dates stored as text** never match a date comparison.
- **Ranges of different sizes** give `#VALUE!`, not 0. Check they all start and end on the same rows.
- **Operator outside the quotes**: `>"&1000` instead of `">"&1000`.

---

## Practice task

1. Total of all sales over 1,000.
2. Total for Amara in Q1 (January–March).
3. Total for every region **except** South.

---

## Get fast at conditional sums

**Excelio's** SUMIFS lessons give you messy, realistic data and check each answer instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [COUNTIF and COUNTIFS](15-countif-countifs.md) · [SUM Function](11-sum-function.md) · [Wildcards in Excel](24-wildcard-characters.md)

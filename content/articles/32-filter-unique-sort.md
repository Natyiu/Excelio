---
title: "FILTER, UNIQUE and SORT in Excel: Dynamic Array Formulas for Beginners"
description: "Learn Excel's dynamic array functions: FILTER rows by conditions, UNIQUE to remove duplicates, SORT and SORTBY, spill ranges, and how to fix #SPILL! and #CALC! errors."
keywords: [filter function excel, unique function excel, sort function excel, dynamic arrays excel, spill error excel, excel remove duplicates formula]
---

# FILTER, UNIQUE and SORT in Excel: Dynamic Array Formulas for Beginners

Microsoft 365 changed how formulas work. One formula can now return a **whole table** of results that "spills" into neighbouring cells. FILTER, UNIQUE and SORT are the three functions that make this useful every day.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample data (A1:C7)

| Rep | Region | Sales |
|---|---|---|
| Amara | North | 4,200 |
| Bilal | South | 3,100 |
| Chen | North | 5,600 |
| Dana | East | 2,800 |
| Eli | South | 4,900 |
| Amara | North | 1,500 |

---

## FILTER: rows that match a condition

```excel
=FILTER(array, include, [if_empty])
```

```excel
=FILTER(A2:C7, B2:B7="North")
```

Three rows spill out: Amara 4,200, Chen 5,600, Amara 1,500. Change the source data and the result updates.

**Multiple conditions:** multiply for AND, add for OR:

```excel
=FILTER(A2:C7, (B2:B7="North") * (C2:C7>2000))
=FILTER(A2:C7, (B2:B7="North") + (B2:B7="East"))
```

**Nothing found:** without the 3rd argument you get `#CALC!`:

```excel
=FILTER(A2:C7, B2:B7="West", "No results")
```

---

## UNIQUE: remove duplicates with a formula

```excel
=UNIQUE(A2:A7)   → Amara, Bilal, Chen, Dana, Eli
```

Unlike **Data → Remove Duplicates**, it doesn't delete anything, and it updates automatically.

- `=UNIQUE(A2:B7)` returns unique **combinations** of Rep + Region.
- `=UNIQUE(A2:A7, , TRUE)` returns values that appear **exactly once** (Bilal, Chen, Dana, Eli).
- Count distinct values: `=COUNTA(UNIQUE(A2:A7))` → 5

---

## SORT and SORTBY

```excel
=SORT(array, [sort_index], [sort_order], [by_col])
```

Sort the table by Sales (column 3), largest first:

```excel
=SORT(A2:C7, 3, -1)
```

**SORTBY** sorts by a range that doesn't need to be in the result:

```excel
=SORTBY(A2:A7, C2:C7, -1)   → rep names ordered by sales
```

---

## Combine them

This is where they become powerful.

**A sorted, unique list for a drop-down:**

```excel
=SORT(UNIQUE(B2:B7))   → East, North, South
```

**Top 3 sales in the North:**

```excel
=TAKE(SORT(FILTER(A2:C7, B2:B7="North"), 3, -1), 3)
```

**Total per rep (a mini pivot table)** in two formulas:

```excel
E2: =UNIQUE(A2:A7)
F2: =SUMIFS(C2:C7, A2:A7, E2#)
```

`E2#` refers to the whole spilled list, however long it gets.

---

## The # spill reference

When a formula spills from E2, `E2#` means "the entire result". Use it in other formulas, charts and [drop-down lists](29-drop-down-list.md) so they grow and shrink with the data.

---

## Errors you'll see

**#SPILL!**: something is in the way. The formula needs empty cells to spill into. Click the error icon → **Select Obstructing Cells**, then clear them. Spill formulas also can't go inside an Excel Table.

**#CALC!**: FILTER found nothing. Add the `if_empty` argument.

**#NAME?**: your version doesn't have these functions. They need Microsoft 365 or Excel 2021+.

**@ appearing in formulas**: older files opened in 365 sometimes get `@` added to keep old single-cell behaviour. See [why dynamic array formulas turn into CSE](04-dynamic-array-formulas-turn-into-cse.md).

---

## Practice task

1. List all sales over 4,000, sorted from highest.
2. Get a sorted list of unique regions.
3. Build a table of total sales per region using UNIQUE and SUMIFS.

---

## Learn dynamic arrays hands-on

**Excelio's** array lessons start with FILTER and UNIQUE and build up to multi-function reports, checked instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [AND, OR in Array Formulas](27-and-or-not-xor.md) · [COUNT Unique Values](14-count-counta-countblank.md) · [Pivot Tables for Beginners](33-pivot-tables.md)

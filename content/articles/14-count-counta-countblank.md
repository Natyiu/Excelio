---
title: "COUNT vs COUNTA vs COUNTBLANK in Excel: Which One to Use"
description: "COUNT counts numbers, COUNTA counts anything non-empty, COUNTBLANK counts empty cells. Learn the differences, the gotchas, and how to count unique values."
keywords: [count function excel, counta excel, count vs counta, countblank, count non blank cells excel, count unique values excel]
---

# COUNT vs COUNTA vs COUNTBLANK in Excel: Which One to Use

"How many rows do I have?" sounds simple, but Excel has several counting functions, and picking the wrong one gives a confidently wrong answer.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample column

| | A |
|---|---|
| 1 | 120 |
| 2 | Pending |
| 3 | *(blank)* |
| 4 | 45 |
| 5 | 12/03/2026 |
| 6 | `=""` (formula returning empty text) |
| 7 | TRUE |

---

## COUNT: numbers only

```excel
=COUNT(A1:A7)   → 3
```

It counted 120, 45, and the date. **Dates are numbers in Excel**, so they count. Text, blanks, TRUE/FALSE and errors don't.

Use COUNT when you want "how many cells have a numeric value", for example how many orders have an amount entered.

## COUNTA: anything that isn't empty

```excel
=COUNTA(A1:A7)   → 6
```

Everything except the truly blank A3. Note that **A6 is counted**: a formula returning `""` looks empty but isn't. This is the most common COUNTA surprise.

Use COUNTA to count rows of data, such as how many names are in a list.

## COUNTBLANK: empty cells

```excel
=COUNTBLANK(A1:A7)   → 2
```

A3 and A6. COUNTBLANK treats `""` as blank, the opposite of COUNTA. Because of this, COUNTA + COUNTBLANK can add up to more than the number of cells.

---

## Quick comparison

| Cell contains | COUNT | COUNTA | COUNTBLANK |
|---|---|---|---|
| Number / date | ✅ | ✅ | |
| Text | | ✅ | |
| TRUE / FALSE | | ✅ | |
| Error (`#N/A`) | | ✅ | |
| `=""` | | ✅ | ✅ |
| Truly empty | | | ✅ |

---

## Count rows in a filtered list

COUNT and COUNTA include hidden rows. To count only visible rows after filtering:

```excel
=SUBTOTAL(103, A2:A500)    → like COUNTA, visible only
=SUBTOTAL(102, A2:A500)    → like COUNT, visible only
```

---

## Count unique values

In Microsoft 365 / Excel 2021+:

```excel
=COUNTA(UNIQUE(A2:A500))
```

If the range includes blanks, UNIQUE returns a 0 for them. Filter them out first:

```excel
=COUNTA(UNIQUE(FILTER(A2:A500, A2:A500<>"")))
```

In older versions:

```excel
=SUMPRODUCT(1/COUNTIF(A2:A500, A2:A500))
```

The older formula fails with `#DIV/0!` if the range has blanks.

---

## Counting with conditions

To count rows where Region = "North", or amount > 500, you need COUNTIF and COUNTIFS. See [COUNTIF and COUNTIFS explained](15-countif-countifs.md).

---

## Quick reference

- **COUNT** = numbers (including dates)
- **COUNTA** = non-empty (including `""` from formulas)
- **COUNTBLANK** = empty (including `""`)
- **SUBTOTAL(103, …)** = visible non-empty cells
- **COUNTA(UNIQUE(…))** = distinct values

---

## Practise counting the right way

**Excelio** gives you messy columns full of blanks, text and dates, and checks your count instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [COUNTIF and COUNTIFS](15-countif-countifs.md) · [FILTER, UNIQUE and SORT](32-filter-unique-sort.md)

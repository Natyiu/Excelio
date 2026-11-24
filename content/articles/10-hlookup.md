---
title: "HLOOKUP in Excel: How It Works and When to Use Something Else"
description: "HLOOKUP searches across the top row of a table and returns a value from a row below. Learn the syntax, the row-number trap, and the modern alternatives."
keywords: [hlookup excel, hlookup function, hlookup vs vlookup, horizontal lookup excel, hlookup example]
---

# HLOOKUP in Excel: How It Works and When to Use Something Else

HLOOKUP is VLOOKUP turned on its side. Instead of searching down the first **column**, it searches across the first **row**, then returns a value from a row further down.

You'll meet it in older workbooks and in Excel tests, so it's worth knowing. For new work, there's usually a better option, covered at the end.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax

```excel
=HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])
```

- **lookup_value**: what you're searching for in the top row
- **table_array**: the whole table, including the top row
- **row_index_num**: which row of the table to return (1 = the top row itself)
- **range_lookup**: `FALSE` for an exact match. Always type it.

---

## A worked example

Quarterly figures are often laid out horizontally:

| | A | B | C | D | E |
|---|---|---|---|---|---|
| 1 | | Q1 | Q2 | Q3 | Q4 |
| 2 | Revenue | 40,200 | 45,900 | 43,100 | 51,800 |
| 3 | Costs | 31,000 | 33,250 | 32,400 | 36,900 |
| 4 | Profit | 9,200 | 12,650 | 10,700 | 14,900 |

To get Q3 costs:

```excel
=HLOOKUP("Q3", B1:E4, 3, FALSE)   → 32,400
```

Excel finds "Q3" in row 1 of the range, then moves down to row 3 of the range (the Costs row).

---

## The row-number trap

`row_index_num` counts rows **inside table_array**, not worksheet rows. If your table started in row 5 of the sheet, Costs would still be row 3 of the range.

It's also a hard-coded number. Insert a "Tax" row above Profit and every HLOOKUP that asked for row 4 now returns Tax instead. Nothing errors, so nobody notices.

Make it dynamic with MATCH:

```excel
=HLOOKUP("Q3", A1:E4, MATCH("Costs", A1:A4, 0), FALSE)
```

Note the table now starts at column A so the row labels are included and MATCH counts the same rows.

---

## Why your HLOOKUP returns #N/A or a wrong value

- **Missing `FALSE`**: without it, HLOOKUP does an approximate match and may return a neighbouring column's value.
- **"Q3 " with a space**, or a number stored as text in the header row.
- **Lookup value not in the top row** of table_array: HLOOKUP only searches row 1 of the range.
- **row_index_num larger than the table** gives `#REF!`.

---

## Better alternatives

**XLOOKUP (Microsoft 365, Excel 2021+)** works horizontally or vertically and returns a whole row or column with no index number:

```excel
=XLOOKUP("Q3", B1:E1, B3:E3)   → 32,400
```

**INDEX MATCH (every version)** does the same and can do two-way lookups. See [INDEX MATCH explained](09-index-match.md).

**Transpose the data.** If you control the layout, store data in columns, not rows. Tables, filters, pivot tables and most functions work better with vertical data.

---

## Quick reference

- HLOOKUP = search across the top row, return from a lower row.
- Always use `FALSE` for exact matches.
- Row numbers count from the top of the range, and they break when rows are inserted.
- Prefer XLOOKUP or INDEX MATCH in new workbooks.

---

## Practise lookups in a live sheet

**Excelio** has lookup exercises with instant checking, from HLOOKUP basics to XLOOKUP.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [INDEX MATCH](09-index-match.md) · [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md)

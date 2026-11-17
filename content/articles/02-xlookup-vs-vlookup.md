---
title: "XLOOKUP vs VLOOKUP: Which Should You Use?"
description: "A practical comparison of XLOOKUP and VLOOKUP: syntax, features, compatibility, and when the old function still makes sense."
keywords: [xlookup vs vlookup, xlookup, vlookup, index match, excel lookup functions]
---

# XLOOKUP vs VLOOKUP: Which Should You Use?

VLOOKUP has been Excel's go-to lookup function for decades. XLOOKUP replaces it and fixes most of its weaknesses. So should you stop using VLOOKUP?

**Short answer:** If everyone who opens your file has Excel 365 or Excel 2021 or later, use XLOOKUP. If your file has to work in Excel 2019 or older, stay with VLOOKUP or INDEX/MATCH.

Here's the full comparison.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax side by side

**VLOOKUP**

```excel
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
```

**XLOOKUP**

```excel
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
```

The same lookup written both ways: find the price for product ID in A2.

```excel
=VLOOKUP(A2, Products!$A$2:$D$500, 4, FALSE)
=XLOOKUP(A2, Products!$A$2:$A$500, Products!$D$2:$D$500)
```

The XLOOKUP is longer to type, but it says exactly what it does: look in *this* column, return from *that* column.

---

## Feature comparison

| Feature | VLOOKUP | XLOOKUP |
|---|---|---|
| Default match type | Approximate (risky) | **Exact** |
| Look to the left | No | **Yes** |
| Survives inserted/deleted columns | No (hard-coded column number) | **Yes** |
| Built-in "not found" value | No (needs IFNA) | **Yes** |
| Search last-to-first | No | **Yes** |
| Return multiple columns at once | No | **Yes** (spills) |
| Wildcard matching | Yes, always on | Yes, opt-in (`match_mode` 2) |
| Horizontal lookups | Needs HLOOKUP | **Same function** |
| Works in Excel 2019 and older | **Yes** | No |

---

## The five big reasons XLOOKUP wins

### 1. Exact match is the default

VLOOKUP's fourth argument defaults to approximate match. Forget `FALSE` and you can get a wrong answer with no error to warn you. XLOOKUP defaults to exact match, so the safe behaviour is the default.

### 2. No column numbers to break

With VLOOKUP, `4` means "the fourth column of the range." Insert a column into the table and the formula now returns the wrong data, again with no error. XLOOKUP points to the return column itself, so inserting columns doesn't affect it.

### 3. It can look left

VLOOKUP can only return columns to the **right** of the lookup column. XLOOKUP doesn't care about direction:

```excel
=XLOOKUP(A2, Products!$D:$D, Products!$A:$A)
```

### 4. Built-in error handling

```excel
=XLOOKUP(A2, Products!A:A, Products!D:D, "Not found")
```

No need to wrap it in `IFNA`.

### 5. Find the last match

Need the most recent order for a customer? Set `search_mode` to `-1` to search from the bottom up:

```excel
=XLOOKUP(A2, Orders!B:B, Orders!E:E, , 0, -1)
```

With VLOOKUP you'd need a helper column or an array formula.

---

## Bonus: return several columns at once

XLOOKUP can return a whole row of results. The answer **spills** into the neighbouring cells:

```excel
=XLOOKUP(A2, Products!A:A, Products!B:D)
```

That returns name, category, and price in one formula.

---

## When VLOOKUP still makes sense

- **Compatibility.** XLOOKUP doesn't exist in Excel 2016 or 2019. If you send the file to someone on an older version, they see `#NAME?`. If you can't be sure what version the recipient has, VLOOKUP or INDEX/MATCH is the safe choice.
- **Existing workbooks.** Rewriting thousands of working VLOOKUPs adds risk and gains you little. Use XLOOKUP for new formulas.
- **Familiarity.** Everyone knows VLOOKUP. In a shared template, a familiar formula can be easier for colleagues to maintain.

---

## What about INDEX/MATCH?

INDEX/MATCH was the power user's answer to VLOOKUP's limits long before XLOOKUP arrived:

```excel
=INDEX(Products!D:D, MATCH(A2, Products!A:A, 0))
```

It looks left, it survives inserted columns, and it **works in every Excel version**. If you need XLOOKUP's flexibility in a file that must open in older Excel, INDEX/MATCH is the answer.

---

## Performance

On normal workbooks the speed difference doesn't matter. On very large datasets, all three functions run faster when:

- you use exact-match lookups on **tight ranges** (avoid whole-column references in huge files), and
- you use **binary search** (`search_mode` 2 in XLOOKUP, or sorted data with approximate match) when the data is sorted.

---

## The verdict

| Situation | Use |
|---|---|
| Everyone has Excel 365 / 2021+ | **XLOOKUP** |
| File must work in older Excel | **INDEX/MATCH** (or VLOOKUP for simple cases) |
| Quick one-off lookup, data to the right | Either, whichever you type faster |
| Maintaining an old workbook | Leave the working VLOOKUPs alone |

XLOOKUP is the better function. VLOOKUP is still worth knowing, because you'll keep running into it in other people's spreadsheets for years.


---

## Practise XLOOKUP and VLOOKUP side by side

On **Excelio** you write both lookups on real data in a live sheet, and every answer is checked automatically.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Why VLOOKUP Returns #N/A (and How to Fix It)](01-vlookup-na-error-fix.md)

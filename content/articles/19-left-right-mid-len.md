---
title: "LEFT, RIGHT, MID and LEN in Excel: Extract Any Part of a Text"
description: "Pull characters from the start, end or middle of a cell with LEFT, RIGHT and MID, use LEN to handle variable lengths, and fix results that won't add up."
keywords: [left function excel, right function excel, mid function excel, len function excel, extract characters excel, left right mid excel]
---

# LEFT, RIGHT, MID and LEN in Excel: Extract Any Part of a Text

Product codes, account numbers, postcodes and IDs often pack several pieces of information into one cell. LEFT, RIGHT and MID cut those pieces out, and LEN tells you how long the text is so your formulas work when lengths vary.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The four functions

```excel
=LEFT(text, [num_chars])          → from the start
=RIGHT(text, [num_chars])         → from the end
=MID(text, start_num, num_chars)  → from the middle
=LEN(text)                        → number of characters
```

Take the SKU **UK-4471-BLU** in A2:

| Formula | Result | What it does |
|---|---|---|
| `=LEFT(A2, 2)` | UK | first 2 characters |
| `=RIGHT(A2, 3)` | BLU | last 3 characters |
| `=MID(A2, 4, 4)` | 4471 | 4 characters, starting at the 4th |
| `=LEN(A2)` | 11 | total length |

Spaces and punctuation count as characters.

---

## When the length varies: add LEN

Suppose codes look like `ORD-55`, `ORD-1203`, `ORD-90817`. You want everything after "ORD-", and the number has a different length each time.

Total length minus the 4-character prefix:

```excel
=RIGHT(A2, LEN(A2) - 4)
```

Or with MID, start at position 5 and take "plenty" of characters. MID stops at the end of the text without complaining:

```excel
=MID(A2, 5, 100)
```

---

## When the position varies: add FIND

For "everything before the dash" where the dash moves, find it first:

```excel
=LEFT(A2, FIND("-", A2) - 1)
```

`FIND("-", A2)` returns the dash's position. Subtracting 1 stops just before it. See [FIND vs SEARCH](20-find-vs-search.md) for details, or use [TEXTBEFORE](18-textbefore-textafter.md) in Microsoft 365.

---

## Results are text, not numbers

`=MID("UK-4471-BLU", 4, 4)` returns "4471" as **text**. It's left-aligned, SUM ignores it, and lookups against real numbers fail.

Convert it:

```excel
=VALUE(MID(A2, 4, 4))
=--MID(A2, 4, 4)
```

The double minus is a common shorthand that does the same thing.

---

## LEN for data cleaning

LEN is a quick detective tool:

- **Hidden spaces**: if "London" has `LEN` of 7, there's a stray space. Fix with `=TRIM(A2)`.
- **Validation**: flag phone numbers that aren't 11 digits with `=LEN(A2)<>11`.
- **Count a character**: count the commas in a cell with
  ```excel
  =LEN(A2) - LEN(SUBSTITUTE(A2, ",", ""))
  ```

---

## Dates are not text

`=LEFT(A2, 4)` on a date doesn't return the year. It returns the first 4 digits of the date's serial number. Use `=YEAR(A2)`, or `=TEXT(A2, "yyyy")` if you need text. See [Date functions](31-today-date-functions.md).

---

## Practice task

With **NG-LAG-000318** in A2:

1. Extract the country code "NG".
2. Extract the city code "LAG".
3. Extract the number 318 as a real number.

---

## Practise text extraction

**Excelio's** text lessons use realistic codes and IDs, so you learn to combine these functions, not just use them one at a time.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [FIND vs SEARCH](20-find-vs-search.md) · [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md) · [Extract the First or Last Word](23-extract-first-last-word.md)

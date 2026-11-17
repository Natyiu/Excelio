---
title: "How to Rank Text Answers from Survey Data (Most Common to Least)"
description: "Step-by-step: count and rank text survey responses in Excel with COUNTIF, UNIQUE, and SORT, plus a version that works in older Excel."
keywords: [rank text excel, count text responses excel, survey data excel, most common answer excel, countif sort unique]
---

# How to Rank Text Answers from Survey Data (Most Common to Least)

You've run a survey. One column is full of text answers ("Price," "Quality," "Delivery speed," "Price," "Customer service"...) and you want a ranked list: which answer came up most often, which came second, and so on.

`RANK` won't help, because it only works on numbers. You need to **count** each answer first and then **sort** by the count. This guide shows three ways to do it, starting with the simplest.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample data

Survey responses in **A2:A201**, with the header "Main reason for choosing us" in A1:

| A |
|---|
| Price |
| Quality |
| Price |
| Delivery speed |
| Customer service |
| Quality |
| Price |
| ... |

---

## Step 0: Clean the data first

Text counts only work if identical answers are written identically. Before counting:

- **Remove extra spaces:** `"Price "` and `"Price"` count as different answers. Use `=TRIM(A2)` in a helper column.
- **Standardise case for display:** `COUNTIF` ignores case, but `UNIQUE` may still show "price" and "Price" as one entry with whichever spelling appears first. Use `=PROPER(TRIM(A2))` for consistent output.
- **Merge synonyms:** "Cheap," "Low price," and "Price" are probably the same answer. Fix those by hand or with a mapping table.
- **Decide what to do with blanks:** the formulas below exclude them.

---

## Method 1: One formula (Excel 365 / 2021+)

This single formula returns the full ranked table: answers in one column, counts in the next, sorted from most to least common.

```excel
=LET(
  answers, FILTER(A2:A201, A2:A201<>""),
  list,    UNIQUE(answers),
  counts,  COUNTIF(answers, list),
  SORTBY(HSTACK(list, counts), counts, -1)
)
```

Put it in an empty cell (say C2). It spills into two columns:

| Answer | Count |
|---|---|
| Price | 64 |
| Quality | 51 |
| Delivery speed | 38 |
| Customer service | 29 |
| Other | 18 |

### What each part does

1. **`FILTER(A2:A201, A2:A201<>"")`** removes blank responses.
2. **`UNIQUE(answers)`** returns each distinct answer once.
3. **`COUNTIF(answers, list)`** counts how many times each unique answer appears. Because `list` is an array, `COUNTIF` returns an array of counts.
4. **`HSTACK(list, counts)`** puts answers and counts side by side.
5. **`SORTBY(..., counts, -1)`** sorts the table by count, descending (`-1`).
6. **`LET`** names each step so the formula is readable and each part is calculated only once.

> If your Excel doesn't have `HSTACK` (some 2021 builds don't), use Method 2.

---

## Method 2: Step by step with UNIQUE, COUNTIF, and SORT (Excel 365 / 2021)

If you'd rather see each step, or need to avoid `HSTACK`:

**Step 1: List the unique answers.** In C2:

```excel
=SORT(UNIQUE(FILTER(A2:A201, A2:A201<>"")))
```

**Step 2: Count each one.** In D2:

```excel
=COUNTIF(A2:A201, C2#)
```

The `#` after C2 refers to the **whole spill range**, so the counts grow and shrink with the list.

**Step 3: Sort by count.** In F2:

```excel
=SORTBY(C2#:D2#, D2#, -1)
```

Or, to show just the ranked answer names:

```excel
=SORTBY(C2#, D2#, -1)
```

**Step 4 (optional): Add a rank number and a percentage.**

Rank (1, 2, 3...):

```excel
=SEQUENCE(ROWS(C2#))
```

Share of responses:

```excel
=SORTBY(D2#, D2#, -1) / COUNTA(FILTER(A2:A201, A2:A201<>""))
```

Format the percentage column as %.

---

## Method 3: Older Excel (2016 / 2019)

Without dynamic arrays, use a short manual setup:

1. **Get the unique list.** Copy column A to a new column, then **Data → Remove Duplicates**.
2. **Count each answer.** Next to the first unique answer (in D2):
   ```excel
   =COUNTIF($A$2:$A$201, C2)
   ```
   Fill down. The `$` signs keep the survey range fixed. See [Absolute vs Relative References](03-absolute-vs-relative-references.md).
3. **Rank the counts.** In E2:
   ```excel
   =RANK.EQ(D2, $D$2:$D$20, 0)
   ```
   (Adjust `D20` to the end of your list.)
4. **Sort.** Select C:E and use **Data → Sort** by Count, largest to smallest.

This list doesn't update automatically. When new responses arrive, repeat steps 1 and 4.

---

## Method 4: No formulas, using a PivotTable

For a quick answer in any version:

1. Click any cell in your data and choose **Insert → PivotTable**.
2. Drag the answer field into **Rows**.
3. Drag the same field into **Values**. It defaults to *Count of...*.
4. Right-click a count → **Sort → Sort Largest to Smallest**.
5. Optional: right-click a count → **Show Values As → % of Grand Total**.

Click **Refresh** when the data changes.

---

## Handling ties

If two answers have the same count, `SORTBY` keeps them in their original order. To break ties alphabetically, add a second sort key:

```excel
=SORTBY(HSTACK(list, counts), counts, -1, list, 1)
```

To give tied answers the same rank number, use `RANK.EQ` against the count column.

---

## What about "select all that apply" questions?

If one cell holds several answers separated by commas ("Price, Quality"), split them first. In Excel 365:

```excel
=LET(
  all,    TEXTSPLIT(TEXTJOIN(",", TRUE, A2:A201), , ","),
  clean,  TRIM(all),
  list,   UNIQUE(clean),
  counts, MAP(list, LAMBDA(x, SUM(--(clean=x)))),
  SORTBY(HSTACK(list, counts), counts, -1)
)
```

This joins every response into one string, splits it into separate answers, trims them, and then counts and ranks as before.

> `TEXTJOIN` has a limit of 32,767 characters. For very large surveys, use Power Query's **Split Column → By Delimiter → Into Rows** and then group.

---

## Summary

| Your Excel | Best method |
|---|---|
| Excel 365 | One `LET` + `UNIQUE` + `COUNTIF` + `SORTBY` formula |
| Excel 2021 | `UNIQUE` → `COUNTIF` with `#` → `SORTBY` |
| Excel 2016/2019 | Remove Duplicates + `COUNTIF` + Sort |
| Any version, no formulas | PivotTable |

The key point: **you don't rank text, you rank the counts of the text.** Count first, then sort.

---

## Practise this on real survey data

**Excelio** gives you a live spreadsheet with sample data and checks your formulas as you go, so you can try counting and ranking without setting anything up.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

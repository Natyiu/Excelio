---
title: "Why VLOOKUP Returns #N/A (and How to Fix It)"
description: "The value is right there, but VLOOKUP says #N/A. Here are the real causes, mostly mismatched data types and hidden spaces, and how to fix each one."
keywords: [vlookup n/a, vlookup not working, vlookup returns n/a, excel lookup error]
---

# Why VLOOKUP Returns #N/A (and How to Fix It)

You can see the value in your lookup table. You typed the formula correctly. VLOOKUP still returns **#N/A**.

#N/A means "not available": Excel looked for your lookup value and found no match. When you can clearly see a match, the two values only *look* the same. Somewhere there's a difference Excel can see and you can't.

This guide covers the causes in order of how often they happen.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## A quick refresher on the formula

```excel
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
```

Example:

```excel
=VLOOKUP(A2, Products!$A$2:$D$500, 3, FALSE)
```

This looks for A2 in the **first column** of `Products!A2:D500` and returns the value from the third column. `FALSE` means exact match.

---

## Cause 1: Numbers stored as text (the most common)

This is the main cause. One sheet stores product ID `10452` as a **number**. The other stores it as **text** (`"10452"`). They look the same, but Excel treats them as different values, so the match fails.

### How to spot it

- Numbers stored as text usually **align left**. Real numbers align right.
- You may see a small **green triangle** in the top-left corner of the cell.
- Test it directly:

```excel
=ISNUMBER(A2)
=ISTEXT(Products!A2)
```

If one returns TRUE and the other FALSE, you've found the problem.

- Or compare the two cells: `=A2=Products!A2` returns **FALSE** even when they look the same.

### How to fix it

The cleanest fix is to give both columns the same format, so the lookup can match them.

**Option A: Convert the text to numbers (permanent fix)**
1. Select the column that's stored as text.
2. Go to **Data → Text to Columns → Finish**. Excel re-reads each value and turns numeric text into real numbers.
3. Or click the green triangle warning and choose **Convert to Number**.

> Changing the cell format to "Number" on its own **doesn't work**. Formatting changes how a value is displayed, not what type of value is stored. You have to re-enter or convert the values.

**Option B: Convert inside the formula (no change to the data)**

If your lookup value is text and the table holds numbers:

```excel
=VLOOKUP(VALUE(A2), Products!$A$2:$D$500, 3, FALSE)
```

If your lookup value is a number and the table holds text:

```excel
=VLOOKUP(A2&"", Products!$A$2:$D$500, 3, FALSE)
```

Joining an empty string (`&""`) turns any value into text.

**Option C: Use `--` to force a number**

```excel
=VLOOKUP(--A2, Products!$A$2:$D$500, 3, FALSE)
```

The double minus turns numeric text into a number.

---

## Cause 2: Hidden spaces

Data copied from other systems (ERPs, websites, CSV exports) often brings extra spaces along. `"Widget A "` with a trailing space doesn't match `"Widget A"`.

### How to spot it

```excel
=LEN(A2)
```

If `LEN` returns 9 for "Widget A" (which has 8 characters), there's an extra character.

### How to fix it

**TRIM** removes leading spaces, trailing spaces, and doubled spaces between words:

```excel
=VLOOKUP(TRIM(A2), Products!$A$2:$D$500, 3, FALSE)
```

If the spaces are in the **lookup table**, clean the table instead. Add a helper column with `=TRIM(A2)`, copy it, and **Paste Special → Values** over the original.

### The tricky one: non-breaking spaces

Text copied from web pages often contains **non-breaking spaces** (character 160). `TRIM` doesn't remove them. Swap them for normal spaces first:

```excel
=TRIM(SUBSTITUTE(A2, CHAR(160), " "))
```

To also remove line breaks and other non-printing characters:

```excel
=TRIM(CLEAN(SUBSTITUTE(A2, CHAR(160), " ")))
```

---

## Cause 3: The lookup column isn't the first column

VLOOKUP only searches the **leftmost column** of `table_array`. If your IDs are in column C and you select `A:D`, VLOOKUP searches column A.

**Fix:** Start the range at the lookup column (`C:F`), or use XLOOKUP or INDEX/MATCH, which can look in any direction:

```excel
=XLOOKUP(A2, Products!C:C, Products!A:A)
=INDEX(Products!A:A, MATCH(A2, Products!C:C, 0))
```

---

## Cause 4: The range shifted when you copied the formula

You wrote `=VLOOKUP(A2, D2:F100, 2, FALSE)` and filled it down. By row 50 the formula reads `D51:F149`, and the rows above 51 are no longer searched.

**Fix:** Lock the table with absolute references:

```excel
=VLOOKUP(A2, $D$2:$F$100, 2, FALSE)
```

Press **F4** after selecting the range to add the `$` signs. Even better, convert the table to an Excel Table (**Ctrl+T**) and use structured references like `Products[#All]`, which never shift.

---

## Cause 5: Missing or wrong fourth argument

If you leave out `range_lookup`, VLOOKUP defaults to **approximate match** (`TRUE`). On unsorted data that returns wrong answers or #N/A.

**Fix:** Use `FALSE` (or `0`) for exact matches. That's almost always what you want.

---

## Cause 6: The value really isn't there

Sometimes #N/A is correct: the item is missing from the lookup table. Check for typos, different spellings ("Ltd" vs "Limited"), or a lookup range that doesn't reach the newest rows.

To show a friendly message instead of the error:

```excel
=IFNA(VLOOKUP(A2, $D$2:$F$100, 2, FALSE), "Not found")
```

> Use `IFNA` rather than `IFERROR`. `IFERROR` also hides real problems like #REF! and #VALUE!, which you want to see.

---

## A troubleshooting checklist

When VLOOKUP returns #N/A, work down this list:

1. Is `range_lookup` set to `FALSE`?
2. Does `=A2=Table!A2` return TRUE for a pair that *should* match?
3. Do `ISNUMBER` / `ISTEXT` give the same result on both sides?
4. Does `LEN` show extra characters?
5. Is the lookup column the first column of the range?
6. Is the range locked with `$` signs?
7. Does the value actually exist in the table?

Most #N/A errors come down to number 3 or number 4: data types or spaces. Make both columns the same format and VLOOKUP will match them.


---

## Try it yourself: fix a broken VLOOKUP in a live spreadsheet

Reading about #N/A only gets you so far. On **Excelio** you fix real lookup formulas in a live sheet and get instant feedback on your answer.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [XLOOKUP vs VLOOKUP: Which Should You Use?](02-xlookup-vs-vlookup.md) · [Absolute vs Relative References Explained](03-absolute-vs-relative-references.md)

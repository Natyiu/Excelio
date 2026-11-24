---
title: "SUBSTITUTE vs REPLACE in Excel: Swap or Remove Characters"
description: "Use SUBSTITUTE to replace text by matching it and REPLACE to replace by position. Remove spaces, dashes and line breaks, replace the nth occurrence, and nest substitutions."
keywords: [substitute function excel, replace function excel, substitute vs replace, remove characters excel, remove spaces excel, remove dashes excel]
---

# SUBSTITUTE vs REPLACE in Excel: Swap or Remove Characters

Imported data is full of unwanted characters: dashes in phone numbers, extra spaces, old product names, line breaks. SUBSTITUTE and REPLACE fix these with a formula, so the fix updates when the data changes.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## SUBSTITUTE: replace by matching text

```excel
=SUBSTITUTE(text, old_text, new_text, [instance_num])
```

```excel
=SUBSTITUTE("07700-900-123", "-", "")        → 07700900123
=SUBSTITUTE("Q1 Report", "Q1", "Q2")         → Q2 Report
=SUBSTITUTE("a b c", " ", "_")               → a_b_c
```

Replacing with `""` **removes** the text.

SUBSTITUTE is **case-sensitive**: `SUBSTITUTE("Apple", "apple", "Pear")` changes nothing.

---

## Replace only the nth occurrence

The 4th argument targets one occurrence:

```excel
=SUBSTITUTE("2026-03-18", "-", "/", 1)   → 2026/03-18
```

---

## Several replacements: nest them

```excel
=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2, "(", ""), ")", ""), " ", "")
```

turns `(0161) 496 0000` into `01614960000`.

In Microsoft 365 you can make long chains readable with LET, or apply a whole lookup list of replacements with REDUCE. For most people, two or three nested SUBSTITUTEs are fine.

---

## REPLACE: replace by position

```excel
=REPLACE(old_text, start_num, num_chars, new_text)
```

REPLACE doesn't care what the characters are, only where they are.

Mask all but the last 4 digits of a card number in A2 (16 digits):

```excel
=REPLACE(A2, 1, 12, "************")   → ************4421
```

Insert characters without removing any by using 0 for num_chars:

```excel
=REPLACE("20260318", 5, 0, "-")   → 2026-0318
```

---

## Which one?

| You know… | Use |
|---|---|
| **what** text to change | SUBSTITUTE |
| **where** the text is | REPLACE |

---

## Common cleaning recipes

| Problem | Formula |
|---|---|
| Remove all spaces | `=SUBSTITUTE(A2, " ", "")` |
| Remove extra spaces (keep single) | `=TRIM(A2)` |
| Remove non-breaking spaces from web data | `=TRIM(SUBSTITUTE(A2, CHAR(160), " "))` |
| Remove line breaks | `=SUBSTITUTE(A2, CHAR(10), " ")` |
| Count occurrences of a word | `=(LEN(A2)-LEN(SUBSTITUTE(A2,"x","")))/LEN("x")` |

`TRIM` alone does not remove CHAR(160), the non-breaking space that comes in from websites. That's why "TRIM isn't working" so often.

---

## Results are text

`=SUBSTITUTE("1,250", ",", "")` returns "1250" as text. Wrap in `VALUE()` to turn it back into a number.

---

## The non-formula option: Ctrl + H

For a one-time cleanup, **Find & Replace (Ctrl + H)** is faster. Use the formula when the data will be refreshed or pasted in again, so the cleanup stays repeatable.

---

## Practice task

1. Turn `+44 (0) 7700 900123` into `447700900123`.
2. Change only the **second** "/" in `12/03/2026` to "-".

---

## Practise data cleaning

**Excelio** gives you genuinely messy imported data and checks each fix instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [FIND vs SEARCH](20-find-vs-search.md) · [UPPER, LOWER and PROPER](22-upper-lower-proper.md) · [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md)

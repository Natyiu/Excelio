---
title: "UPPER, LOWER and PROPER in Excel: Change Text Case"
description: "Excel has no Change Case button, but UPPER, LOWER and PROPER do the job. Learn how to fix names, the PROPER quirks (McDonald, O'Brien), sentence case, and Flash Fill."
keywords: [change case excel, upper function excel, lower function excel, proper function excel, capitalize first letter excel, sentence case excel]
---

# UPPER, LOWER and PROPER in Excel: Change Text Case

Word has a Change Case button. Excel doesn't. When a list of names arrives as "aMARA OKAFOR", "BILAL KHAN" and "chen wei", you fix it with three functions.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The three functions

| Formula | "aMARA oKAFOR" becomes |
|---|---|
| `=UPPER(A2)` | AMARA OKAFOR |
| `=LOWER(A2)` | amara okafor |
| `=PROPER(A2)` | Amara Okafor |

Each takes a single argument and returns text.

---

## How to replace the original column

Formulas can't overwrite their own input, so:

1. Put the formula in a helper column (B2) and fill it down (double-click the fill handle).
2. Copy column B.
3. Right-click column A → **Paste Values** (or **Ctrl + Alt + V → V**).
4. Delete the helper column.

---

## PROPER's quirks

PROPER capitalises the first letter after **any** non-letter character. Usually that's what you want, but not always:

| Input | PROPER result | Problem |
|---|---|---|
| o'brien | O'Brien | ✅ correct |
| mcdonald | Mcdonald | ❌ should be McDonald |
| 3rd floor | 3Rd Floor | ❌ "Rd" |
| it's done | It'S Done | ❌ apostrophe |
| ACME LTD | Acme Ltd | ⚠️ maybe should stay upper |

Fix the predictable ones with SUBSTITUTE afterwards:

```excel
=SUBSTITUTE(PROPER(A2), "'S ", "'s ")
```

For names, always do a quick visual check. No formula handles every surname.

---

## Sentence case (first letter only)

There's no SENTENCE function. Build it:

```excel
=UPPER(LEFT(A2, 1)) & LOWER(MID(A2, 2, LEN(A2)))
```

"tHE ORDER HAS SHIPPED" → "The order has shipped".

---

## Flash Fill: no formula needed

Type the first one or two results the way you want them in the next column, then press **Ctrl + E**. Excel spots the pattern and fills the rest. It's great for one-off cleanups. It won't update if the source changes, so use formulas for repeatable work.

---

## Case-sensitive comparisons

Excel comparisons ignore case: `="abc"="ABC"` is TRUE. To compare exactly, use EXACT:

```excel
=EXACT(A2, B2)
```

This is useful for passwords, product codes, or checking whether PROPER changed anything.

---

## Combine with TRIM

Messy names usually have spacing problems too:

```excel
=PROPER(TRIM(A2))
```

---

## Practice task

1. Convert a list of emails to lower case.
2. Turn "LONDON", "paris", "nEW yORK" into proper case.
3. Write a formula that returns TRUE if A2 is already in all capitals. (Hint: EXACT and UPPER.)

---

## Practise text cleanup

**Excelio** has realistic, messy name lists and checks your formula instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [SUBSTITUTE vs REPLACE](21-substitute-replace.md) · [Combine Text with TEXTJOIN](17-concat-textjoin.md)

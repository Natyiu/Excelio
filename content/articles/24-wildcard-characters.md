---
title: "Wildcards in Excel: How to Use *, ? and ~"
description: "Use the asterisk, question mark and tilde wildcards in COUNTIF, SUMIF, XLOOKUP, VLOOKUP, MATCH and Find & Replace to match partial text."
keywords: [excel wildcard, asterisk in excel formula, wildcard countif, wildcard vlookup, partial match excel, contains text excel]
---

# Wildcards in Excel: How to Use *, ? and ~

Wildcards let a formula match **partial** text: any product containing "pro", any code starting with "UK-", any name with exactly five letters. Excel has three of them.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The three wildcards

| Wildcard | Means | Example | Matches |
|---|---|---|---|
| `*` | any number of characters (including none) | `"*phone*"` | iPhone 15, Phone case, Headphones |
| `?` | exactly one character | `"B?LL"` | BALL, BELL, BILL (not BOLL**S**) |
| `~` | treat the next `*` or `?` as a normal character | `"*~?"` | any text ending in "?" |

---

## Patterns you'll use most

| Want cells that… | Criteria |
|---|---|
| contain "pro" | `"*pro*"` |
| start with "UK-" | `"UK-*"` |
| end with ".pdf" | `"*.pdf"` |
| are exactly 5 characters | `"?????"` |
| contain any text | `"*"` |
| don't contain "test" | `"<>*test*"` |

Wildcards are **not case-sensitive** in these functions.

---

## In COUNTIF, SUMIF and friends

```excel
=COUNTIF(A2:A200, "*refund*")
=SUMIF(A2:A200, "UK-*", C2:C200)
=AVERAGEIFS(D2:D200, B2:B200, "*Pro*")
```

With a cell reference, join the wildcards with `&`:

```excel
=COUNTIF(A2:A200, "*" & F1 & "*")
```

This is how you build a simple "search box": type a word in F1 and the count updates.

---

## In lookups

**VLOOKUP and MATCH** accept wildcards with an exact match (`FALSE` / `0`):

```excel
=VLOOKUP("*Okafor*", A2:C100, 3, FALSE)
=MATCH("INV-2026*", A2:A500, 0)
```

**XLOOKUP** needs wildcards switched on with match_mode **2**:

```excel
=XLOOKUP("*Okafor*", A2:A100, C2:C100, "Not found", 2)
```

Without the 2, XLOOKUP looks for the literal text "\*Okafor\*".

Partial-match lookups return the **first** match only, so make sure your pattern is specific enough.

---

## Functions that don't support wildcards

- **FIND** (use SEARCH instead; see [FIND vs SEARCH](20-find-vs-search.md))
- **IF** comparisons: `=IF(A2="*pro*", …)` looks for the literal text. Use `ISNUMBER(SEARCH("pro", A2))` instead.
- **FILTER**: use `ISNUMBER(SEARCH(...))` as the condition:

```excel
=FILTER(A2:C200, ISNUMBER(SEARCH("pro", A2:A200)))
```

---

## In Find & Replace (Ctrl + H)

Wildcards work here too. Find `(*)` and replace with nothing to delete everything in brackets, including the brackets. Find `~*` to search for a real asterisk.

---

## Numbers don't match wildcards

`"12*"` won't find the number 12345. Wildcards only match **text**. Either store codes as text, or use a helper column: `=TEXT(A2, "0")`.

---

## Practice task

1. Count email addresses in A2:A100 ending in "@gmail.com".
2. Sum sales for product codes starting with "X" and exactly four characters long.
3. Count cells containing a real question mark.

---

## Practise partial matching

**Excelio's** lessons include wildcard criteria inside COUNTIFS and XLOOKUP, with instant checking.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [COUNTIF and COUNTIFS](15-countif-countifs.md) · [SUMIF and SUMIFS](12-sumif-sumifs.md) · [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md)

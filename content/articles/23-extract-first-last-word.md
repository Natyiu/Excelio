---
title: "How to Extract the First or Last Word in Excel"
description: "Formulas to get the first word, last word, or first name and surname from a cell, with a Microsoft 365 version and a version that works in every Excel."
keywords: [extract first word excel, extract last word excel, get first name excel, get last name excel, split full name excel]
---

# How to Extract the First or Last Word in Excel

Splitting "Amara Ngozi Okafor" into a first name and surname is one of the most searched Excel tasks. Here are the formulas, the modern way and the classic way, plus the edge cases that break them.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Microsoft 365: TEXTBEFORE and TEXTAFTER

**First word:**

```excel
=TEXTBEFORE(A2, " ")
```

**Last word:** `-1` means "the last space":

```excel
=TEXTAFTER(A2, " ", -1)
```

| A2 | First | Last |
|---|---|---|
| Amara Okafor | Amara | Okafor |
| Amara Ngozi Okafor | Amara | Okafor |
| Cher | `#N/A` | `#N/A` |

### Single-word cells

Set **match_end** to 1 so the end of the text counts as a delimiter:

```excel
=TEXTBEFORE(A2, " ", 1, 0, 1)          → Cher
=TEXTAFTER(A2, " ", -1, 0, 1)          → Cher
```

More in [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md).

---

## Every Excel version: first word

```excel
=LEFT(A2, FIND(" ", A2 & " ") - 1)
```

The trick is `A2 & " "`. Adding a space to the end guarantees FIND always finds one, so single-word cells return the whole word instead of an error.

---

## Every Excel version: last word

This is the famous one:

```excel
=TRIM(RIGHT(SUBSTITUTE(A2, " ", REPT(" ", 100)), 100))
```

How it works:

1. `SUBSTITUTE(A2, " ", REPT(" ", 100))` replaces each space with 100 spaces, so the words are far apart.
2. `RIGHT(..., 100)` takes the last 100 characters. That's the last word plus a lot of padding.
3. `TRIM` removes the padding.

It works for any number of words and for single-word cells. Use a larger number than 100 if a single word could be longer than that.

---

## Everything except the first word

For "middle name + surname", or removing a title:

```excel
=MID(A2, FIND(" ", A2) + 1, 200)
```

or in Microsoft 365: `=TEXTAFTER(A2, " ")`.

---

## Clean the data first

Leading, trailing and double spaces break every one of these formulas. Wrap the cell in TRIM:

```excel
=TEXTBEFORE(TRIM(A2), " ")
```

Names copied from web pages may contain non-breaking spaces (CHAR(160)). See [SUBSTITUTE vs REPLACE](21-substitute-replace.md).

---

## Other options

- **Flash Fill (Ctrl + E):** type the first name for row 2, press Ctrl + E, done.
- **Data → Text to Columns:** splits on spaces, but three-word names spill into three columns.
- **TEXTSPLIT (365):** `=TEXTSPLIT(A2, " ")` spills every word into its own column.

---

## Watch out for real-world names

"Mary Ann Smith", "Juan de la Cruz", "Dr. Amara Okafor Jr." No formula gets every name right. If accuracy matters (mailings, legal documents), store first and last names in separate fields at the source.

---

## Practice task

1. Extract the first word of "Quarterly Sales Report 2026".
2. Extract the last word of the same text.
3. Make both formulas safe for a cell containing a single word.

---

## Practise it in a live sheet

**Excelio** has name-splitting challenges with deliberately awkward data.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md) · [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md) · [FIND vs SEARCH](20-find-vs-search.md)

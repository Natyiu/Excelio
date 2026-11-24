---
title: "Combine Text in Excel: &, CONCAT and TEXTJOIN Compared"
description: "Join first and last names, build IDs, and merge a whole list with a separator. Learn when to use &, CONCAT or TEXTJOIN, and how to keep number and date formats."
keywords: [concatenate excel, concat excel, textjoin excel, combine text excel, combine first and last name excel, ampersand excel]
---

# Combine Text in Excel: &, CONCAT and TEXTJOIN Compared

Joining text is one of the most common everyday Excel jobs: first + last name, a city and postcode, a product code built from parts. There are three ways to do it, and each is best for a different situation.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The & operator

```excel
=A2 & " " & B2
```

| A (First) | B (Last) | Result |
|---|---|---|
| Amara | Okafor | Amara Okafor |

The `" "` adds the space. Forgetting it is the classic mistake ("AmaraOkafor").

`&` works in every version of Excel and is the fastest to type for two or three pieces.

---

## CONCAT (replaces CONCATENATE)

```excel
=CONCAT(A2, " ", B2)
```

Same result. CONCAT's advantage over the old CONCATENATE is that it accepts **ranges**:

```excel
=CONCAT(A2:D2)   → joins four cells with nothing between them
```

CONCATENATE still works for backward compatibility, but CONCAT is its replacement in Excel 2019+ and Microsoft 365.

---

## TEXTJOIN: join a list with a separator

```excel
=TEXTJOIN(delimiter, ignore_empty, text1, ...)
```

This is the one most people don't know about, and it solves the hardest case: joining many cells with commas, while skipping blanks.

| | A |
|---|---|
| 2 | London |
| 3 | *(blank)* |
| 4 | Paris |
| 5 | Lagos |

```excel
=TEXTJOIN(", ", TRUE, A2:A5)   → London, Paris, Lagos
```

With `TRUE`, the blank is skipped, so there's no ", ," in the middle.

### Join only matching items (Microsoft 365)

Combine with FILTER for "list every product in the Sales category":

```excel
=TEXTJOIN(", ", TRUE, FILTER(A2:A50, B2:B50="Sales"))
```

---

## Keep number and date formatting

Joining a date gives an ugly serial number:

```excel
="Due: " & C2   → Due: 46099
```

Wrap it in TEXT with a format code:

```excel
="Due: " & TEXT(C2, "dd mmm yyyy")    → Due: 18 Mar 2026
="Total: " & TEXT(D2, "$#,##0.00")    → Total: $1,250.00
="Rate: " & TEXT(E2, "0.0%")          → Rate: 7.5%
```

---

## Line breaks inside a cell

```excel
=A2 & CHAR(10) & B2
```

Then turn on **Home → Wrap Text** to see the break. On older Mac versions, use `CHAR(13)`.

---

## Which one should I use?

| Situation | Best choice |
|---|---|
| 2–3 cells, any Excel version | `&` |
| A range with no separator | `CONCAT` |
| A list with separators, skipping blanks | `TEXTJOIN` |
| Numbers or dates in the result | Any of them + `TEXT()` |

---

## The reverse: splitting text

To split "Amara Okafor" back into two columns, see [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md), or use **Data → Text to Columns** or **Flash Fill (Ctrl + E)**.

---

## Practice task

1. Build an email address as `first.last@company.com` in lower case. (Hint: combine with `LOWER`.)
2. Join a column of 10 tags into one cell separated by " | ", ignoring blanks.

---

## Practise text formulas hands-on

**Excelio's** text lessons give you real names, codes and addresses to clean and combine, and check your formula instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md) · [UPPER, LOWER and PROPER](22-upper-lower-proper.md)

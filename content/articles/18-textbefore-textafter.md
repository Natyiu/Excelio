---
title: "TEXTBEFORE and TEXTAFTER in Excel: Split Text the Easy Way"
description: "Extract text before or after a character with TEXTBEFORE and TEXTAFTER. Get usernames from emails, first and last names, file extensions, and the nth delimiter."
keywords: [textbefore excel, textafter excel, extract text before character excel, extract text after character excel, split text excel, textsplit]
---

# TEXTBEFORE and TEXTAFTER in Excel: Split Text the Easy Way

For years, pulling "everything before the @" out of an email address meant nesting LEFT, FIND and LEN. In Microsoft 365, two functions do it directly: **TEXTBEFORE** and **TEXTAFTER**.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax

```excel
=TEXTBEFORE(text, delimiter, [instance_num], [match_mode], [match_end], [if_not_found])
=TEXTAFTER(text, delimiter, [instance_num], [match_mode], [match_end], [if_not_found])
```

You'll mostly use the first three arguments, plus the last one.

---

## Everyday examples

| A2 contains | Formula | Result |
|---|---|---|
| amara.okafor@shop.com | `=TEXTBEFORE(A2, "@")` | amara.okafor |
| amara.okafor@shop.com | `=TEXTAFTER(A2, "@")` | shop.com |
| Okafor, Amara | `=TEXTAFTER(A2, ", ")` | Amara |
| INV-2026-0042 | `=TEXTAFTER(A2, "-")` | 2026-0042 |
| report_final.xlsx | `=TEXTAFTER(A2, ".")` | xlsx |

---

## The nth delimiter

`instance_num` picks which occurrence to split on.

```excel
=TEXTAFTER("INV-2026-0042", "-", 2)    → 0042
=TEXTBEFORE("INV-2026-0042", "-", 2)   → INV-2026
```

**Negative numbers count from the end.** That's how you get the last word, or the extension of "my.file.name.pdf":

```excel
=TEXTAFTER("my.file.name.pdf", ".", -1)   → pdf
=TEXTAFTER("Mary Jane Watson", " ", -1)   → Watson
```

---

## Text between two characters

Nest them. To get the text inside brackets in "Laptop (Refurbished) 15in":

```excel
=TEXTBEFORE(TEXTAFTER(A2, "("), ")")   → Refurbished
```

---

## When the delimiter isn't there

If the delimiter is missing, both functions return `#N/A`. Use the last argument to return something useful instead:

```excel
=TEXTBEFORE(A2, "@", , , , "No email")
```

Or, for names with no space, return the whole cell by setting **match_end** to 1, which treats the end of the text as a delimiter:

```excel
=TEXTBEFORE("Cher", " ", 1, 0, 1)   → Cher
```

---

## Case sensitivity

By default the match is case-sensitive. Set `match_mode` to 1 to ignore case:

```excel
=TEXTAFTER("Order ID: 554", "id: ", 1, 1)   → 554
```

---

## Split into many columns: TEXTSPLIT

To split "Red,Green,Blue" across three cells at once:

```excel
=TEXTSPLIT(A2, ",")
```

The results spill to the right. Use `TEXTSPLIT(A2, , ",")` to spill down instead.

---

## No Microsoft 365? The classic method

```excel
Before "@":  =LEFT(A2, FIND("@", A2) - 1)
After "@":   =MID(A2, FIND("@", A2) + 1, LEN(A2))
```

These work in every version. See [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md) and [FIND vs SEARCH](20-find-vs-search.md) for how they work.

---

## Quick reference

- TEXTBEFORE / TEXTAFTER: Microsoft 365 and Excel 2024 (also Excel for the web).
- Instance `2` = second occurrence. Instance `-1` = last occurrence.
- Missing delimiter → `#N/A`. Use the `if_not_found` argument.
- Many pieces at once → TEXTSPLIT.

---

## Practise splitting messy data

**Excelio** gives you real-world strings (emails, SKUs, addresses) and checks each formula instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Extract the First or Last Word](23-extract-first-last-word.md) · [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md) · [Combine Text with TEXTJOIN](17-concat-textjoin.md)

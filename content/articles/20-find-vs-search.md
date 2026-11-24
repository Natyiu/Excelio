---
title: "FIND vs SEARCH in Excel: Locate Text Inside a Cell"
description: "FIND and SEARCH return the position of text inside a cell. Learn the two differences between them, how to check if a cell contains a word, and how to avoid #VALUE!."
keywords: [find function excel, search function excel, find vs search excel, check if cell contains text excel, isnumber search excel]
---

# FIND vs SEARCH in Excel: Locate Text Inside a Cell

FIND and SEARCH both answer "where does this text appear in the cell?" They're rarely used alone. They feed positions to LEFT, MID and RIGHT, or answer "does this cell contain X?"

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The syntax

```excel
=FIND(find_text, within_text, [start_num])
=SEARCH(find_text, within_text, [start_num])
```

Both return a **position number**:

```excel
=FIND("@", "sam@shop.com")     → 4
=SEARCH("shop", "sam@shop.com") → 5
```

---

## The two differences

| | FIND | SEARCH |
|---|---|---|
| Case-sensitive | ✅ Yes | ❌ No |
| Wildcards (`*`, `?`) | ❌ No | ✅ Yes |

```excel
=FIND("a", "Apple")     → #VALUE!   (no lowercase "a")
=SEARCH("a", "Apple")   → 1
```

**Rule of thumb:** use SEARCH unless case matters.

---

## Not found = #VALUE!

If the text isn't there, both return `#VALUE!`. That's the basis of the most useful pattern.

## Does the cell contain a word?

```excel
=ISNUMBER(SEARCH("refund", A2))
```

Returns TRUE if "refund" appears anywhere in A2 (any case), otherwise FALSE. Put it inside IF:

```excel
=IF(ISNUMBER(SEARCH("refund", A2)), "Refund", "Other")
```

This is also the formula to use for a **conditional formatting** rule that highlights rows containing a keyword.

### Contains any of several words

```excel
=SUM(--ISNUMBER(SEARCH({"refund","return","cancel"}, A2))) > 0
```

---

## Find the 2nd occurrence

Use `start_num` to search after the first hit:

```excel
=FIND("-", A2, FIND("-", A2) + 1)
```

For "INV-2026-0042", this returns 9, the position of the second dash.

---

## Combining with LEFT / MID

Extract the username from an email:

```excel
=LEFT(A2, FIND("@", A2) - 1)
```

Extract the domain:

```excel
=MID(A2, FIND("@", A2) + 1, 100)
```

See [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md). In Microsoft 365, [TEXTBEFORE and TEXTAFTER](18-textbefore-textafter.md) do the same more simply.

---

## SEARCH with wildcards

```excel
=SEARCH("b?g", "big bag")   → 1    (? = any one character)
=SEARCH("x*z", "a x y z")   → 3    (* = any characters)
```

To search for a literal `?` or `*`, put a tilde in front: `"~?"`.

---

## Quick reference

- Both return a position, or `#VALUE!` if not found.
- FIND = case-sensitive, no wildcards.
- SEARCH = not case-sensitive, wildcards allowed.
- "Contains" test: `ISNUMBER(SEARCH(text, cell))`.

---

## Practise it in a live sheet

**Excelio's** text-search lessons walk you from FIND basics to real "contains" formulas, with instant feedback.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [LEFT, RIGHT, MID and LEN](19-left-right-mid-len.md) · [SUBSTITUTE vs REPLACE](21-substitute-replace.md) · [Wildcards in Excel](24-wildcard-characters.md)

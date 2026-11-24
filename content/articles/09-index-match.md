---
title: "INDEX MATCH in Excel: The Lookup That Works in Any Direction"
description: "Learn INDEX and MATCH on their own, then combine them into a two-way, left-looking lookup that doesn't break when you insert columns. With examples and practice."
keywords: [index match excel, index match formula, match function excel, index function excel, index match vs vlookup, two way lookup excel]
---

# INDEX MATCH in Excel: The Lookup That Works in Any Direction

VLOOKUP has two famous weaknesses. It can only return values to the **right** of the column it searches, and it breaks when someone inserts a column inside the lookup range.

INDEX MATCH has neither problem. It's two simple functions doing one job each, and once you see how they fit together, it's easier to read than VLOOKUP.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## INDEX: "give me the item at position n"

```excel
=INDEX(array, row_num, [column_num])
```

INDEX takes a range and a position, and returns what's at that position.

| | A (Employee) | B (Dept) | C (Salary) |
|---|---|---|---|
| 2 | Amara | Sales | 52,000 |
| 3 | Bilal | Finance | 61,000 |
| 4 | Chen | IT | 58,500 |
| 5 | Dana | Sales | 49,000 |

```excel
=INDEX(C2:C5, 3)   → 58,500   (3rd item in C2:C5)
```

On its own that isn't useful, because you rarely know the position in advance. That's MATCH's job.

---

## MATCH: "where is this value?"

```excel
=MATCH(lookup_value, lookup_array, [match_type])
```

MATCH returns the **position** of a value in a list, not the value itself.

```excel
=MATCH("Chen", A2:A5, 0)   → 3
```

Always use `0` as the third argument unless you know you need an approximate match. Leaving it out defaults to `1` (approximate, sorted data), which is the cause of many silently wrong answers.

---

## Put them together

Replace the hard-coded `3` in INDEX with the MATCH formula:

```excel
=INDEX(C2:C5, MATCH("Chen", A2:A5, 0))   → 58,500
```

Read it from the inside out: *find Chen's position in the names, then return the salary at that position.*

With the name in a cell (say F2), it becomes a reusable lookup:

```excel
=INDEX($C$2:$C$5, MATCH(F2, $A$2:$A$5, 0))
```

---

## Look left (VLOOKUP can't)

Want the employee name for a given salary? The return column (A) sits to the left of the search column (C). VLOOKUP can't do it. INDEX MATCH doesn't care:

```excel
=INDEX(A2:A5, MATCH(61000, C2:C5, 0))   → Bilal
```

The two ranges are independent. They just need to be the same height.

---

## Two-way lookup: row and column

Give INDEX a 2D range and two MATCH functions, one for the row and one for the column:

| | A | B (Jan) | C (Feb) | D (Mar) |
|---|---|---|---|---|
| 2 | North | 120 | 135 | 150 |
| 3 | South | 98 | 110 | 105 |
| 4 | East | 143 | 139 | 160 |

```excel
=INDEX(B2:D4, MATCH("South", A2:A4, 0), MATCH("Feb", B1:D1, 0))   → 110
```

Point the two lookup values at dropdown cells and you have a small report that updates instantly.

---

## INDEX MATCH vs VLOOKUP vs XLOOKUP

| | VLOOKUP | INDEX MATCH | XLOOKUP |
|---|---|---|---|
| Look left | ❌ | ✅ | ✅ |
| Survives inserted columns | ❌ | ✅ | ✅ |
| Two-way lookup | Awkward | ✅ | ✅ (nested) |
| Works in Excel 2010–2019 | ✅ | ✅ | ❌ |
| Default match type | Approximate | Approximate (set 0!) | Exact |

If everyone who opens your file has Microsoft 365 or Excel 2021+, XLOOKUP is simpler. If the file goes to people on older versions, or to an interview test, INDEX MATCH is the safe, universal choice. See [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md).

---

## Common mistakes

- **`#N/A`**: the value really isn't there, or there's a trailing space or a number stored as text. The fixes are the same as for [VLOOKUP #N/A](01-vlookup-na-error-fix.md).
- **Wrong answer, no error**: you left out the `0` in MATCH.
- **`#REF!`**: the INDEX range and MATCH range are different sizes, or the row number exceeds the range.
- **Results drift when copied**: lock the ranges with `$` ([absolute references](03-absolute-vs-relative-references.md)).

---

## Practice task

Using the employee table above:

1. Return Dana's department.
2. Return the name of the person in IT.
3. Wrap your formula in `IFERROR(..., "Not found")` and test it with a name that isn't in the list.

---

## Make INDEX MATCH second nature

**Excelio's** lookup lessons give you real tables and check your formula as you type, so you build the habit instead of copying a template.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md) · [HLOOKUP Explained](10-hlookup.md) · [Why VLOOKUP Returns #N/A](01-vlookup-na-error-fix.md)

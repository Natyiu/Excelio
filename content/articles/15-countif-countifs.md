---
title: "COUNTIF and COUNTIFS in Excel: Count With Conditions"
description: "Count cells that match one or more conditions with COUNTIF and COUNTIFS: text, numbers, dates, partial matches, OR logic and finding duplicates."
keywords: [countif excel, countifs excel, countifs multiple criteria, countif contains text, countif between two numbers, count duplicates excel]
---

# COUNTIF and COUNTIFS in Excel: Count With Conditions

COUNTIF answers "how many?" questions: how many orders are late, how many students passed, how many times a customer appears. COUNTIFS does the same with several conditions at once.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample data

| | A (Ticket) | B (Status) | C (Priority) | D (Days open) |
|---|---|---|---|---|
| 2 | T-101 | Open | High | 12 |
| 3 | T-102 | Closed | Low | 3 |
| 4 | T-103 | Open | Low | 25 |
| 5 | T-104 | Open | High | 4 |
| 6 | T-105 | Closed | High | 9 |

---

## COUNTIF: one condition

```excel
=COUNTIF(range, criteria)
```

```excel
=COUNTIF(B2:B6, "Open")    → 3
=COUNTIF(D2:D6, ">10")     → 2
```

COUNTIF isn't case-sensitive: "open" and "OPEN" match too.

---

## COUNTIFS: several conditions

```excel
=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)
```

Open **and** High priority:

```excel
=COUNTIFS(B2:B6, "Open", C2:C6, "High")   → 2
```

Open tickets older than 10 days:

```excel
=COUNTIFS(B2:B6, "Open", D2:D6, ">10")    → 2
```

All ranges must be the same size, or you'll get `#VALUE!`.

---

## Count between two numbers

Use the same range twice:

```excel
=COUNTIFS(D2:D6, ">=5", D2:D6, "<=15")   → 2
```

With limits in cells F1 and F2: `=COUNTIFS(D2:D6, ">="&F1, D2:D6, "<="&F2)`.

---

## Count cells that contain text

Use the `*` wildcard:

```excel
=COUNTIF(A2:A100, "*refund*")   → cells containing "refund" anywhere
=COUNTIF(A2:A100, "T-1*")       → cells starting with "T-1"
=COUNTIF(A2:A100, "*")          → any text at all
```

See [wildcards in Excel](24-wildcard-characters.md) for `?` and `~`.

---

## OR logic: Open or Pending

COUNTIFS only does AND. For OR, add counts together:

```excel
=COUNTIF(B2:B6, "Open") + COUNTIF(B2:B6, "Pending")
```

or `=SUM(COUNTIF(B2:B6, {"Open","Pending"}))`.

---

## Find duplicates

Next to your data, in E2:

```excel
=COUNTIF($A$2:$A$500, A2)
```

Any result above 1 is a duplicate. Filter on that column, or highlight duplicates with **Home → Conditional Formatting → Highlight Cells Rules → Duplicate Values**.

To flag only the 2nd and later occurrences, use an expanding range:

```excel
=COUNTIF($A$2:A2, A2) > 1
```

---

## Why COUNTIF returns 0 or the wrong number

- **Extra spaces**: "Open " won't match "Open". Clean with TRIM.
- **Numbers stored as text**: `">10"` ignores text-numbers.
- **Operator outside the quotes**: write `">"&F1`, not `>F1`.
- **Long numbers** (credit-card or ID numbers over 15 digits) are compared as numbers, which loses precision and gives false matches. Use `"*"&A2` or SUMPRODUCT instead.

---

## Practice task

1. Count Closed tickets.
2. Count High-priority tickets open more than 5 days.
3. Count tickets that are **not** High priority.

---

## Practise until it's automatic

**Excelio's** count lessons give you a new dataset each time and check your formula instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [COUNT vs COUNTA](14-count-counta-countblank.md) · [SUMIF and SUMIFS](12-sumif-sumifs.md) · [Wildcards in Excel](24-wildcard-characters.md)

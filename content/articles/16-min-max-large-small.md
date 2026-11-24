---
title: "MIN, MAX, LARGE and SMALL in Excel: Find Top and Bottom Values"
description: "Find the highest, lowest, 2nd largest or top 5 values in Excel with MIN, MAX, LARGE and SMALL, plus MINIFS/MAXIFS for conditions and how to return the matching name."
keywords: [min max excel, large function excel, small function excel, top 5 values excel, maxifs excel, second highest value excel]
---

# MIN, MAX, LARGE and SMALL in Excel: Find Top and Bottom Values

What was the best month? Who has the lowest score? What are the top 3 deals? Four functions answer all of these, and two more add conditions.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The sample data

| | A (Rep) | B (Region) | C (Deals) |
|---|---|---|---|
| 2 | Amara | North | 42 |
| 3 | Bilal | South | 37 |
| 4 | Chen | North | 51 |
| 5 | Dana | East | 29 |
| 6 | Eli | South | 45 |

---

## MIN and MAX

```excel
=MAX(C2:C6)   → 51
=MIN(C2:C6)   → 29
```

Both ignore blanks and text. For dates, MAX gives the latest date and MIN the earliest. That's a quick way to find the most recent order.

---

## LARGE and SMALL: the nth value

```excel
=LARGE(array, k)
=SMALL(array, k)
```

```excel
=LARGE(C2:C6, 2)   → 45   (2nd highest)
=SMALL(C2:C6, 2)   → 37   (2nd lowest)
```

`LARGE(range, 1)` is the same as MAX. `SMALL(range, 1)` is the same as MIN.

### Top 3 list

Put 1, 2, 3 in E2:E4 and in F2:

```excel
=LARGE($C$2:$C$6, E2)
```

Copy down. In Microsoft 365 one formula does all three:

```excel
=LARGE(C2:C6, {1;2;3})
```

---

## MAXIFS and MINIFS: with a condition

Available in Excel 2019, 2021 and Microsoft 365:

```excel
=MAXIFS(max_range, criteria_range1, criteria1, ...)
```

```excel
=MAXIFS(C2:C6, B2:B6, "South")   → 45
=MINIFS(C2:C6, B2:B6, "North")   → 42
```

Criteria work exactly like [SUMIFS](12-sumif-sumifs.md).

---

## Return the *name*, not just the number

Knowing the top score is 51 is half the answer. Who got it?

```excel
=INDEX(A2:A6, MATCH(MAX(C2:C6), C2:C6, 0))   → Chen
```

or with XLOOKUP:

```excel
=XLOOKUP(MAX(C2:C6), C2:C6, A2:A6)
```

For a full ranked list of names and scores in Microsoft 365:

```excel
=TAKE(SORT(A2:C6, 3, -1), 3)
```

This sorts by the 3rd column, descending, and keeps the top 3 rows.

**Ties:** if two reps both have 51, MATCH and XLOOKUP return only the first one. SORT returns both.

---

## Ignore zeros when finding the minimum

```excel
=MINIFS(C2:C6, C2:C6, ">0")
```

---

## Quick reference

| Question | Formula |
|---|---|
| Highest | `MAX(range)` |
| Lowest | `MIN(range)` |
| 2nd highest | `LARGE(range, 2)` |
| 3rd lowest | `SMALL(range, 3)` |
| Highest where… | `MAXIFS(range, crit_range, crit)` |
| Name of the top value | `XLOOKUP(MAX(range), range, names)` |

---

## Practise ranking problems

**Excelio** includes top-N and "who scored highest" challenges with instant checking, which are common in Excel interview tests.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [AVERAGE and AVERAGEIFS](13-average-function.md) · [FILTER, UNIQUE and SORT](32-filter-unique-sort.md) · [INDEX MATCH](09-index-match.md)

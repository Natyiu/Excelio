---
title: "AVERAGE, AVERAGEIF and AVERAGEIFS in Excel (and When Averages Lie)"
description: "Calculate averages in Excel with AVERAGE, AVERAGEIF and AVERAGEIFS. Learn how blanks and zeros change the result, and when to use MEDIAN instead."
keywords: [average function excel, averageif excel, averageifs, average excluding zeros excel, median vs average excel]
---

# AVERAGE, AVERAGEIF and AVERAGEIFS in Excel (and When Averages Lie)

`=AVERAGE(B2:B20)` is easy. The tricky part is knowing what Excel includes in that average, because blanks, zeros and text are each handled differently, and they change your answer.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## AVERAGE

```excel
=AVERAGE(number1, [number2], ...)
```

It adds the numbers and divides by **how many numbers there are**.

| | A (Store) | B (Weekly sales) |
|---|---|---|
| 2 | Leeds | 4,000 |
| 3 | York | 0 |
| 4 | Hull | *(blank)* |
| 5 | Bath | 6,000 |

```excel
=AVERAGE(B2:B5)   → 3,333
```

Excel averaged 4,000, 0 and 6,000. **Blank cells and text are ignored. Zeros are included.** That difference matters: a blank means "no data", while 0 means "sold nothing".

---

## Average excluding zeros

If zeros mean "not reported yet", leave them out with AVERAGEIF:

```excel
=AVERAGEIF(B2:B5, "<>0")   → 5,000
```

---

## AVERAGEIF: one condition

```excel
=AVERAGEIF(range, criteria, [average_range])
```

Average order value for the "Online" channel:

```excel
=AVERAGEIF(C2:C200, "Online", D2:D200)
```

## AVERAGEIFS: several conditions

```excel
=AVERAGEIFS(average_range, criteria_range1, criteria1, ...)
```

As with SUMIFS, the **average range comes first**:

```excel
=AVERAGEIFS(D2:D200, C2:C200, "Online", E2:E200, ">="&DATE(2026,1,1))
```

The criteria syntax (operators in quotes, `&` for cell references, wildcards) is identical to [SUMIFS](12-sumif-sumifs.md).

---

## #DIV/0! errors

If no cells match, there's nothing to divide by, and you get `#DIV/0!`. Handle it:

```excel
=IFERROR(AVERAGEIF(C2:C200, "Online", D2:D200), "No data")
```

---

## When the average lies: use MEDIAN

Five salaries: 32k, 35k, 36k, 38k, 250k.

```excel
=AVERAGE(...)   → 78,200
=MEDIAN(...)    → 36,000
```

One outlier dragged the average far above what a typical person earns. **MEDIAN** returns the middle value and is the better "typical" figure for salaries, house prices, delivery times, or anything skewed.

Other useful relatives:

- `=MODE.SNGL(range)`: the most frequent value
- `=TRIMMEAN(range, 0.2)`: average after dropping the top and bottom 10%
- `=AVERAGEA(range)`: counts text as 0 and TRUE as 1. Rarely what you want.

---

## Weighted average

If products sell different quantities, a plain average of prices is misleading. Use SUMPRODUCT:

```excel
=SUMPRODUCT(B2:B10, C2:C10) / SUM(C2:C10)
```

where B is price and C is quantity.

---

## Quick reference

- AVERAGE ignores blanks and text but **includes zeros**.
- `AVERAGEIF(range, "<>0")` excludes zeros.
- AVERAGEIFS: average range first.
- Wrap in IFERROR to handle `#DIV/0!`.
- Skewed data? Report the MEDIAN.

---

## Practise with real numbers

**Excelio's** statistics lessons use realistic datasets with blanks and outliers, so you learn what each function really returns.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [SUMIF and SUMIFS](12-sumif-sumifs.md) · [MIN, MAX, LARGE and SMALL](16-min-max-large-small.md)

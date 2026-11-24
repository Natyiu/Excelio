---
title: "TODAY and Excel Date Functions: Age, Days Between Dates and Deadlines"
description: "Use TODAY, NOW, DATE, YEAR, MONTH, EOMONTH, EDATE, DATEDIF and NETWORKDAYS to calculate age, days until a deadline, overdue flags and month-end dates."
keywords: [today function excel, excel date functions, days between dates excel, calculate age excel, datedif excel, networkdays excel, eomonth]
---

# TODAY and Excel Date Functions: Age, Days Between Dates and Deadlines

"How many days until the deadline?" "How old is this invoice?" "What's the last day of the month?" Excel answers all of these once you know one fact: **a date is just a number.**

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Dates are numbers

Excel counts days from 1 January 1900. So 1 January 2026 is stored as 46023. Formatting makes it look like a date.

That's why you can subtract dates:

```excel
=B2-A2   → number of days between two dates
```

If the result shows as a date instead of a number, change the format to **General** (Ctrl + Shift + ~).

---

## TODAY and NOW

```excel
=TODAY()   → today's date, updates every day
=NOW()     → date and time, updates on every recalculation
```

Both take no arguments, but the brackets are required.

**Need a fixed date that doesn't change?** Press **Ctrl + ;** to type today's date as a value. **Ctrl + Shift + ;** inserts the current time.

---

## Everyday date formulas

| Question | Formula |
|---|---|
| Days until deadline (B2) | `=B2-TODAY()` |
| Is it overdue? | `=IF(B2<TODAY(), "Overdue", "")` |
| Days overdue | `=MAX(0, TODAY()-B2)` |
| Invoice age in days | `=TODAY()-A2` |
| Date 30 days from now | `=TODAY()+30` |

---

## Build and take apart dates

```excel
=DATE(2026, 3, 18)        → 18 Mar 2026
=YEAR(A2)  =MONTH(A2)  =DAY(A2)
=TEXT(A2, "mmmm")         → "March"
=TEXT(A2, "ddd")          → "Wed"
```

DATE handles overflow: `=DATE(2026, 14, 1)` gives 1 Feb 2027. That's useful for adding months.

---

## Months and month-ends

```excel
=EDATE(A2, 3)       → same day, 3 months later
=EDATE(A2, -1)      → same day last month
=EOMONTH(A2, 0)     → last day of A2's month
=EOMONTH(A2, -1)+1  → first day of A2's month
```

EOMONTH is the standard formula for month-end reporting.

---

## Calculate age

```excel
=DATEDIF(A2, TODAY(), "Y")
```

DATEDIF is a hidden function. It doesn't appear in autocomplete, but it works. The units:

| Unit | Returns |
|---|---|
| `"Y"` | complete years |
| `"M"` | complete months |
| `"D"` | days |
| `"YM"` | months left over after whole years |

"3 years, 4 months":

```excel
=DATEDIF(A2, TODAY(), "Y") & " years, " & DATEDIF(A2, TODAY(), "YM") & " months"
```

The start date must be earlier than the end date, or you get `#NUM!`.

Alternative: `=INT(YEARFRAC(A2, TODAY()))`.

---

## Working days

```excel
=NETWORKDAYS(A2, B2)               → weekdays between two dates (inclusive)
=NETWORKDAYS(A2, B2, Holidays)     → excluding a holiday list
=WORKDAY(A2, 10)                   → date 10 working days after A2
```

For weekends other than Saturday/Sunday, use **NETWORKDAYS.INTL** and **WORKDAY.INTL**.

---

## Why your date formula is wrong

- **Dates stored as text** (left-aligned, often from CSV imports). `=ISNUMBER(A2)` returns FALSE. Fix with **Data → Text to Columns → Date**, or `=DATEVALUE(A2)`.
- **Day/month swapped**: 03/04 means 3 April in the UK and March 4 in the US. Check the regional settings, and use DATE() in formulas.
- **TODAY() changes the result tomorrow**: that's expected. Paste as values to freeze it.
- **A "date" showing as 46023**: that's a number format issue only. Format it as a Date.

---

## Practice task

1. Flag invoices older than 60 days.
2. Return the last day of next month.
3. Calculate someone's age in whole years.

---

## Practise date formulas

**Excelio's** date lessons use realistic invoices and deadlines, checked as you type.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [The IF Function](25-if-function.md) · [Combine Text and Dates](17-concat-textjoin.md) · [SUMIFS Between Two Dates](12-sumif-sumifs.md)

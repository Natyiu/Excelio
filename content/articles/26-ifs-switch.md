---
title: "IFS vs SWITCH in Excel: Cleaner Alternatives to Nested IF"
description: "Replace hard-to-read nested IF formulas with IFS or SWITCH. Learn when each one fits, how to add a default result, and when a lookup table is better than both."
keywords: [ifs function excel, switch function excel, ifs vs nested if, ifs vs switch, excel multiple if conditions, ifs default value]
---

# IFS vs SWITCH in Excel: Cleaner Alternatives to Nested IF

Five nested IFs with a wall of closing brackets `)))))` are hard to read and easy to break. Excel 2019 and Microsoft 365 added two functions to fix this: **IFS** and **SWITCH**. They solve different problems.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## IFS: a list of tests

```excel
=IFS(test1, result1, test2, result2, ...)
```

The nested IF for grades:

```excel
=IF(B2>=80, "A", IF(B2>=65, "B", IF(B2>=50, "C", "F")))
```

becomes:

```excel
=IFS(B2>=80, "A", B2>=65, "B", B2>=50, "C", TRUE, "F")
```

IFS returns the result for the **first** test that's TRUE.

### The default: TRUE

IFS has no "otherwise" argument. If no test is TRUE, it returns `#N/A`. Add `TRUE, "F"` as the last pair. Since TRUE is always true, it catches everything else.

---

## SWITCH: match one value against a list

```excel
=SWITCH(expression, value1, result1, [value2, result2], ..., [default])
```

SWITCH looks at **one** value and compares it with exact options. Turning region codes into names:

```excel
=SWITCH(A2, "N", "North", "S", "South", "E", "East", "W", "West", "Unknown")
```

The last argument with no pair ("Unknown") is the default.

Day number to day type:

```excel
=SWITCH(WEEKDAY(B2), 1, "Weekend", 7, "Weekend", "Weekday")
```

---

## Which one?

| | IFS | SWITCH |
|---|---|---|
| Tests ranges (`>=`, `<`) | ✅ | ❌ (exact values only) |
| Different cells per test | ✅ | ❌ |
| Repeats the cell reference | Yes, in every test | No, written once |
| Default value | Add `TRUE, value` | Last argument |

- **Bands and thresholds** (grades, tax brackets, discount tiers) → IFS.
- **Code → label** translations → SWITCH.

---

## The SWITCH(TRUE, …) trick

You can use SWITCH for ranges by switching on TRUE:

```excel
=SWITCH(TRUE, B2>=80, "A", B2>=65, "B", B2>=50, "C", "F")
```

It works like IFS with a proper default argument. It's a matter of taste.

---

## When a lookup table beats both

If the categories change often, or there are more than 5 or 6, don't hard-code them in a formula. Put them in a small table:

| Min score | Grade |
|---|---|
| 0 | F |
| 50 | C |
| 65 | B |
| 80 | A |

and look them up with an approximate match:

```excel
=XLOOKUP(B2, E2:E5, F2:F5, , -1)
```

The `-1` means "exact match, or the next smaller value". The VLOOKUP equivalent is `=VLOOKUP(B2, E2:F5, 2, TRUE)`, which needs the table sorted ascending.

Now someone can change a threshold without touching the formula.

---

## Compatibility

IFS and SWITCH need Excel 2019, 2021, 2024 or Microsoft 365. In Excel 2016 or earlier they show `#NAME?`. If your file is shared widely, a nested IF or lookup table is safer.

---

## Practice task

1. Use IFS to assign shipping: under 1kg → "Small", under 5kg → "Medium", otherwise "Large".
2. Use SWITCH to convert 1/2/3/4 into "Q1"/"Q2"/"Q3"/"Q4".
3. Rebuild task 1 as a lookup table.

---

## Practise all three approaches

**Excelio** lets you solve the same problem with IF, IFS and a lookup, and checks each one.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [The IF Function](25-if-function.md) · [AND, OR, NOT and XOR](27-and-or-not-xor.md) · [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md)

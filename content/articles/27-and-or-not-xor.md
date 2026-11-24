---
title: "AND, OR, NOT and XOR in Excel: Test Several Conditions at Once"
description: "Combine conditions in Excel with AND, OR, NOT and XOR. Use them inside IF, conditional formatting and FILTER, plus the * and + shortcuts for array formulas."
keywords: [and function excel, or function excel, not function excel, xor excel, excel multiple conditions, if and or excel]
---

# AND, OR, NOT and XOR in Excel: Test Several Conditions at Once

Real decisions rarely depend on one thing. "Approve if the amount is under 1,000 **and** the supplier is approved." "Flag if the order is late **or** damaged." Excel's logical functions combine conditions into a single TRUE or FALSE.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## The four functions

| Function | Returns TRUE when… |
|---|---|
| `AND(a, b, …)` | **all** conditions are true |
| `OR(a, b, …)` | **at least one** is true |
| `NOT(a)` | a is false (it flips the result) |
| `XOR(a, b, …)` | an **odd number** are true (for two conditions: exactly one) |

---

## Examples

| | A (Amount) | B (Supplier OK?) | C (Status) |
|---|---|---|---|
| 2 | 650 | Yes | Late |
| 3 | 1,400 | Yes | On time |
| 4 | 300 | No | On time |

```excel
=AND(A2<1000, B2="Yes")        → TRUE
=AND(A3<1000, B3="Yes")        → FALSE (amount too high)
=OR(C4="Late", A4>1000)        → FALSE
=NOT(B4="Yes")                 → TRUE
```

---

## Inside IF

On their own they return TRUE/FALSE. Inside IF they drive a decision:

```excel
=IF(AND(A2<1000, B2="Yes"), "Auto-approve", "Manager review")
=IF(OR(C2="Late", C2="Damaged"), "Contact customer", "")
```

### Mixing AND and OR

"Approve if under 1,000 and supplier OK, **or** if the requester is the CFO":

```excel
=IF(OR(AND(A2<1000, B2="Yes"), D2="CFO"), "Approve", "Review")
```

Write it in plain words first, then translate. The brackets follow the sentence.

---

## XOR: exactly one

Two people must sign off, but a conflict exists if **only one** has signed:

```excel
=IF(XOR(E2="Signed", F2="Signed"), "Waiting on one", "")
```

XOR is rare, but when you need "one or the other, not both", it's the cleanest option.

---

## In conditional formatting

Select A2:D100 → **Home → Conditional Formatting → New Rule → Use a formula**:

```excel
=AND($A2>1000, $C2="Late")
```

The `$` before the column letter makes the whole row light up. See [absolute references](03-absolute-vs-relative-references.md).

---

## In FILTER and array formulas: use * and +

AND and OR collapse a whole range into **one** TRUE/FALSE, so they don't work row by row inside FILTER or SUMPRODUCT. Use arithmetic instead:

- `*` acts as AND
- `+` acts as OR

```excel
=FILTER(A2:D100, (A2:A100>1000) * (C2:C100="Late"))
=FILTER(A2:D100, (C2:C100="Late") + (C2:C100="Damaged"))
```

Each comparison gives TRUE/FALSE (1/0) per row. Multiplying gives 1 only when both are 1. Adding gives at least 1 when either is 1.

This is one of the most important ideas in modern Excel. See [FILTER, UNIQUE and SORT](32-filter-unique-sort.md).

---

## Common mistakes

- `=IF(A2>100 AND A2<200, …)` isn't valid Excel. Write `AND(A2>100, A2<200)`.
- `=OR(C2="Late","Damaged")` returns `#VALUE!`, because "Damaged" on its own isn't a condition. Repeat the cell: `OR(C2="Late", C2="Damaged")`.
- Using AND/OR inside FILTER. Use `*` and `+`.

---

## Practice task

1. TRUE if a score is between 40 and 60 inclusive.
2. "Eligible" if age ≥ 18 and (member = "Yes" or spend > 500).
3. Filter a table to rows where Region is "North" or "East".

---

## Practise multi-condition logic

**Excelio's** logic lessons give you scenarios like these and check each formula instantly.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [The IF Function](25-if-function.md) · [Logical Operators](28-logical-operators.md) · [IFS vs SWITCH](26-ifs-switch.md)

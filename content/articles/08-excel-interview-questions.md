---
title: "Excel Interview Questions: What to Expect in a Technical Round"
description: "The Excel questions interviewers actually ask, from basic to advanced, with model answers and the practical tests you're likely to face."
keywords: [excel interview questions, excel technical interview, excel test for job, advanced excel interview questions, excel assessment]
---

# Excel Interview Questions: What to Expect in a Technical Round

"They said there'll be a technical round on Excel. What will they ask?"

The answer depends on the role, but technical rounds follow predictable patterns. This guide covers what interviewers test, the questions that come up most often (with answers), and how to prepare for the hands-on test that usually comes with them.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## What interviewers are really checking

Most Excel rounds test three things:

1. **Can you get the right answer?** Lookups, aggregation, cleaning messy data.
2. **Can you get it efficiently?** Knowing the right tool instead of doing it by hand.
3. **Can you build something someone else can use?** Clear structure, no hard-coded numbers, no fragile formulas.

The level depends on the role:

| Role | Typical focus |
|---|---|
| Admin / operations / customer support | Formatting, sorting, filtering, SUM/IF, basic lookups |
| Data / business / financial analyst | Lookups, PivotTables, SUMIFS/COUNTIFS, cleaning data, charts |
| Financial modelling / FP&A | Model structure, scenarios, INDEX/MATCH, NPV/IRR, error checking |
| Reporting / BI | Power Query, data modelling, dynamic arrays, automation |

---

## Basic questions

**1. What's the difference between a relative, absolute, and mixed reference?**
`A1` moves when copied, `$A$1` never moves, and `$A1` / `A$1` lock only the column or only the row. Use absolute references for constants and lookup ranges. *(Full explanation: [Absolute vs Relative References](03-absolute-vs-relative-references.md).)*

**2. What's the difference between COUNT, COUNTA, and COUNTBLANK?**
`COUNT` counts numbers. `COUNTA` counts all non-empty cells. `COUNTBLANK` counts empty cells.

**3. How do you remove duplicates?**
**Data → Remove Duplicates** for a one-off. `=UNIQUE(range)` for a list that updates automatically in Excel 365.

**4. How would you freeze the header row?**
**View → Freeze Panes → Freeze Top Row.**

**5. What does the IF function do? Write one.**
`=IF(B2>=50, "Pass", "Fail")`. It returns one value if a condition is true and another if it's false.

**6. How do you combine text from two cells?**
`=A2&" "&B2`, `=CONCAT(A2," ",B2)`, or `=TEXTJOIN(" ", TRUE, A2:C2)` to skip blanks.

---

## Intermediate questions

**7. Explain VLOOKUP and its limitations.**
It searches the first column of a range and returns a value from a column to the right. Limitations: it can't look left, it breaks when columns are inserted (hard-coded column index), it defaults to approximate match, and it returns only the first match.
*Mention XLOOKUP or INDEX/MATCH as alternatives. Interviewers like that.* *(See [XLOOKUP vs VLOOKUP](02-xlookup-vs-vlookup.md).)*

**8. Your VLOOKUP returns #N/A, but the value is clearly there. Why?**
Usually mismatched data types (number vs text) or hidden spaces. Check with `ISNUMBER`/`ISTEXT` and `LEN`, and fix with `VALUE`, `TRIM`, or Text to Columns. *(See [Why VLOOKUP Returns #N/A](01-vlookup-na-error-fix.md).)*

**9. What's the difference between SUMIF and SUMIFS?**
`SUMIF` takes one condition. `SUMIFS` takes several, and its sum range comes **first**:
`=SUMIFS(Sales, Region, "East", Month, "Jan")`.

**10. What is a PivotTable and when would you use it?**
A tool that summarises large datasets (totals, counts, averages) by category, without formulas. Use it for quick analysis such as sales by region by month.

**11. How do you handle errors in formulas?**
`IFERROR(formula, value)` or `IFNA` for lookups specifically. Then add: *"I'd rather fix the cause than hide every error,"* because `IFERROR` can hide real problems.

**12. What's conditional formatting? Give an example.**
Formatting that changes with a cell's value: highlighting overdue dates in red, adding data bars, or a formula rule like `=$D2<TODAY()` to highlight an entire row.

**13. How do you make a dropdown list?**
**Data → Data Validation → List**, with the source pointing at a range (preferably a Table column or a named range, so it grows with new items).

**14. What's the difference between a Table (Ctrl+T) and a normal range?**
Tables expand automatically, use structured references (`Sales[Amount]`), carry formulas down, and make PivotTables and charts pick up new rows.

---

## Advanced questions

**15. INDEX/MATCH vs XLOOKUP. When would you use each?**
XLOOKUP is simpler and more flexible, but only works in Excel 2021/365. INDEX/MATCH works in every version, and a two-way INDEX/MATCH/MATCH handles matrix lookups.

**16. What are dynamic arrays? Name some dynamic array functions.**
Formulas that return multiple values and **spill** into neighbouring cells: `FILTER`, `SORT`, `SORTBY`, `UNIQUE`, `SEQUENCE`, `XLOOKUP`. The `#` operator (`A2#`) refers to a whole spill range.

**17. What does LET do?**
Names intermediate calculations inside a formula, which makes long formulas readable and avoids calculating the same thing twice.

**18. What is Power Query and why use it over formulas?**
A tool for importing, cleaning, and reshaping data with recorded steps. You can refresh it when new data arrives. Use it for recurring imports, merging files, unpivoting, and cleaning that would otherwise be manual.

**19. Explain the difference between a Power Query merge and append.**
Merge = join two tables side by side on a key (like a lookup). Append = stack tables on top of each other (same columns, more rows).

**20. How would you build a scenario analysis?**
Use input cells for assumptions, with scenarios chosen by a dropdown and `CHOOSE`/`XLOOKUP`, or use Data Tables or Scenario Manager. Keep inputs, calculations, and outputs separate.

**21. What's the difference between a macro and VBA?**
A macro is a recorded or written automation. VBA is the language macros are written in. Mention when you'd automate (repetitive, rule-based tasks) and when you wouldn't (one-off tasks, or when Power Query can do it without code).

**22. How do you speed up a slow workbook?**
Replace volatile functions (`OFFSET`, `INDIRECT`, `TODAY` in many cells), avoid whole-column references in heavy formulas, replace thousands of lookups with one Power Query merge, remove unused formatting, and switch to manual calculation while you build.

---

## The hands-on test

Many technical rounds include a practical task, typically 20–60 minutes on a provided dataset. Common tasks:

- **Clean a messy dataset:** trim spaces, split names, fix dates stored as text, remove duplicates.
- **Look up values** from a second sheet.
- **Summarise:** totals by category/month with SUMIFS or a PivotTable.
- **Answer specific questions:** "Which region had the highest growth?" or "How many orders were late?"
- **Build a chart** or a small dashboard.
- **Find the errors** in a deliberately broken workbook.

### How to do well

- **Read every question before starting.** Later questions often reuse earlier work.
- **Don't hard-code numbers.** `=B2*0.08` is worse than `=B2*TaxRate`.
- **Keep the raw data untouched.** Work in new columns or sheets.
- **Label your answers clearly.** The reviewer should find them without searching.
- **Check your totals.** A quick `SUM` against the source shows you haven't lost rows.
- **Talk through your reasoning** if it's a live test. Interviewers care about *how* you think as much as the result.

---

## Questions that test judgement

Some questions have no single right answer:

- *"Tell me about a spreadsheet you built that others used."* Describe the problem, what you built, and the result (time saved, errors reduced).
- *"How do you check your work is correct?"* Reconciliation totals, spot-checks, error-check formulas, and having someone review it.
- *"When would you not use Excel?"* Very large datasets, multi-user live editing, or data that belongs in a database or BI tool. Knowing Excel's limits is a sign of experience.

---

## A one-week prep plan

| Day | Practise |
|---|---|
| 1 | Cell references, IF, AND/OR, text functions (LEFT, MID, TRIM, TEXTJOIN) |
| 2 | VLOOKUP, XLOOKUP, INDEX/MATCH, and fixing #N/A |
| 3 | SUMIFS, COUNTIFS, AVERAGEIFS, plus conditional formatting |
| 4 | PivotTables and PivotCharts |
| 5 | Data cleaning: Text to Columns, Flash Fill, Remove Duplicates, Power Query basics |
| 6 | Dynamic arrays: FILTER, SORT, UNIQUE, LET |
| 7 | A timed mock test on a public dataset, then review what slowed you down |

Practise on real, messy data. Clean textbook examples don't prepare you for what interviewers hand you.

---

## Practise for your Excel interview with real tasks

Technical rounds test what you can *do*, not what you can recite. On **Excelio** you work through hands-on tasks in a live spreadsheet and get instant feedback, the same kind of practical work interviewers ask for.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---
title: "Indeed Excel Assessment: What to Expect and How to Prepare"
description: "What the Indeed Excel skills assessment covers, the functions and tasks that come up most, a one-week study plan, and practice questions to test yourself before you start."
keywords: [indeed excel assessment, indeed excel test, excel assessment test, excel skills test for job, excel test practice, pre employment excel test]
---

# Indeed Excel Assessment: What to Expect and How to Prepare

Many job applications on Indeed invite you to take an Excel skills assessment, and employers can see your result. The good news is that the skills it tests are predictable, and a week of focused practice makes a real difference.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

*Excelio is not affiliated with Indeed. Test formats change over time, so check the instructions on Indeed before you begin.*

---

## What the assessment is like

From what candidates commonly report:

- It's **timed**, typically around 15–30 minutes.
- Questions are a mix of **multiple choice** and tasks where you work in a simulated spreadsheet.
- Results are reported as a proficiency level (for example *Familiar*, *Proficient*, *Highly Proficient*, or *Expert*), not as a percentage.
- You can usually choose whether to share your result with employers.
- There are different assessments for different levels, so read the title carefully.

---

## What's tested most often

| Area | What to know |
|---|---|
| **Basics** | Cell references, ranges, entering and editing data, fill handle |
| **Formulas** | SUM, AVERAGE, MIN, MAX, COUNT, COUNTA |
| **References** | Relative vs absolute (`$A$1`), F4 |
| **Logic** | IF, nested IF, AND/OR |
| **Conditional maths** | SUMIF(S), COUNTIF(S), AVERAGEIF |
| **Lookups** | VLOOKUP (exact match), sometimes INDEX MATCH or XLOOKUP |
| **Data tools** | Sort, filter, remove duplicates, Text to Columns |
| **Formatting** | Number formats, conditional formatting, Format Painter |
| **Charts** | Choosing the right chart type, editing titles and axes |
| **Pivot tables** | Creating one, changing Sum to Count, filtering |

---

## A one-week study plan

| Day | Focus | Read |
|---|---|---|
| 1 | References and basic formulas | [Absolute vs relative references](03-absolute-vs-relative-references.md), [SUM](11-sum-function.md) |
| 2 | IF and logic | [IF function](25-if-function.md), [AND/OR](27-and-or-not-xor.md) |
| 3 | Conditional maths | [SUMIFS](12-sumif-sumifs.md), [COUNTIFS](15-countif-countifs.md) |
| 4 | Lookups | [VLOOKUP #N/A fixes](01-vlookup-na-error-fix.md), [INDEX MATCH](09-index-match.md) |
| 5 | Sorting, filtering, pivot tables | [Pivot tables](33-pivot-tables.md) |
| 6 | Text and dates | [LEFT/RIGHT/MID](19-left-right-mid-len.md), [Date functions](31-today-date-functions.md) |
| 7 | Timed practice | Mixed questions, against the clock |

Spend most of your time **doing**, not reading. The assessment rewards speed, and speed only comes from repetition.

---

## Practice questions

Try these before you look at the answers.

1. A formula in C2 is `=A2*B1`. You copy it down to C3. What does it become?
2. Which formula counts how many cells in B2:B50 equal "Paid"?
3. What does `=VLOOKUP(E2, A2:C100, 3, FALSE)` return?
4. Write a formula that shows "Over budget" if D2 is greater than E2, otherwise "OK".
5. A pivot table doesn't show yesterday's new rows. What's the first thing to do?

**Answers**

1. `=A3*B2`. Both references are relative. To keep B1 fixed, write `$B$1`.
2. `=COUNTIF(B2:B50, "Paid")`
3. The value in the 3rd column of A2:C100, from the row where column A exactly matches E2.
4. `=IF(D2>E2, "Over budget", "OK")`
5. Refresh it (right-click → Refresh). If the rows are still missing, change the data source.

---

## Test-day tips

- **Use a computer, not a phone**, and close other apps.
- **Read every word**: "exact match", "including the header", "absolute reference".
- **Don't over-spend time** on one question. Move on and come back if you can.
- **Use the keyboard**: shortcuts save seconds on every task. See [Excel keyboard shortcuts](34-excel-keyboard-shortcuts.md).
- **Know the difference** between COUNT and COUNTA, and SUMIF and SUMIFS. These are classic trick questions.

---

## Can you retake it?

Indeed has generally allowed retakes after a waiting period. Check the current rules on the assessment page. Use the gap to practise the areas you were weakest in.

---

## Prepare with real, timed tasks

**Excelio's** lessons cover every area above in a live spreadsheet, with instant checking and progress tracking.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [Excel Interview Questions](08-excel-interview-questions.md) · [MO-200 and MO-201 Exam Prep](36-mo-200-mo-201-exam.md)

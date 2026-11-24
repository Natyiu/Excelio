---
title: "Pivot Tables in Excel for Beginners: Summarise Data in 60 Seconds"
description: "A beginner's guide to Excel pivot tables: prepare your data, build your first pivot, group dates, show percentages, add slicers, and fix a pivot that won't refresh."
keywords: [pivot table excel, how to make a pivot table, pivot table for beginners, excel pivot table tutorial, refresh pivot table, group dates pivot table]
---

# Pivot Tables in Excel for Beginners: Summarise Data in 60 Seconds

You have 5,000 rows of sales and your manager asks: "What were sales by region, by month?" You could write a lot of SUMIFS. Or you could build a pivot table in under a minute, without writing a single formula.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Step 0: get the data in shape

Pivot tables need **tabular** data:

- One header row, every column named
- One record per row
- No blank rows or columns in the middle
- No merged cells or subtotals mixed in

| Date | Region | Product | Rep | Sales |
|---|---|---|---|---|
| 03-Jan-2026 | North | Laptop | Amara | 1,200 |
| 05-Jan-2026 | South | Monitor | Bilal | 340 |
| … | … | … | … | … |

**Tip:** press **Ctrl + T** first to make it an Excel Table. Then new rows are included automatically when you refresh.

---

## Step 1: insert the pivot table

1. Click any cell in the data.
2. **Insert → PivotTable** (Windows: **Alt, N, V**).
3. Accept **New Worksheet** → OK.

You'll see an empty pivot on the left and the **PivotTable Fields** pane on the right.

---

## Step 2: drag fields into the four areas

| Area | What it does | Drag in… |
|---|---|---|
| **Rows** | one row per unique item | Region |
| **Columns** | one column per unique item | Product |
| **Values** | the numbers to summarise | Sales |
| **Filters** | filter the whole pivot | Rep |

Drag **Region** to Rows and **Sales** to Values and you instantly have total sales by region. Add **Product** to Columns for a region × product grid.

---

## Change Sum to Count, Average or %

Click the field in Values → **Value Field Settings**:

- **Summarize Values By**: Sum, Count, Average, Max, Min
- **Show Values As**: % of Grand Total, % of Column Total, Difference From, Running Total

"% of Grand Total" answers "what share does each region contribute?" with no formulas.

While you're there, click **Number Format** and pick a format with a thousands separator, so it sticks when the pivot refreshes.

---

## Group dates by month, quarter or year

Drag **Date** to Rows. Newer versions group it automatically. Otherwise, right-click a date → **Group** → choose **Months** and **Years**.

Always include **Years** when grouping by month, or January 2025 and January 2026 are added together.

---

## Sort and filter

- Right-click a value → **Sort → Largest to Smallest** for a ranked list.
- Use the drop-down on Row Labels → **Value Filters → Top 10** to show the top N.

---

## Slicers: clickable filters

**PivotTable Analyze → Insert Slicer → Region**. You get buttons that filter the pivot with one click. That makes it ideal for dashboards. One slicer can control several pivots (right-click → **Report Connections**).

---

## Refresh: the #1 pivot mistake

Pivot tables **do not update automatically** when the source data changes.

- Refresh one: right-click → **Refresh** (Alt + F5)
- Refresh all: **Data → Refresh All** (Ctrl + Alt + F5)

**New rows not showing after a refresh?** The source range is fixed. Fix: **PivotTable Analyze → Change Data Source**, and point it at a Table name instead of a range.

---

## Get a single number out: GETPIVOTDATA

Typing `=` and clicking a pivot cell creates a GETPIVOTDATA formula. It's useful because it keeps working when the pivot layout changes. If you'd rather have a normal cell reference, turn it off in **PivotTable Analyze → Options → Generate GetPivotData**.

---

## Pivot table vs formulas

| Use a pivot table when… | Use formulas (SUMIFS, UNIQUE) when… |
|---|---|
| exploring data quickly | the layout must stay fixed |
| the categories change | you need automatic updates without refreshing |
| you need grouping, % of total | you're building a model others will extend |

---

## Practise pivot tables

**Excelio's** table lessons walk you through filtering, sorting and pivot tables on realistic sales data.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [SUMIF and SUMIFS](12-sumif-sumifs.md) · [FILTER, UNIQUE and SORT](32-filter-unique-sort.md) · [Excel Interview Questions](08-excel-interview-questions.md)

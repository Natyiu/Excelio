---
title: "How to Create a Drop-Down List in Excel (Including Lists That Update)"
description: "Create a drop-down list in Excel with Data Validation, make it update automatically from a Table, build dependent drop-downs, and fix lists that don't show new items."
keywords: [drop down list excel, create drop down list excel, data validation list, dependent drop down list excel, excel drop down from table, edit drop down list excel]
---

# How to Create a Drop-Down List in Excel (Including Lists That Update)

Drop-down lists stop people typing "Nth", "north" and "North " into the same column. Your data stays clean, and your SUMIFS and pivot tables keep working. It takes about 30 seconds.

> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Method 1: type the items (quickest)

1. Select the cells that need the drop-down.
2. Go to **Data → Data Validation** (shortcut: **Alt, A, V, V** on Windows).
3. Under **Allow**, choose **List**.
4. In **Source**, type the items separated by commas: `Open,In progress,Closed`
5. Click **OK**.

This is good for short lists that never change, like Yes/No or High/Medium/Low.

---

## Method 2: from a range of cells

1. Type the items in a column, e.g. on a sheet called *Lists*, in A2:A6.
2. Select your target cells → **Data → Data Validation → List**.
3. In **Source**, select the range: `=Lists!$A$2:$A$6`

Now you can edit an item in the Lists sheet and the drop-down updates.

**Problem:** add a 6th item in A7 and it won't appear, because the range stops at A6.

---

## Method 3: a list that grows automatically (recommended)

**Option A: an Excel Table**

1. Click inside your list and press **Ctrl + T** to make it a Table. Name it `tblRegions` (Table Design → Table Name).
2. In Data Validation → Source, enter:

```excel
=INDIRECT("tblRegions[Region]")
```

Data Validation doesn't accept structured references directly, so INDIRECT wraps it. New rows added to the Table now appear in the list automatically.

**Option B: a spill range (Microsoft 365)**

If the list is built with a formula like `=SORT(UNIQUE(Data!B2:B500))` in cell H2, use the spill reference:

```excel
=$H$2#
```

The `#` means "the whole spilled result", so the drop-down is always sorted, unique and current.

---

## Dependent drop-downs (Country → City)

The second list changes based on the first.

**Microsoft 365 method:**

Put countries as headers in a lookup table (B1:D1), with cities underneath. If the Country drop-down is in F2, set the City drop-down's Source to a FILTER formula placed in a helper cell, e.g. in J2:

```excel
=FILTER(INDEX($B$2:$D$20, , MATCH(F2, $B$1:$D$1, 0)), INDEX($B$2:$D$20, , MATCH(F2, $B$1:$D$1, 0))<>"")
```

then use `=$J$2#` as the City list source.

**Classic method (any version):** name each city range exactly after its country (Formulas → Create from Selection), then set the City Source to `=INDIRECT(F2)`.

---

## Useful settings

- **Input Message tab**: shows a tip when the cell is selected ("Choose a region").
- **Error Alert tab**: choose **Stop** to block anything not on the list, or **Warning** to allow it after a prompt.
- **Ignore blank**: when ticked, empty cells are allowed.

---

## Edit or remove a drop-down

- **Edit:** select a cell → Data Validation → change the Source. Tick *"Apply these changes to all other cells with the same settings"*.
- **Remove:** Data Validation → **Clear All**.
- **Find all drop-downs on a sheet:** Home → Find & Select → **Data Validation**.

---

## Why your drop-down isn't working

- **New items missing**: the source range is fixed. Use a Table or spill range (Method 3).
- **Arrow not showing**: "In-cell dropdown" is unticked in Data Validation.
- **Pasting overwrote it**: pasting into a cell replaces its validation. Use **Paste Special → Values**.
- **Blank items at the bottom**: the source range includes empty cells.

---

## Practise building forms

**Excelio's** "Other Excel skills" lessons cover data validation alongside conditional formatting, in a live sheet.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

---

**Related:** [FILTER, UNIQUE and SORT](32-filter-unique-sort.md) · [Format Painter](30-format-painter.md)

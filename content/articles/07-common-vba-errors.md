---
title: "Common VBA Errors and What They Mean"
description: "A reference guide to the VBA runtime and compile errors you'll see most often: what each one means, the usual cause, and how to fix it."
keywords: [vba errors, vba runtime error 1004, subscript out of range, object variable not set, type mismatch vba, excel macro errors]
---

# Common VBA Errors and What They Mean

VBA error messages are short and not very helpful. "Run-time error '1004': Application-defined or object-defined error" doesn't tell you what went wrong.

This guide lists the errors you'll see most often, what each one means, the usual causes, and how to fix them. Bookmark it.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## Compile errors vs runtime errors

- **Compile errors** appear before your code runs. VBA can't understand the code: a typo, a missing `End If`, an undeclared variable. The editor highlights the line.
- **Runtime errors** appear while the code is running. The code is valid, but something went wrong when it ran: a missing sheet, an empty object, a value of the wrong type.

When a runtime error appears, click **Debug**. The yellow line shows where the code stopped. Hover over variables to see their values.

---

## Runtime errors

### Error 1004: Application-defined or object-defined error

**The catch-all Excel error.** Excel refused to do what you asked. Common causes:

- **Referring to cells on a sheet that isn't active** without qualifying them:
  ```vba
  ' Fails if Sheet2 isn't active:
  Sheets("Sheet2").Range(Cells(1, 1), Cells(5, 1)).Select
  ' Fix: qualify every Cells call
  With Sheets("Sheet2")
      .Range(.Cells(1, 1), .Cells(5, 1)).Value = 0
  End With
  ```
- **Selecting a range on a sheet that isn't active.** Avoid `.Select` altogether. Work with ranges directly.
- **An invalid formula** written with `.Formula`, for example with semicolons instead of commas (VBA always uses English, comma-separated syntax), or a misspelled function.
- **An invalid sheet name**, for example renaming a sheet with `/` or `?`, or to a name already in use.
- **Writing to a protected sheet.**
- **Cell references out of bounds**, such as `Cells(0, 1)` (rows and columns start at 1).

---

### Error 9: Subscript out of range

**VBA can't find the item you asked for in a collection or array.**

- The **sheet or workbook name is wrong**: `Sheets("Sales ")` with a trailing space, `Sheets("Sales2025")` when the sheet is "Sales 2025", or `Workbooks("Report")` without the `.xlsx`.
- The **workbook isn't open**.
- An **array index is outside its bounds**: `arr(10)` when the array was declared `Dim arr(1 To 5)`.

**Fix:** Check the exact names. To check whether a sheet exists before using it:

```vba
Function SheetExists(name As String) As Boolean
    On Error Resume Next
    SheetExists = Not ThisWorkbook.Sheets(name) Is Nothing
    On Error GoTo 0
End Function
```

---

### Error 91: Object variable or With block variable not set

**You used an object variable that doesn't point to anything.**

- Forgetting `Set`:
  ```vba
  Dim ws As Worksheet
  ws = Sheets("Data")       ' Error 91
  Set ws = Sheets("Data")   ' Correct
  ```
- **`Find` found nothing**, and you used the result anyway:
  ```vba
  Dim c As Range
  Set c = Columns("A").Find("Total")
  If Not c Is Nothing Then
      c.Offset(0, 1).Value = 100
  Else
      MsgBox "Total not found"
  End If
  ```

**Always check `Is Nothing`** after `Find`, `Match`-style lookups, or anything that might not return an object.

---

### Error 13: Type mismatch

**A value is the wrong type for what you're doing with it.**

- Putting text into a number variable: `Dim n As Long: n = "abc"`.
- **A cell that contains an error** (`#N/A`, `#DIV/0!`) read into a numeric variable.
- Comparing or doing maths with a blank or text cell.
- `Application.Match` / `Application.VLookup` return an **error value**, not a runtime error, when nothing is found. Assigning that to a `Long` gives error 13.

**Fix:**

```vba
Dim v As Variant
v = Application.Match("X", Range("A:A"), 0)
If IsError(v) Then
    MsgBox "Not found"
Else
    MsgBox "Row " & v
End If
```

Use `IsNumeric`, `IsError`, and `IsEmpty` to check values before using them.

---

### Error 424: Object required

**VBA expected an object and got something else**, often because of a typo or a variable that isn't what you think.

- A misspelled object name: `Sheet1.Rnage("A1")`.
- Using `Set` with a non-object: `Set x = 5`.
- Calling a method on a plain value: `Dim s As String: s.Select`.

**Fix:** Add `Option Explicit` at the top of every module (see below) so typos are caught as compile errors.

---

### Error 438: Object doesn't support this property or method

**The object exists, but the property or method you called doesn't exist on it.**

- `Worksheet.Value` (sheets don't have a `.Value`; ranges do).
- Calling `.Range` on a `Range` when you meant the sheet.
- A method that doesn't exist in your Excel version.

**Fix:** Type the object name followed by a dot and check that the method appears in the IntelliSense list. If it doesn't, it doesn't exist on that object.

---

### Error 6: Overflow

**A number is too large for its variable type.**

- `Integer` tops out at **32,767**. Excel has over a million rows.
  ```vba
  Dim lastRow As Integer   ' Overflows past row 32,767
  Dim lastRow As Long      ' Correct
  ```
- Dividing by zero in some cases also gives overflow.

**Fix:** Use `Long` instead of `Integer` for whole numbers.

---

### Error 11: Division by zero

Exactly what it says. Check the divisor first:

```vba
If d <> 0 Then result = n / d
```

---

### Error 1004 (variant): Method 'Range' of object '_Global' failed

Often appears when a macro uses an unqualified `Range()` from a **module that belongs to a different sheet**, or when the range address string is invalid (`Range("A" & lastRow)` where `lastRow` is 0 or empty). Qualify the sheet and check the address.

---

### Error 70: Permission denied / Error 75: Path/File access error

- The file is **open in another program** or locked by OneDrive/SharePoint sync.
- **You don't have write access** to that folder.
- The path points to a folder that doesn't exist.

---

### Error 53: File not found / Error 76: Path not found

The file or folder path is wrong. Check for typos, missing backslashes, and paths that differ between users (`C:\Users\YourName\...`). Use `ThisWorkbook.Path` to build paths relative to the workbook.

---

### Error 5: Invalid procedure call or argument

A function received an argument it can't use: `Mid("abc", 0, 1)` (start must be ≥ 1), `Left(s, -1)`, or `Chr(999)`.

---

### Error 7: Out of memory

Usually caused by very large arrays, endless loops that keep creating objects, or too many open workbooks. Release objects (`Set x = Nothing`), process data in chunks, and close what you don't need.

---

### Error 1004: PasteSpecial method of Range class failed

The clipboard is empty, usually because something between `.Copy` and `.PasteSpecial` cleared it (a `.Select`, a recalculation, or `Application.CutCopyMode = False`). Paste right after copying, or skip the clipboard:

```vba
Range("B1:B100").Value = Range("A1:A100").Value
```

---

## Compile errors

| Error | Meaning | Fix |
|---|---|---|
| **Variable not defined** | `Option Explicit` is on and you used an undeclared variable (often a typo) | Declare it with `Dim` or fix the spelling |
| **Sub or Function not defined** | You called a procedure that doesn't exist, or misspelled a function | Check the spelling. Make sure the procedure isn't `Private` in another module |
| **Expected End Sub / End If / Next** | A block isn't closed | Match every `If` with `End If`, every `For` with `Next`, every `With` with `End With` |
| **Block If without End If** | Same, for `If` blocks | As above. Indent your code to make these easy to spot |
| **Next without For** | Usually a missing `End If` *inside* the loop | Find the unclosed block inside the loop |
| **Ambiguous name detected** | Two procedures with the same name in the same scope | Rename one |
| **ByRef argument type mismatch** | You passed a variable of a different type than the procedure expects | Declare the variable with the matching type |
| **Can't find project or library** | A missing reference (Tools → References shows "MISSING:") | Untick the missing reference or install the library |

---

## Habits that prevent most errors

1. **Put `Option Explicit` at the top of every module.** Turn it on for new modules permanently: **Tools → Options → Require Variable Declaration**.
2. **Fully qualify references.** Write `ThisWorkbook.Sheets("Data").Range("A1")`, not `Range("A1")`.
3. **Avoid `.Select` and `.Activate`.** Work with objects directly.
4. **Use `Long`, not `Integer`.**
5. **Check `Is Nothing` and `IsError`** after lookups.
6. **Use proper error handling, not `On Error Resume Next` everywhere:**

```vba
Sub DoWork()
    On Error GoTo ErrHandler

    ' ... your code ...

    Exit Sub
ErrHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbExclamation
End Sub
```

`On Error Resume Next` hides errors. If you use it, limit it to one line and turn it off right after with `On Error GoTo 0`.

---

## Quick reference

| # | Message | Most likely cause |
|---|---|---|
| 5 | Invalid procedure call or argument | Bad argument to a function |
| 6 | Overflow | `Integer` used for row numbers |
| 7 | Out of memory | Huge arrays or leaked objects |
| 9 | Subscript out of range | Wrong sheet/workbook name |
| 11 | Division by zero | Divisor is 0 |
| 13 | Type mismatch | Text or error value where a number was expected |
| 53 | File not found | Wrong file path |
| 70 | Permission denied | File open or locked |
| 76 | Path not found | Wrong folder path |
| 91 | Object variable not set | Missing `Set`, or `Find` returned Nothing |
| 424 | Object required | Typo or non-object used as an object |
| 438 | Object doesn't support this property or method | Wrong method for that object |
| 1004 | Application-defined or object-defined error | Unqualified range, protected sheet, bad formula |

---

## Build the Excel foundations behind your macros

Most VBA errors come from how ranges, sheets, and data types work in Excel itself. **Excelio** teaches those foundations in a live spreadsheet, with every task checked.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**

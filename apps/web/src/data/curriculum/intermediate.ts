import { d, task, type ChapterSpec, type SheetSpec } from "./build";

// ─── Intermediate ─────────────────────────────────────────────────────────────

const reps: SheetSpec["rows"] = [
  ["Rep", "Region", "Sales", "Target", "Rating"],
  ["Ava", "North", 48000, 45000, 4],
  ["Ben", "South", 39000, 45000, 5],
  ["Cleo", "North", 51500, 45000, 3],
  ["Dev", "West", 45000, 45000, 4],
  ["Eli", "South", 52500, 50000, 2],
];

const athletes: SheetSpec["rows"] = [
  ["Athlete", "Country", "Gender", "Medal", "Prize"],
  ["Lena", "USA", "Female", "Gold", 500],
  ["Marco", "UK", "Male", "Silver", 300],
  ["Sara", "Australia", "Female", "Bronze", 100],
  ["Tom", "USA", "Male", "Silver", 300],
  ["Iris", "Canada", "Female", "Gold", 500],
  ["Raj", "UK", "Male", "Silver", 300],
  ["Amy", "Australia", "Female", "Gold", 500],
  ["Joe", "Canada", "Male", "Bronze", 100],
];

const employees: SheetSpec["rows"] = [
  ["ID", "Employee", "Department", "Country", "Salary"],
  ["E101", "Olivia Moore", "Sales", "UK", 52000],
  ["E102", "James Lee", "IT", "USA", 68000],
  ["E103", "Olivia Moore", "HR", "Canada", 49000],
  ["E104", "Nina Patel", "Finance", "India", 61000],
  ["E105", "Olivia Moore", "IT", "Australia", 72000],
  ["E106", "Sam Okafor", "Sales", "UK", 47000],
];

const orders: SheetSpec["rows"] = [
  ["Country", "Region", "Revenue", "Profit"],
  ["France", "Europe", 182000, 31000],
  ["Kenya", "Africa", 64000, 9800],
  ["Brazil", "Americas", 121000, 18500],
  ["Germany", "Europe", 205000, 40100],
  ["Ghana", "Africa", 48000, 7200],
  ["Canada", "Americas", 156000, 26400],
  ["Austria", "Europe", 97000, 15800],
];

export const INTERMEDIATE: ChapterSpec[] = [
  {
    id: "i1",
    title: "Spreadsheet Design",
    desc: "Plan the structure, control what people type, and make the workbook easy to navigate.",
    difficulty: "intermediate",
    formula: "=B2*$H$1",
    lessons: [
      {
        title: "Design Better Spreadsheets",
        desc: "Rules that make workbooks easier to use, check and change.",
        learn: `
Spreadsheets built without a plan cause trouble later: colleagues overwrite formulas, nobody knows where to type, and changing one assumption means editing dozens of cells.

- **Adopt a standard**: consistent fonts, colours, number formats and file names.
- **Separate inputs, calculations and outputs**, ideally on different sheets or in clearly marked blocks.
- **Never hard-code a value that may change.** Put rates and targets in labelled input cells and refer to them.
- **One formula per column**, the same all the way down.
- **Make inputs obvious** and **protect the rest** (unlock input cells, then Review ▸ Protect Sheet).
- **Document**: an instructions sheet, notes and clear headings.
- **Keep data in tables**: one header row, no blank rows, no merged cells.

Here the VAT rate lives in one input cell, **H1**. Every formula points at it.

\`\`\`show
cell H1: One clearly marked input cell holds the rate.
type C4 =B4*$H$1: Every formula points at it. Change H1 and every row updates.
\`\`\`
`,
        sheet: {
          rows: [["Product", "Net Price", "VAT", "Gross"], ["Desk", 240, null, null], ["Chair", 95, null, null], ["Lamp", 38, null, null]],
          cells: { G1: "VAT rate", H1: 0.2 },
          bold: ["G1"],
          fmt: { B: "currency", C: "currency", D: "currency", H1: "percentage" },
        },
        steps: [
          task("C2", "Calculate VAT for the desk in **C2** using the input cell H1 (locked).", "=B2*$H$1", "If the rate changes you edit H1 once and every row updates.", { contains: ["$H$1"], fmt: "currency" }),
          task("D2", "Gross price in **D2**: net plus VAT.", "=B2+C2", "Building on the VAT cell keeps each formula short and easy to check.", { fmt: "currency" }),
        ],
      },
      {
        title: "Cell Styles and Data Validation",
        desc: "Mark input cells clearly and stop bad data at the door.",
        learn: `
**Cell styles.** Home ▸ Cell Styles has **Input** (for cells people type in), **Calculation**, **Output**, **Note** and **Check Cell**. Right-click a style ▸ Modify, and every cell using it updates at once.

**Data validation** (Data ▸ Data Validation) controls what can be typed into a cell:

- **List**: an in-cell drop-down from a range or a typed list like \`Yes,No\`.
- **Whole number / Decimal / Date / Text length** limits.
- **Custom**: any formula that returns TRUE or FALSE for the value being typed.
- **Input Message** shows a tip; **Error Alert** decides what happens on bad input: *Stop* blocks it, *Warning* asks, *Information* just tells.

A custom rule for C2 that only allows whole numbers from 1 to 500:

\`\`\`
=AND(ISNUMBER(C2),C2>=1,C2<=500)
\`\`\`

Test rules like this in a spare cell first: TRUE means the value would be accepted.
`,
        sheet: {
          rows: [["Order", "Status", "Qty", "Valid qty?"], [1001, "Shipped", 120, null], [1002, "Pending", 650, null], [1003, "Delivered", 0, null]],
          cells: { G1: "Statuses", G2: "Pending", G3: "Shipped", G4: "Delivered", G5: "Cancelled" },
          bold: ["G1"],
        },
        steps: [
          task("D2", "In **D2**, test the rule for C2: `=AND(ISNUMBER(C2),C2>=1,C2<=500)`.", "=AND(ISNUMBER(C2),C2>=1,C2<=500)", "120 is a number between 1 and 500, so the rule returns TRUE and the entry is allowed."),
          task("D3", "Test the same rule on C3 in **D3**.", "=AND(ISNUMBER(C3),C3>=1,C3<=500)", "650 is over the limit, so FALSE: validation would reject it."),
          task("D4", "And on C4 in **D4**.", "=AND(ISNUMBER(C4),C4>=1,C4<=500)", "0 is below the minimum, so FALSE."),
        ],
      },
      {
        title: "Navigation and Summary Sheets",
        desc: "Hyperlinks, sheet references and 3-D totals.",
        learn: `
**Moving around.** Right-click the arrows left of the sheet tabs for a list of every sheet. **Ctrl + K** inserts a hyperlink; choose *Place in This Document* to link to another sheet.

The \`HYPERLINK\` function builds links with a formula. A \`#\` at the start points inside the workbook:

\`\`\`
=HYPERLINK("#Summary!A1","Back to Summary")
\`\`\`

**Summary sheets.** Reference another sheet as \`=Jan!F20\` (quotes if the name has spaces: \`='North Region'!B5\`). When every month sheet has the same layout, a **3-D reference** adds the same cell across a run of sheets:

\`\`\`
=SUM(Jan:Dec!F20)
\`\`\`

**Forms.** The hidden **Form** command (add it to the QAT) gives a dialog with one box per column for adding and finding records.
`,
        sheet: { rows: [["Sheet", "Link"], ["Summary", null], ["Analysis", null]] },
        steps: [
          task("B2", 'In **B2**, link to the Summary sheet: `=HYPERLINK("#Summary!A1","Go to Summary")`.', '=HYPERLINK("#Summary!A1","Go to Summary")', "The cell shows the friendly text; clicking it jumps to Summary!A1."),
          task("B3", 'In **B3**, link to cell A1 on the **Analysis** sheet, showing the text `Go to Analysis`.', '=HYPERLINK("#Analysis!A1","Go to Analysis")', "Change the sheet name after the #."),
        ],
      },
      {
        title: "Lab: Product Input Sheet",
        kind: "lab",
        desc: "Inputs, a locked rate and a validation check.",
        learn: `
A product table with a 20% sales tax rate in **H1**. Calculate the tax and gross price for each product, then build a check that flags any price outside 1–1,000.
`,
        sheet: {
          rows: [["ID", "Product", "Price", "Sales Tax", "Gross", "Price OK?"], ["P-01", "Kettle", 42, null, null, null], ["P-02", "Toaster", 35.5, null, null, null], ["P-03", "Blender", 1250, null, null, null]],
          cells: { G1: "Sales tax", H1: 0.2 },
          bold: ["G1"],
          fmt: { C: "currency", D: "currency", E: "currency", H1: "percentage" },
        },
        steps: [
          task("D2", "Sales tax for the kettle in **D2** (lock H1).", "=C2*$H$1", "42 × 20% = 8.40.", { contains: ["$H$1"], fmt: "currency" }),
          task("D3", "Sales tax for the toaster in **D3**.", "=C3*$H$1", "Same formula, next row.", { contains: ["$H$1"], fmt: "currency" }),
          task("E2", "Gross price for the kettle in **E2**.", "=C2+D2", "Price plus tax.", { fmt: "currency" }),
          task("F4", "In **F4**, check the blender's price is between 1 and 1000 with AND.", "=AND(C4>=1,C4<=1000)", "1,250 is over the limit, so FALSE. A validation rule with this formula would block it."),
        ],
      },
    ],
  },

  {
    id: "i2",
    title: "Logical Functions",
    desc: "IF, AND, OR, IFS, conditional counting and error handling.",
    difficulty: "intermediate",
    formula: '=IF(C2>=D2,"Hit","Miss")',
    lessons: [
      {
        title: "The IF Function",
        desc: "Make a formula choose between two results.",
        learn: `
A **logical test** is a comparison that's TRUE or FALSE, like \`C2>=D2\`. \`IF\` turns it into a result:

\`\`\`
=IF(logical_test, value_if_true, value_if_false)
\`\`\`

Text results go in quotes. Results can be calculations too: \`=IF(C2>=D2, C2*3%, 0)\`.

Comparison operators: \`=  <>  >  <  >=  <=\`.

\`\`\`show
| Score | Result |
| 72 | |
| 41 | |
type B2 =IF(A2>=50,"Pass","Fail"): Is 72 ≥ 50? TRUE, so **Pass**.
type B3 =IF(A3>=50,"Pass","Fail"): Is 41 ≥ 50? FALSE, so **Fail**.
\`\`\`
`,
        sheet: { rows: reps.map((r, i) => (i === 0 ? [...r, "Hit?", "Bonus"] : [...r, null, null])), fmt: { C: "currency", D: "currency", G: "currency" } },
        steps: [
          task("F2", 'In **F2**, show "Yes" if Ava\'s Sales (C2) are at least her Target (D2), otherwise "No".', '=IF(C2>=D2,"Yes","No")', "48,000 ≥ 45,000, so Yes."),
          task("F3", "Same test for Ben in **F3**.", '=IF(C3>=D3,"Yes","No")', "39,000 is below target, so No."),
          task("G2", "In **G2**, give Ava a 3% bonus on her sales if she hit target, otherwise 0.", "=IF(C2>=D2,C2*3%,0)", "IF can return a calculation: 48,000 × 3% = 1,440.", { fmt: "currency" }),
        ],
      },
      {
        title: "AND and OR",
        desc: "Combine several conditions.",
        learn: `
\`AND(t1, t2, …)\` is TRUE only if **every** test is TRUE. \`OR(t1, t2, …)\` is TRUE if **any** test is TRUE. \`NOT\` flips a result.

On their own they return TRUE or FALSE; put them inside IF for a readable result:

\`\`\`show
| Sales | Rating | AND | OR |
| 52000 | 5 | | |
| 52000 | 2 | | |
type C2 =AND(A2>50000,B2>=4): Both tests are TRUE, so AND gives TRUE.
type C3 =AND(A3>50000,B3>=4): One test is FALSE, so AND gives FALSE.
type D3 =OR(A3>50000,B3>=4): OR only needs one TRUE.
\`\`\`

\`\`\`
=IF(AND(C2>=D2,E2>=4),"Bonus","No bonus")
=IF(OR(B2="North",C2>50000),"Priority","Standard")
\`\`\`
`,
        sheet: { rows: reps.map((r, i) => (i === 0 ? [...r, "Bonus?", "Priority?"] : [...r, null, null])), fmt: { C: "currency", D: "currency" } },
        steps: [
          task("F2", 'In **F2**, award "Bonus" if Ava hit target **and** her rating (E2) is at least 4, otherwise "No bonus".', '=IF(AND(C2>=D2,E2>=4),"Bonus","No bonus")', "Both are true for Ava, so Bonus."),
          task("F4", "Same rule for Cleo in **F4**.", '=IF(AND(C4>=D4,E4>=4),"Bonus","No bonus")', "Cleo hit target but her rating is 3, so AND is FALSE."),
          task("G3", 'In **G3**, mark Ben "Priority" if he\'s in the North **or** sold over 50,000, otherwise "Standard".', '=IF(OR(B3="North",C3>50000),"Priority","Standard")', "Neither is true for Ben, so Standard."),
          task("G6", "Same OR rule for Eli in **G6**.", '=IF(OR(B6="North",C6>50000),"Priority","Standard")', "Eli is in the South but sold 52,500, and one TRUE is enough for OR."),
        ],
      },
      {
        title: "Nested IF and IFS",
        desc: "More than two outcomes.",
        learn: `
For three or more outcomes, put another IF in the *value_if_false* slot:

\`\`\`
=IF(B2>=90,"A",IF(B2>=75,"B",IF(B2>=50,"C","F")))
\`\`\`

**Order matters**: test from the highest threshold down. If you test \`>=50\` first, a 95 gets "C".

\`IFS\` does the same without nesting. It takes test/result pairs and returns the first TRUE one. Finish with \`TRUE,\` as a catch-all:

\`\`\`show
| Score | Grade |
| 92 | |
| 64 | |
type B2 =IFS(A2>=90,"A",A2>=75,"B",TRUE,"C"): 92 passes the first test: **A**.
type B3 =IFS(A3>=90,"A",A3>=75,"B",TRUE,"C"): 64 fails both, so the TRUE catch-all gives **C**.
\`\`\`

\`\`\`
=IFS(B2>=90,"A",B2>=75,"B",B2>=50,"C",TRUE,"F")
\`\`\`
`,
        sheet: { rows: [["Student", "Score", "Nested IF", "IFS"], ["Anna", 92, null, null], ["Bo", 81, null, null], ["Cy", 64, null, null], ["Dee", 47, null, null]] },
        steps: [
          task("C2", "Grade Anna in **C2** with a nested IF: 90+ A, 75+ B, 50+ C, otherwise F.", '=IF(B2>=90,"A",IF(B2>=75,"B",IF(B2>=50,"C","F")))', "92 passes the first test, so A."),
          task("C3", "Grade Bo in **C3** with the same nested IF.", '=IF(B3>=90,"A",IF(B3>=75,"B",IF(B3>=50,"C","F")))', "81 fails ≥90 but passes ≥75, so B."),
          task("D4", "Grade Cy in **D4** using IFS, with TRUE as the catch-all.", '=IFS(B4>=90,"A",B4>=75,"B",B4>=50,"C",TRUE,"F")', "64 → C."),
          task("D5", "Grade Dee in **D5** using IFS.", '=IFS(B5>=90,"A",B5>=75,"B",B5>=50,"C",TRUE,"F")', "47 matches none of the thresholds, so the TRUE catch-all gives F."),
        ],
      },
      {
        title: "COUNTIFS and SUMIFS",
        desc: "Count and add only the rows that meet conditions.",
        learn: `
\`\`\`
=COUNTIFS(range1, criteria1, range2, criteria2, …)
=SUMIFS(sum_range, range1, criteria1, …)
\`\`\`

COUNTIFS counts rows where **all** criteria match. In SUMIFS the **sum range comes first**. In the older SUMIF it comes last.

Criteria can be:

- Text: \`"USA"\`
- A comparison: \`">1000"\`, \`"<>Cancelled"\`
- A wildcard: \`"A*"\` (starts with A)
- A cell: \`H2\`, or an operator joined to a cell: \`">="&H3\`

Also: \`AVERAGEIFS\`, \`MAXIFS\`, \`MINIFS\`.

\`\`\`show
range B2:B9: COUNTIFS checks the criteria range row by row…
type J2 =COUNTIFS(B2:B9,"UK"): …and counts the rows that match: 2 from the UK.
type J3 =SUMIFS(E2:E9,D2:D9,"Gold"): SUMIFS adds the prize column, but only for Gold rows.
\`\`\`
`,
        sheet: {
          rows: athletes,
          cells: { G1: "Question", H1: "Answer", G2: "Athletes from USA", G3: "Australian women", G4: "UK men with Silver", G5: "Prize money, USA", G6: "Prize money, Canadian women", G7: "Prizes of 300 or more" },
          bold: ["G1", "H1"],
          fmt: { E: "currency", H5: "currency", H6: "currency" },
        },
        steps: [
          task("H2", "How many athletes are from the USA? **H2**.", '=COUNTIFS(B2:B9,"USA")', "COUNTIFS with one pair works like COUNTIF: 2."),
          task("H3", "Australian women in **H3**.", '=COUNTIFS(B2:B9,"Australia",C2:C9,"Female")', "Both conditions must match: 2."),
          task("H4", "UK men who won Silver in **H4**.", '=COUNTIFS(B2:B9,"UK",C2:C9,"Male",D2:D9,"Silver")', "Three pairs of criteria: 2."),
          task("H5", "Total prize money for the USA in **H5**.", '=SUMIFS(E2:E9,B2:B9,"USA")', "Sum range first, then the criteria: 800.", { fmt: "currency" }),
          task("H6", "Prize money for Canadian women in **H6**.", '=SUMIFS(E2:E9,B2:B9,"Canada",C2:C9,"Female")', "Only Iris matches: 500.", { fmt: "currency" }),
          task("H7", "How many prizes are 300 or more? **H7**.", '=COUNTIFS(E2:E9,">=300")', "Comparison criteria go in quotes: 6."),
        ],
      },
      {
        title: "IFERROR and IFNA",
        desc: "Show a friendly result instead of an error.",
        learn: `
| Error | Typical cause |
| #DIV/0! | Dividing by zero or a blank |
| #N/A | Lookup value not found |
| #VALUE! | Wrong type, e.g. text in maths |
| #REF! | A referenced cell was deleted |
| #NAME? | Misspelt function or name |

\`=IFERROR(formula, value_if_error)\` catches **every** error. \`=IFNA(formula, value)\` catches only #N/A, which is safer for lookups because real mistakes like #REF! still show.

Only hide errors you expect. Wrapping everything in IFERROR also hides genuine mistakes.

\`\`\`show
| Revenue | Units | Per unit |
| 500 | 0 | |
type C2 =A2/B2: Dividing by zero gives an error.
type C2 =IFERROR(A2/B2,0): IFERROR shows 0 instead.
\`\`\`
`,
        sheet: {
          rows: [["Product", "Revenue", "Units", "Price per unit"], ["Kettle", 8400, 200, null], ["Toaster", 0, 0, null], ["Blender", 5250, 75, null]],
          fmt: { B: "currency", D: "currency" },
        },
        steps: [
          task("D2", "Price per unit in **D2**: Revenue ÷ Units, wrapped in IFERROR returning 0.", "=IFERROR(B2/C2,0)", "8,400 / 200 = 42. No error, so IFERROR passes the result through.", { fmt: "currency" }),
          task("D3", "Same formula in **D3**.", "=IFERROR(B3/C3,0)", "0 / 0 would be #DIV/0!; IFERROR shows 0 instead.", { fmt: "currency" }),
        ],
      },
      {
        title: "Logical Tests in Conditional Formatting",
        desc: "Write the TRUE/FALSE rules that colour whole rows.",
        learn: `
Conditional formatting with **Use a formula** applies a format wherever your formula returns TRUE. Select the whole data body (for example A2:E9), write the formula for the **top-left cell**, and Excel adjusts it for every other cell.

To colour **entire rows**, lock the column but not the row:

\`\`\`
=$D2="Gold"
\`\`\`

Every cell in row 2 checks column D of row 2; row 3 checks D3, and so on. Combine conditions with AND / OR:

\`\`\`show
type F5 =$D5="Gold": The rule for row 5 checks column D of row 5…
fill F5 F9: …copy it down and each row checks its own D cell. The \`$\` keeps it on column D.
\`\`\`

\`\`\`
=AND($B2="USA",$D2="Gold")
\`\`\`

Test a rule in a spare column first. TRUE means the row would be formatted.
`,
        sheet: { rows: athletes.map((r, i) => (i === 0 ? [...r, "Rule"] : [...r, null])), fmt: { E: "currency" } },
        steps: [
          task("F2", 'In **F2**, write the rule for row 2 that highlights Gold medals: `=$D2="Gold"`.', '=$D2="Gold"', "Lena won Gold, so TRUE: her row would be highlighted.", { contains: ["$D2"] }),
          task("F3", "Write the same rule for row 3 in **F3**.", '=$D3="Gold"', "Marco won Silver, so FALSE.", { contains: ["$D3"] }),
          task("F6", "In **F6**, test a rule for USA **and** Gold on row 6.", '=AND($B6="USA",$D6="Gold")', "Iris is from Canada, so FALSE even though she won Gold.", { contains: ["$B6", "$D6"] }),
        ],
      },
      {
        title: "Lab: Athlete Prize Money",
        kind: "lab",
        desc: "Prize money from medals, then conditional counts and totals.",
        learn: `
Fill in the prize money from the medal using IFS and the prize table in H2:I4 (lock those cells). Then answer the questions underneath with COUNTIFS and SUMIFS.
`,
        sheet: {
          rows: athletes.map((r, i) => (i === 0 ? r : [...r.slice(0, 4), null])),
          cells: { H1: "Medal", I1: "Prize", H2: "Gold", I2: 500, H3: "Silver", I3: 300, H4: "Bronze", I4: 100, H6: "From USA", H7: "UK, male, Silver", H8: "Total prize, USA", H9: "Total prize, Canadian women" },
          bold: ["H1", "I1", "H6", "H7", "H8", "H9"],
          fmt: { E: "currency", I: "currency" },
        },
        steps: [
          task("E2", "Prize for Lena in **E2** with IFS, using the locked prize table.", '=IFS(D2="Gold",$I$2,D2="Silver",$I$3,D2="Bronze",$I$4)', "Referencing the table instead of typing 500 means prizes can change without editing formulas.", { fmt: "currency", contains: ["$I$2"] }),
          task("E3", "Prize for Marco in **E3**.", '=IFS(D3="Gold",$I$2,D3="Silver",$I$3,D3="Bronze",$I$4)', "Silver → 300.", { fmt: "currency" }),
          task("E4", "Prize for Sara in **E4**.", '=IFS(D4="Gold",$I$2,D4="Silver",$I$3,D4="Bronze",$I$4)', "Bronze → 100.", { fmt: "currency" }),
          task("I6", "How many athletes are from the USA? **I6**.", '=COUNTIFS(B2:B9,"USA")', "Two."),
          task("I7", "UK men with Silver in **I7**.", '=COUNTIFS(B2:B9,"UK",C2:C9,"Male",D2:D9,"Silver")', "Marco and Raj."),
          task("I8", "Total prize money for the USA in **I8**. Prizes you haven't filled in count as blank.", '=SUMIFS(E2:E9,B2:B9,"USA")', "Lena's 500 so far. Fill in the remaining prizes and this updates on its own.", { fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "i3",
    title: "Lookup Functions",
    desc: "VLOOKUP to XLOOKUP, two-way lookups, and duplicates.",
    difficulty: "intermediate",
    formula: "=XLOOKUP(A3,A2:A4,B2:B4)",
    lessons: [
      {
        title: "VLOOKUP: Exact and Approximate Match",
        desc: "Find a value in the first column and return a value from another column.",
        learn: `
\`\`\`
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
\`\`\`

- **FALSE** (or 0) = exact match. Use it for IDs, names and codes.
- **TRUE** (the default) = approximate match: it returns the largest value **less than or equal to** the lookup value. The first column must be **sorted ascending**. Use it for bands: tax rates, grades, commission tiers.

Limits: VLOOKUP only looks to the **right**, the column number breaks if someone inserts a column, and it only returns the first match. XLOOKUP fixes all three.

\`\`\`show
range G2:H5: The band table. Its first column is sorted smallest to largest.
type I2 =VLOOKUP(68,G2:H5,2,TRUE): 68 isn't in the list, so VLOOKUP takes the largest value below it (50) and returns **C**.
\`\`\`
`,
        sheet: {
          rows: employees,
          cells: { G1: "Min Score", H1: "Grade", G2: 0, H2: "F", G3: 50, H3: "C", G4: 75, H4: "B", G5: 90, H5: "A", G7: "Score", H7: "Grade", G8: 83, G9: 49 },
          bold: ["G1", "H1", "G7", "H7"],
          fmt: { E: "currency" },
        },
        steps: [
          task("H8", "Grade the score in G8 with an **approximate** VLOOKUP against the band table G2:H5.", "=VLOOKUP(G8,$G$2:$H$5,2,TRUE)", "83 isn't in the table, so Excel takes the largest band ≤ 83, which is 75 → B."),
          task("H9", "Grade the score in G9 the same way.", "=VLOOKUP(G9,$G$2:$H$5,2,TRUE)", "49 falls in the 0 band → F."),
          task("G11", 'In **G11**, find employee **E104**\'s department with an **exact** VLOOKUP on A2:E7.', '=VLOOKUP("E104",A2:E7,3,FALSE)', "Department is the 3rd column of the table, so col_index 3: Finance."),
        ],
      },
      {
        title: "HLOOKUP",
        desc: "The horizontal version, for data laid out in rows.",
        learn: `
\`\`\`
=HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])
\`\`\`

HLOOKUP searches the **top row** and returns a value from a row below. It's useful when months or years run across the top. Like VLOOKUP, use FALSE for an exact match.
`,
        sheet: {
          rows: [["Metric", "Jan", "Feb", "Mar", "Apr", "May", "Jun"], ["Sales", 410, 455, 380, 520, 610, 590], ["Costs", 300, 310, 295, 340, 365, 360]],
          cells: { A5: "Apr sales", A6: "Jun costs" },
          bold: ["A5", "A6"],
        },
        steps: [
          task("B5", 'April sales in **B5**: `=HLOOKUP("Apr",A1:G3,2,FALSE)`.', '=HLOOKUP("Apr",A1:G3,2,FALSE)', "Row 2 of the table is Sales: 520."),
          task("B6", "June costs in **B6**.", '=HLOOKUP("Jun",A1:G3,3,FALSE)', "Costs are row 3 of the table: 360."),
        ],
      },
      {
        title: "INDEX and MATCH",
        desc: "Look left, survive inserted columns, and do two-way lookups.",
        learn: `
\`MATCH(value, range, 0)\` returns the **position** of a value in a list. \`INDEX(range, n)\` returns the **n-th** item. Together:

\`\`\`
=INDEX(return_column, MATCH(lookup_value, lookup_column, 0))
\`\`\`

The return column can be **left** of the lookup column, and inserting columns doesn't break it.

\`\`\`show
| Name | Score |
| Ana | 81 |
| Ben | 93 |
| Cy | 77 |
type D2 =MATCH("Ben",A2:A4,0): MATCH finds Ben's **position** in the list: 2.
type D3 =INDEX(B2:B4,2): INDEX returns the 2nd item from the scores: 93.
type D4 =INDEX(B2:B4,MATCH("Ben",A2:A4,0)): Put together: look up Ben's score.
\`\`\`

For a **two-way lookup** (row and column), give INDEX two MATCHes:

\`\`\`
=INDEX(B2:G4, MATCH(row_item, A2:A4, 0), MATCH(col_item, B1:G1, 0))
\`\`\`
`,
        sheet: {
          rows: [["Company", "Jan", "Feb", "Mar", "Apr"], ["Skyway", 120, 135, 150, 128], ["Oceanic", 98, 104, 111, 120], ["Trailblaze", 143, 151, 139, 160]],
          cells: { G1: "Company", H1: "Oceanic", G2: "Month", H2: "Mar", G4: "Position of Mar", G5: "Revenue", G6: "Company with 160" },
          bold: ["G1", "G2", "G4", "G5", "G6"],
        },
        steps: [
          task("H4", "In **H4**, find the position of the month in H2 within B1:E1 using MATCH.", "=MATCH(H2,B1:E1,0)", "Mar is the 3rd month in the list. The 0 means exact match."),
          task("H5", "Two-way lookup in **H5**: revenue for the company in H1 and the month in H2.", "=INDEX(B2:E4,MATCH(H1,A2:A4,0),MATCH(H2,B1:E1,0))", "Row 2 (Oceanic), column 3 (Mar) of the block → 111."),
          task("H6", "Which company had 160 in April? Look **left** with INDEX/MATCH in **H6**.", "=INDEX(A2:A4,MATCH(160,E2:E4,0))", "Match in column E, return from column A: Trailblaze. VLOOKUP can't do this."),
        ],
      },
      {
        title: "XLOOKUP and XMATCH",
        desc: "One function that replaces VLOOKUP, HLOOKUP and INDEX/MATCH.",
        learn: `
\`\`\`
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
\`\`\`

- Exact match by default, no column counting, and it looks left or right.
- **if_not_found** gives a built-in friendly message.
- **match_mode**: 0 exact, -1 exact or next smaller, 1 exact or next larger, 2 wildcard.
- **search_mode**: 1 first to last, **-1 last to first** (finds the latest entry).
- Return a block (for example C2:E7) and the result **spills** across several cells.

\`XMATCH\` is the modern MATCH: exact by default and able to search from the end.

\`\`\`show
| Name | Score |
| Ana | 81 |
| Ben | 93 |
| Cy | 77 |
type D2 =XLOOKUP("Cy",A2:A4,B2:B4): Look up in A, return from B. No column numbers.
type D3 =XLOOKUP("Zoe",A2:A4,B2:B4,"Not found"): Not in the list? The 4th argument is the message.
\`\`\`
`,
        sheet: {
          rows: employees,
          cells: { G1: "Look up ID", H1: "E104", G3: "Employee", G4: "Not found test", G5: "Last Sales hire", G6: "Position of E105", G8: "Dept, Country, Salary" },
          bold: ["G1", "G3", "G4", "G5", "G6", "G8"],
          fmt: { E: "currency" },
        },
        steps: [
          task("H3", "In **H3**, return the employee name for the ID in H1 with XLOOKUP.", "=XLOOKUP(H1,A2:A7,B2:B7)", "No column numbers: lookup array A, return array B. Nina Patel."),
          task("H4", 'In **H4**, look up ID `"E999"` with an if_not_found of `"Not found"`.', '=XLOOKUP("E999",A2:A7,B2:B7,"Not found")', "The fourth argument replaces IFNA."),
          task("H5", 'In **H5**, find the **last** employee in Sales: look up "Sales" in C2:C7, return B2:B7, searching last to first.', '=XLOOKUP("Sales",C2:C7,B2:B7,,0,-1)', "search_mode -1 starts from the bottom: Sam Okafor."),
          task("H6", 'Position of `"E105"` in A2:A7 with XMATCH in **H6**.', '=XMATCH("E105",A2:A7)', "XMATCH is exact by default: 5."),
          task("H8", "In **H8**, return Department, Country **and** Salary for H1 in one formula (return C2:E7).", "=XLOOKUP(H1,A2:A7,C2:E7)", "Returning three columns spills the result into H8:J8.", { spill: true }),
        ],
      },
      {
        title: "Lookups with Duplicates",
        desc: "When the lookup value repeats, match on more than one column.",
        learn: `
There are three Olivia Moores in this list. Any lookup on the name alone returns the **first** one, which may be the wrong person. Make the match unique by combining columns.

\`\`\`show
range B2:B7: Three people share the same name…
type G9 =XLOOKUP("Olivia Moore"&"IT",B2:B7&C2:C7,D2:D7): …so join name and department into one key: the IT Olivia lives in **Australia**.
\`\`\`

**Joined keys**: join the lookup values and the lookup columns with &:

\`\`\`
=XLOOKUP(H1&H2, B2:B7&C2:C7, D2:D7)
\`\`\`

**Boolean multiply**: each condition gives TRUE/FALSE; multiplying them gives 1 only when all are TRUE, so look up 1:

\`\`\`
=XLOOKUP(1, (B2:B7=H1)*(C2:C7=H2), D2:D7)
\`\`\`
`,
        sheet: { rows: employees, cells: { G1: "Employee", H1: "Olivia Moore", G2: "Department", H2: "HR", G4: "Name only", G5: "Joined keys", G6: "Boolean" }, bold: ["G1", "G2", "G4", "G5", "G6"], fmt: { E: "currency" } },
        steps: [
          task("H4", "First, a plain XLOOKUP on the name only in **H4**, returning Country.", "=XLOOKUP(H1,B2:B7,D2:D7)", "It returns UK, the first Olivia Moore, who works in Sales. Wrong person."),
          task("H5", "Now use joined keys in **H5**: name & department.", "=XLOOKUP(H1&H2,B2:B7&C2:C7,D2:D7)", "Olivia Moore + HR is unique: Canada."),
          task("H6", "Same answer in **H6** with the boolean multiply method.", "=XLOOKUP(1,(B2:B7=H1)*(C2:C7=H2),D2:D7)", "Only the row where both tests are TRUE gives 1."),
        ],
      },
      {
        title: "CHOOSE and SWITCH",
        desc: "Pick by position, or match one value against a list of cases.",
        learn: `
\`=CHOOSE(index_num, value1, value2, …)\` returns the item at that position. \`=CHOOSE(2,"Low","Med","High")\` gives Med. It's handy for scenario switches and turning numbers into labels.

\`=SWITCH(expression, value1, result1, …, [default])\` compares **one** value against exact cases. It's tidier than IFS when every test is an equality. It can't do > or < comparisons; use IFS for those.

\`\`\`
=SWITCH(B2,"N","North","S","South","E","East","W","West","Unknown")
\`\`\`
`,
        sheet: {
          rows: [["Store", "Code", "Region", "Quarter", "Label"], ["Leeds", "N", null, 1, null], ["Hull", "E", null, 3, null], ["Bath", "X", null, 4, null]],
        },
        steps: [
          task("C2", "In **C2**, turn the code in B2 into a region name with SWITCH (N, S, E, W), default `Unknown`.", '=SWITCH(B2,"N","North","S","South","E","East","W","West","Unknown")', "N → North."),
          task("C4", "Same SWITCH for Bath in **C4**.", '=SWITCH(B4,"N","North","S","South","E","East","W","West","Unknown")', "X matches no case, so the default Unknown is returned."),
          task("E3", 'In **E3**, label the quarter in D3 with CHOOSE: 1 → "Q1 Winter", 2 → "Q2 Spring", 3 → "Q3 Summer", 4 → "Q4 Autumn".', '=CHOOSE(D3,"Q1 Winter","Q2 Spring","Q3 Summer","Q4 Autumn")', "D3 is 3, so the third item."),
        ],
      },
      {
        title: "Lab: Marathon Results Lookup",
        kind: "lab",
        desc: "Return a runner's details, with error handling.",
        learn: `
Type a runner's name into **H1** to look them up. Return their bib number, route and finishing position, and handle names that aren't in the list.
`,
        sheet: {
          rows: [["Athlete", "Bib", "Route", "Position"], ["Kofi Mensah", 214, "East Loop", 3], ["Lucy Hart", 118, "West Loop", 1], ["Diego Ruiz", 305, "East Loop", 5], ["Mei Chen", 142, "West Loop", 2], ["Ola Berg", 276, "East Loop", 4]],
          cells: { G1: "Athlete", H1: "Mei Chen", G2: "Bib", G3: "Route", G4: "Position", G6: "Missing runner" },
          bold: ["G1", "G2", "G3", "G4", "G6"],
          editable: ["H1"],
        },
        steps: [
          task("H2", "Bib number for the athlete in H1, in **H2**.", '=XLOOKUP(H1,A2:A6,B2:B6,"Not found")', "142."),
          task("H3", "Route in **H3**.", '=XLOOKUP(H1,A2:A6,C2:C6,"Not found")', "West Loop."),
          task("H4", "Position in **H4**, this time with INDEX/MATCH.", "=INDEX(D2:D6,MATCH(H1,A2:A6,0))", "2nd place."),
          task("H6", 'In **H6**, look up `"Sam Fox"` with VLOOKUP wrapped in IFNA showing `"Not found"`.', '=IFNA(VLOOKUP("Sam Fox",A2:D6,2,FALSE),"Not found")', "IFNA catches only the #N/A from a missing name."),
        ],
      },
    ],
  },

  {
    id: "i4",
    title: "Sorting and Filtering",
    desc: "Multi-level and custom sorts, then SORT, SORTBY, FILTER and UNIQUE.",
    difficulty: "intermediate",
    formula: "=SORT(FILTER(A2:D8,B2:B8=G1),1,1)",
    lessons: [
      {
        title: "The SORT and SORTBY Functions",
        desc: "Formulas that return a sorted copy and stay up to date.",
        learn: `
\`\`\`
=SORT(array, [sort_index], [sort_order], [by_col])
\`\`\`

\`=SORT(A2:D8, 3, -1)\` returns the data sorted by its 3rd column, largest first, as a **spilled** array that updates when the source changes. Your source data stays untouched.

Several keys: \`=SORT(A2:D8,{2,3},{1,-1})\` sorts by column 2 ascending, then column 3 descending.

\`=SORTBY(array, by_array1, order1, …)\` sorts by ranges rather than column numbers, and the sort range doesn't have to be in the output.

\`\`\`show
| Fruit | Sold |
| Apple | 30 |
| Kiwi | 75 |
| Pear | 12 |
type D2 =SORT(A2:B4,2,-1): One formula sorts the whole table by column 2, largest first. The results **spill** into the cells around it.
\`\`\`
`,
        sheet: { rows: orders, fmt: { C: "currency", D: "currency" } },
        steps: [
          task("F2", "In **F2**, return the whole table sorted by Revenue (column 3), highest first.", "=SORT(A2:D8,3,-1)", "Germany comes first with 205,000. The result spills into F2:I8.", { spill: true }),
          task("K2", "In **K2**, return just the country names sorted by Profit, lowest first, with SORTBY.", "=SORTBY(A2:A8,D2:D8,1)", "Profit isn't in the output but still drives the order: Ghana first.", { spill: true }),
        ],
      },
      {
        title: "The FILTER Function",
        desc: "Return only the rows that meet criteria, live.",
        learn: `
\`\`\`
=FILTER(array, include, [if_empty])
\`\`\`

\`=FILTER(A2:D8, B2:B8=G1, "No records")\` returns every row whose Region equals G1. The *include* argument is a TRUE/FALSE test the same height as the data, and *if_empty* is shown when nothing matches (otherwise you'd get #CALC!).

Wrap it to sort the results:

\`\`\`show
| Fruit | Sold |
| Apple | 30 |
| Kiwi | 75 |
| Pear | 12 |
type D2 =FILTER(A2:B4,B2:B4>20): FILTER returns only the rows where Sold is over 20.
\`\`\`

\`\`\`
=SORT(FILTER(A2:D8,B2:B8=G1,"None"),1,1)
\`\`\`
`,
        sheet: { rows: orders, cells: { F1: "Region", G1: "Europe" }, bold: ["F1"], editable: ["G1"], fmt: { C: "currency", D: "currency" } },
        steps: [
          task("F3", "In **F3**, FILTER the table to the region in G1, with `\"No records\"` if empty.", '=FILTER(A2:D8,B2:B8=G1,"No records")', "Three European countries spill out. Change G1 and the list updates.", { spill: true }),
          task("F8", 'In **F8**, filter for rows where Revenue is over 150,000, sorted by country A–Z.', "=SORT(FILTER(A2:D8,C2:C8>150000),1,1)", "Canada, France and Germany, alphabetically.", { spill: true }),
        ],
      },
      {
        title: "Extract and Sort Unique Values",
        desc: "UNIQUE returns a de-duplicated list that updates itself.",
        learn: `
\`=UNIQUE(B2:B8)\` lists each region once. \`=SORT(UNIQUE(B2:B8))\` sorts that list.

Because the result spills, refer to the whole list with the **spill operator** \`#\`: if UNIQUE is in F2, then \`F2#\` means "the whole spilled list". A data-validation list with Source \`=$F$2#\` becomes a drop-down that grows on its own.

\`\`\`
=COUNTA(UNIQUE(B2:B8))
\`\`\`

counts how many different regions there are.

\`\`\`show
| Region |
| North |
| South |
| North |
| East |
type C2 =UNIQUE(A2:A5): UNIQUE lists each region once and spills the list.
type E2 =COUNTA(C2#): \`C2#\` means the whole spilled list, however long it gets.
\`\`\`
`,
        sheet: { rows: orders, fmt: { C: "currency", D: "currency" } },
        steps: [
          task("F2", "In **F2**, return a sorted unique list of regions.", "=SORT(UNIQUE(B2:B8))", "Africa, Americas, Europe.", { spill: true }),
          task("H2", "In **H2**, count the regions by pointing COUNTA at the spill: `=COUNTA(F2#)`.", "=COUNTA(F2#)", "F2# grows and shrinks with the list, so the count is always right.", { contains: ["F2#"] }),
        ],
      },
      {
        title: "Lab: Region Filter",
        kind: "lab",
        desc: "Unique list, live filter, friendly message, sorted output.",
        learn: `
Build a mini report: a unique region list, then a filtered and sorted view of the region typed in **G1**.
`,
        sheet: { rows: orders, cells: { F1: "Region", G1: "Africa", F3: "Regions" }, bold: ["F1", "F3"], editable: ["G1"], fmt: { C: "currency", D: "currency" } },
        steps: [
          task("F4", "Unique list of regions in **F4** (unsorted).", "=UNIQUE(B2:B8)", "Europe, Africa, Americas, in order of first appearance.", { spill: true }),
          task("H3", 'In **H3**, filter rows for the region in G1, with "No records for this region" if empty, sorted A–Z by country.', '=SORT(FILTER(A2:D8,B2:B8=G1,"No records for this region"),1,1)', "Ghana then Kenya.", { spill: true }),
          task("H6", "In **H6**, total the revenue for the region in G1 with SUMIFS.", "=SUMIFS(C2:C8,B2:B8,G1)", "112,000 for Africa.", { fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "i5",
    title: "Finding Duplicates",
    desc: "Spot repeats with conditional formatting rules and formulas.",
    difficulty: "intermediate",
    formula: "=COUNTIF($A$2:$A$9,A2)>1",
    lessons: [
      {
        title: "Duplicates with Conditional Formatting",
        desc: "One-click highlighting, and rules for duplicate rows.",
        learn: `
Select a range ▸ Home ▸ Conditional Formatting ▸ **Highlight Cells Rules ▸ Duplicate Values**. Choose Duplicate or Unique and a format, then use Filter by Colour to see only those rows.

For duplicate **rows** (the same name *and* date), use a formula rule:

\`\`\`
=COUNTIFS($A$2:$A$9,$A2,$B$2:$B$9,$B2)>1
\`\`\`

COUNTIF counts how many times the value appears in the whole list; more than 1 means it's a duplicate.
`,
        sheet: {
          rows: [["Invoice", "Customer", "Duplicate?"], ["INV-1001", "Northwind", null], ["INV-1002", "Contoso", null], ["INV-1003", "Fabrikam", null], ["INV-1002", "Contoso", null], ["INV-1005", "Litware", null], ["INV-1003", "Fabrikam", null]],
        },
        steps: [
          task("C2", "In **C2**, flag whether A2 appears more than once in A2:A7 (lock the range).", "=COUNTIF($A$2:$A$7,A2)>1", "INV-1001 appears once, so FALSE.", { contains: ["$A$2:$A$7"] }),
          task("C3", "Same test for row 3 in **C3**.", "=COUNTIF($A$2:$A$7,A3)>1", "INV-1002 appears twice, so TRUE: a duplicate."),
        ],
      },
      {
        title: "Duplicates with Formulas",
        desc: "Flag repeats, mark only later copies, and compare two lists.",
        learn: `
Formulas give you a column you can filter, sort and count:

\`\`\`
=COUNTIF($A$2:$A$9,A2)>1                     every copy of a duplicate
=IF(COUNTIF($A$2:A2,A2)>1,"Duplicate","")    only the 2nd and later copies
=IF(COUNTIF($C$2:$C$7,A2)>0,"In both","")    is A2 in the other list?
\`\`\`

The middle one uses an **expanding range**: only the start is locked, so the range grows as the formula goes down and each row only looks at the rows above it.

\`\`\`show
| Item | Repeat? |
| Pen | |
| Ink | |
| Pen | |
type B2 =COUNTIF($A$2:A2,A2)>1: Each row only looks at the rows above it…
fill B2 B4: …so the second Pen is flagged TRUE and the first isn't.
\`\`\`
`,
        sheet: {
          rows: [["List A", "Flag", "List B", "In both?"], ["France", null, "Spain", null], ["Germany", null, "Italy", null], ["Spain", null, "France", null], ["Kenya", null, "Chile", null], ["Japan", null, "Japan", null], ["Spain", null, "Ghana", null]],
        },
        steps: [
          task("B4", 'In **B4**, mark only repeat copies: `=IF(COUNTIF($A$2:A4,A4)>1,"Duplicate","")`.', '=IF(COUNTIF($A$2:A4,A4)>1,"Duplicate","")', "Spain in row 4 is its first appearance, so blank.", { contains: ["$A$2:A4"] }),
          task("B7", "Same expanding-range formula for row 7 in **B7**.", '=IF(COUNTIF($A$2:A7,A7)>1,"Duplicate","")', "This is Spain's second appearance, so it's flagged.", { contains: ["$A$2:A7"] }),
          task("D2", 'In **D2**, show "In both" if Spain (C2) appears in List A.', '=IF(COUNTIF($A$2:$A$7,C2)>0,"In both","")', "Spain is in List A."),
          task("D3", "Same test for Italy in **D3**.", '=IF(COUNTIF($A$2:$A$7,C3)>0,"In both","")', "Italy isn't in List A, so blank."),
        ],
      },
      {
        title: "Lab: Compare Two Country Lists",
        kind: "lab",
        desc: "Which countries appear in both lists?",
        learn: `
Compare List 1 (column A) with List 2 (column B). Flag the countries in List 1 that are also in List 2, then count them.
`,
        sheet: {
          rows: [["List 1", "List 2", "Result"], ["Brazil", "Peru", null], ["Egypt", "Brazil", null], ["Norway", "Japan", null], ["Japan", "Chile", null], ["Peru", "Norway", null], ["Fiji", "Mali", null]],
          cells: { E1: "Countries in both" },
          bold: ["E1"],
        },
        steps: [
          task("C2", 'In **C2**, show "In both" if A2 appears in List 2, otherwise blank.', '=IF(COUNTIF($B$2:$B$7,A2)>0,"In both","")', "Brazil is in List 2."),
          task("C3", "Same for Egypt in **C3**.", '=IF(COUNTIF($B$2:$B$7,A3)>0,"In both","")', "Egypt isn't, so blank."),
          task("F1", "In **F1**, count how many List 1 countries appear in List 2 with SUMPRODUCT and COUNTIF.", "=SUMPRODUCT(--(COUNTIF(B2:B7,A2:A7)>0))", "COUNTIF checks every List 1 item at once; -- turns TRUE/FALSE into 1/0 for SUMPRODUCT to add: 4.", { fns: ["SUMPRODUCT", "COUNTIF"] }),
        ],
      },
    ],
  },

  {
    id: "i6",
    title: "Statistical Functions",
    desc: "Averages, top-N, rankings and totals that ignore hidden rows.",
    difficulty: "intermediate",
    formula: "=RANK.EQ(B2,$B$2:$B$9)",
    lessons: [
      {
        title: "Mean, Median and Mode",
        desc: "Three kinds of average and when to use each.",
        learn: `
- **Mean** \`AVERAGE\`: sum ÷ count. Pulled up or down by outliers.
- **Median** \`MEDIAN\`: the middle value. Better for salaries and house prices.
- **Mode** \`MODE.SNGL\`: the most frequent value. \`MODE.MULT\` returns every mode if there's a tie.

Salaries of 30k, 32k, 35k, 36k and 250k have a mean of 76.6k but a median of 35k. The median describes the typical person better.

\`\`\`show
| Salary |
| 30000 |
| 32000 |
| 35000 |
| 250000 |
type C2 =AVERAGE(A2:A5): One huge salary drags the average up…
type C3 =MEDIAN(A2:A5): …the median (the middle) stays typical.
\`\`\`
`,
        sheet: { rows: [["Player", "Score"], ["Ali", 72], ["Bea", 85], ["Cal", 72], ["Dot", 90], ["Eli", 64], ["Fin", 85], ["Gus", 72], ["Hal", 58]], cells: { D1: "Mean", D2: "Median", D3: "Mode" }, bold: ["D1", "D2", "D3"] },
        steps: [
          task("E1", "Mean score in **E1**.", "=AVERAGE(B2:B9)", "598 ÷ 8 = 74.75."),
          task("E2", "Median score in **E2**.", "=MEDIAN(B2:B9)", "Sorted, the middle two are 72 and 72, so 72."),
          task("E3", "Most common score in **E3** with MODE.SNGL.", "=MODE.SNGL(B2:B9)", "72 appears three times."),
        ],
      },
      {
        title: "LARGE, SMALL and RANK",
        desc: "Top-N values and positions in a list.",
        learn: `
\`=LARGE(range, k)\` returns the k-th largest value (\`k=1\` is the same as MAX). \`SMALL\` works from the bottom.

\`=RANK.EQ(number, ref, [order])\`: order 0 (or left out) ranks the highest as 1; order 1 ranks the lowest as 1 (good for race times). Tied values share a rank and the next one is skipped (1, 2, 2, 4).

\`RANK.AVG\` gives ties the average rank (1, 2.5, 2.5, 4). Always lock the ref range: \`$B$2:$B$9\`.

\`\`\`show
| Score | Rank |
| 90 | |
| 85 | |
| 85 | |
| 70 | |
type B2 =RANK.EQ(A2,$A$2:$A$5): Highest score = rank 1.
fill B2 B5: The two 85s share rank 2, so there's no rank 3.
\`\`\`
`,
        sheet: { rows: [["Player", "Score", "Rank"], ["Ali", 72, null], ["Bea", 85, null], ["Cal", 72, null], ["Dot", 90, null], ["Eli", 64, null], ["Fin", 85, null], ["Gus", 72, null], ["Hal", 58, null]], cells: { E1: "2nd highest", E2: "Lowest", E3: "Top 3 total" }, bold: ["E1", "E2", "E3"] },
        steps: [
          task("F1", "Second-highest score in **F1**.", "=LARGE(B2:B9,2)", "90 is first, then 85."),
          task("F2", "Lowest score in **F2** with SMALL.", "=SMALL(B2:B9,1)", "SMALL(…,1) is the same as MIN: 58."),
          task("F3", "Total of the top three scores in **F3**: `=SUM(LARGE(B2:B9,{1,2,3}))`.", "=SUM(LARGE(B2:B9,{1,2,3}))", "The array {1,2,3} asks for the 1st, 2nd and 3rd largest at once: 90 + 85 + 85."),
          task("C3", "Rank Bea in **C3**, highest score = 1 (lock the range).", "=RANK.EQ(B3,$B$2:$B$9)", "Bea and Fin tie on 85, so both rank 2.", { contains: ["$B$2:$B$9"] }),
          task("C9", "Rank Hal in **C9** with the **lowest** score as 1.", "=RANK.EQ(B9,$B$2:$B$9,1)", "order 1 = ascending, so 58 ranks 1."),
        ],
      },
      {
        title: "SUBTOTAL and AGGREGATE",
        desc: "Totals that ignore filtered rows, subtotals and errors.",
        learn: `
\`=SUBTOTAL(function_num, range)\`:

| Function | Include hidden | Ignore hidden |
| AVERAGE | 1 | 101 |
| COUNT | 2 | 102 |
| MAX | 4 | 104 |
| MIN | 5 | 105 |
| SUM | 9 | 109 |

Rows hidden by a **filter** are always ignored. SUBTOTAL also skips other SUBTOTALs in its range, so subtotals aren't counted twice.

\`=AGGREGATE(function_num, options, range)\` can also **ignore errors** (option 6). A SUM over a range containing #N/A fails, but \`=AGGREGATE(9,6,B2:B9)\` works.
`,
        sheet: {
          rows: [["Region", "Sales"], ["North", 1200], ["North", 950], ["North subtotal", "=SUBTOTAL(9,B2:B3)"], ["South", 1430], ["South", "=NA()"], ["South", 870]],
          cells: { D1: "Grand total (SUBTOTAL)", D2: "Total ignoring errors" },
          bold: ["D1", "D2", "A4"],
        },
        steps: [
          task("E1", "In **E1**, total B2:B4 with SUBTOTAL 9. The North subtotal in B4 should not be counted twice.", "=SUBTOTAL(9,B2:B4)", "SUBTOTAL skips the subtotal in B4: 2,150, not 4,300."),
          task("E2", "In **E2**, sum B5:B7 ignoring the #N/A with AGGREGATE (function 9, option 6).", "=AGGREGATE(9,6,B5:B7)", "1,430 + 870 = 2,300; the error is skipped."),
        ],
      },
      {
        title: "Lab: Video Game Scores",
        kind: "lab",
        desc: "Averages, mode and rankings.",
        learn: `
Calculate the summary statistics, then rank the players by score in **ascending** order (lowest score = 1).
`,
        sheet: {
          rows: [["Player", "Score", "Rank (asc)"], ["Nova", 1200, null], ["Rex", 950, null], ["Pip", 1430, null], ["Zed", 950, null], ["Ivy", 1100, null], ["Kai", 1430, null], ["Lux", 950, null]],
          cells: { E1: "Average", E2: "Median", E3: "Most common" },
          bold: ["E1", "E2", "E3"],
        },
        steps: [
          task("F1", "Average score in **F1**.", "=AVERAGE(B2:B8)", "8,010 ÷ 7."),
          task("F2", "Median score in **F2**.", "=MEDIAN(B2:B8)", "The middle of 7 sorted values: 1,100."),
          task("F3", "Most common score in **F3**.", "=MODE.SNGL(B2:B8)", "950 appears three times."),
          task("C2", "Rank Nova in ascending order in **C2**.", "=RANK.EQ(B2,$B$2:$B$8,1)", "Three 950s share rank 1, Ivy is 4th, so Nova is 5th.", { contains: ["$B$2:$B$8"] }),
          task("C3", "Rank Rex in ascending order in **C3**.", "=RANK.EQ(B3,$B$2:$B$8,1)", "Rex is one of the three tied lowest scores, so rank 1.", { contains: ["$B$2:$B$8"] }),
        ],
      },
    ],
  },

  {
    id: "i7",
    title: "Rounding",
    desc: "Round values for real, not just how they look.",
    difficulty: "intermediate",
    formula: "=ROUND(B2*1.025,2)",
    lessons: [
      {
        title: "ROUND, ROUNDUP and ROUNDDOWN",
        desc: "Change the value, not only the display.",
        learn: `
Decrease Decimal only changes how a value **looks**. Calculations still use the full value, which is why totals can look a cent out. \`ROUND\` changes the actual value.

\`=ROUND(number, num_digits)\`:

- \`2\` → nearest cent, \`0\` → whole number
- \`-1\` → nearest 10, \`-2\` → nearest 100, \`-3\` → nearest 1,000

\`ROUNDUP\` always rounds away from zero; \`ROUNDDOWN\` toward zero. \`INT\` rounds down to a whole number.

\`\`\`show
| Value | Rounded |
| 1234.567 | |
type B2 =ROUND(A2,2): 2 → to the cent.
type C2 =ROUND(A2,-2): -2 → to the nearest hundred.
type D2 =ROUNDUP(A2,0): ROUNDUP always goes up.
\`\`\`
`,
        sheet: { rows: [["Value", "Result"], [1234.567, null], [1234.567, null], [4567, null], [13.2, null]], cells: { D2: "to 2 decimals", D3: "up to whole", D4: "to nearest 100", D5: "boxes of 12 needed" } },
        steps: [
          task("B2", "Round A2 to 2 decimals in **B2**.", "=ROUND(A2,2)", "1234.567 → 1234.57."),
          task("B3", "Round A3 **up** to a whole number in **B3**.", "=ROUNDUP(A3,0)", "ROUNDUP always goes away from zero: 1235."),
          task("B4", "Round A4 to the nearest hundred in **B4**.", "=ROUND(A4,-2)", "Negative digits round to the left of the decimal point: 4600."),
          task("B5", "A5 is 13.2 dozen items. How many boxes? Round A5 **up** to a whole number in **B5**.", "=ROUNDUP(A5,0)", "You can't buy part of a box: 14."),
        ],
      },
      {
        title: "MROUND, CEILING and FLOOR",
        desc: "Round to a multiple: nearest 5 cents, 15 minutes, pack sizes.",
        learn: `
\`=MROUND(number, multiple)\` rounds to the **nearest** multiple, up or down: \`=MROUND(7.19,0.2)\` → 7.20.

\`CEILING.MATH(number, significance)\` always goes **up** to the multiple; \`FLOOR.MATH\` always goes **down**. They're useful for pricing, billing in time blocks and packing.

If a result looks wrong, add decimals: the underlying value may be 7.1925, not 7.19.

\`\`\`show
| Price | Result |
| 7.31 | |
type B2 =MROUND(A2,0.25): Nearest 0.25: 7.25.
type C2 =CEILING.MATH(A2,0.25): Always up: 7.50.
type D2 =FLOOR.MATH(A2,0.25): Always down: 7.25.
\`\`\`
`,
        sheet: { rows: [["Price", "Nearest 0.05", "Up to 0.25", "Down to 0.25"], [12.34, null, null, null], [7.19, null, null, null]] },
        steps: [
          task("B2", "Round A2 to the nearest 5 cents in **B2**.", "=MROUND(A2,0.05)", "12.34 → 12.35."),
          task("C2", "Round A2 **up** to the next 0.25 in **C2**.", "=CEILING.MATH(A2,0.25)", "12.34 → 12.50."),
          task("D2", "Round A2 **down** to the previous 0.25 in **D2**.", "=FLOOR.MATH(A2,0.25)", "12.34 → 12.25."),
          task("B3", "Round A3 to the nearest 0.05 in **B3**.", "=MROUND(A3,0.05)", "7.19 → 7.20."),
        ],
      },
      {
        title: "Lab: Salary Bonus",
        kind: "lab",
        desc: "Calculate a bonus and a rounded new salary.",
        learn: `
Employees get a 1.2% bonus (rate in **G1**). Calculate each bonus, then the new salary including the bonus, rounded to the nearest 100.
`,
        sheet: {
          rows: [["Employee", "Salary", "Bonus", "New Salary"], ["Ana", 51234, null, null], ["Ben", 48950, null, null], ["Cara", 62410, null, null]],
          cells: { F1: "Bonus rate", G1: 0.012 },
          bold: ["F1"],
          fmt: { B: "currency", C: "currency", D: "currency", G1: "percentage" },
        },
        steps: [
          task("C2", "Ana's bonus in **C2** (lock G1).", "=B2*$G$1", "51,234 × 1.2% = 614.81.", { contains: ["$G$1"], fmt: "currency" }),
          task("D2", "Ana's new salary in **D2**, rounded to the nearest 100 with MROUND.", "=MROUND(B2+C2,100)", "51,848.81 → 51,800.", { fmt: "currency" }),
          task("C3", "Ben's bonus in **C3**.", "=B3*$G$1", "Same locked rate.", { contains: ["$G$1"], fmt: "currency" }),
          task("D3", "Ben's new salary in **D3**, this time with ROUND and -2.", "=ROUND(B3+C3,-2)", "ROUND with -2 also rounds to the nearest hundred: 49,500.", { fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "i8",
    title: "Custom and Conditional Formatting",
    desc: "Format codes, colour-coded variances, and rule-based formatting.",
    difficulty: "intermediate",
    formula: '=TEXT(D2,"▲ 0;▼ 0;0")',
    lessons: [
      {
        title: "Custom Number Formats",
        desc: "The four sections of a format code: positive; negative; zero; text.",
        learn: `
Ctrl + 1 ▸ Number ▸ **Custom**. A code has up to four sections separated by semicolons:

\`\`\`
positive ; negative ; zero ; text
\`\`\`

| Code | Meaning |
| 0 | Digit, always shown (00000 keeps leading zeros) |
| # | Digit, only if needed |
| , | Thousands separator |
| "text" | Literal text |
| [Red] | Colour for that section |

Examples: \`#,##0;(#,##0);"–"\` shows negatives in brackets and zero as a dash. \`"ID-"00000\` turns 42 into ID-00042, and it's still a number underneath.

The \`TEXT\` function accepts the same codes, so you can try them in a formula.
`,
        sheet: { rows: [["Value", "Formatted"], [-1250, null], [0, null], [42, null]] },
        steps: [
          task("B2", 'In **B2**, format A2 with brackets for negatives: `=TEXT(A2,"#,##0;(#,##0);""–""")`.', '=TEXT(A2,"#,##0;(#,##0);""–""")', "−1,250 uses the second section: (1,250). Inside a formula, quotes inside text are doubled."),
          task("B3", "Same format for A3 in **B3**.", '=TEXT(A3,"#,##0;(#,##0);""–""")', "Zero uses the third section: –."),
          task("B4", 'In **B4**, show A4 as an ID: `=TEXT(A4,"""ID-""00000")`.', '=TEXT(A4,"""ID-""00000")', "00000 pads to five digits: ID-00042."),
        ],
      },
      {
        title: "Variance with Arrows",
        desc: "Colour-coded ▲▼ variance using only a format code.",
        learn: `
Variance is \`=Actual-Target\` (A comes before T). Then apply this custom format to the results:

\`\`\`
[Color10]▲ 0;[Red]▼ 0;0
\`\`\`

Positive values show green with an up arrow, negative values red with a down arrow (the minus sign disappears because the negative section doesn't include one), and zero shows plain. The cells are still numbers you can total.

Here you'll use the same code (without colours) in \`TEXT\` to see the result.

\`\`\`show
| Actual | Target | Variance | Display |
| 520 | 500 | | |
type C2 =A2-B2: Variance = Actual − Target.
type D2 =TEXT(C2,"▲ 0;▼ 0;0"): Positive → ▲, negative → ▼.
\`\`\`
`,
        sheet: { rows: [["Product", "Actual", "Target", "Variance", "Display"], ["Kettle", 420, 400, null, null], ["Toaster", 310, 350, null, null], ["Toothbrush", 500, 500, null, null]] },
        steps: [
          task("D2", "Variance for the kettle in **D2**: Actual − Target.", "=B2-C2", "420 − 400 = 20."),
          task("E2", 'In **E2**, display D2 with arrows: `=TEXT(D2,"▲ 0;▼ 0;0")`.', '=TEXT(D2,"▲ 0;▼ 0;0")', "Positive → ▲ 20."),
          task("D3", "Variance for the toaster in **D3**.", "=B3-C3", "310 − 350 = −40."),
          task("E3", "Display D3 with the same arrow code in **E3**.", '=TEXT(D3,"▲ 0;▼ 0;0")', "Negative uses the second section: ▼ 40, no minus sign."),
        ],
      },
      {
        title: "Advanced Conditional Formatting",
        desc: "Data bars, colour scales, icon sets and formula rules.",
        learn: `
- **Data Bars**: an in-cell bar chart. Edit Rule ▸ *Show Bar Only* hides the numbers.
- **Colour Scales**: heat-map colouring.
- **Icon Sets**: arrows and traffic lights. Edit Rule to set thresholds *by Number* instead of Percent.
- **Formula rules**: anything that returns TRUE, for example due dates in the past, or the top value.

**Manage Rules** shows every rule, lets you change the order and the *Applies to* range, and *Stop If True* blocks the rules below.

Test formula rules in a spare column. These ones highlight the best seller and any product below 80% of target:

\`\`\`
=B2=MAX($B$2:$B$5)
=B2<C2*0.8
\`\`\`
`,
        sheet: { rows: [["Product", "Actual", "Target", "Top?", "Under 80%?"], ["Kettle", 420, 400, null, null], ["Toaster", 270, 350, null, null], ["Blender", 515, 450, null, null], ["Fan", 330, 360, null, null]] },
        steps: [
          task("D4", "In **D4**, test whether the blender is the best seller: `=B4=MAX($B$2:$B$5)`.", "=B4=MAX($B$2:$B$5)", "515 is the maximum, so TRUE.", { contains: ["$B$2:$B$5"] }),
          task("E3", "In **E3**, test whether the toaster sold under 80% of its target.", "=B3<C3*0.8", "270 is below 280, so TRUE."),
        ],
      },
      {
        title: "Lab: Retake Results",
        kind: "lab",
        desc: "Differences with ▲▼ display and a pass check.",
        learn: `
Students retook a test. Calculate the change from Test 1 to the Retake, display it with arrows, and check whether they now pass (50+).
`,
        sheet: { rows: [["Student", "Test 1", "Retake", "Change", "Display", "Passed?"], ["Ama", 42, 61, null, null, null], ["Bryn", 38, 35, null, null, null]] },
        steps: [
          task("D2", "Change for Ama in **D2**: Retake − Test 1.", "=C2-B2", "61 − 42 = 19."),
          task("E2", "Display it with arrows in **E2**.", '=TEXT(D2,"▲ 0;▼ 0;0")', "▲ 19."),
          task("D3", "Change for Bryn in **D3**.", "=C3-B3", "35 − 38 = −3."),
          task("E3", "Display Bryn's change in **E3**.", '=TEXT(D3,"▲ 0;▼ 0;0")', "▼ 3."),
          task("F2", 'In **F2**, show "Pass" if the retake is 50 or more, otherwise "Retake again".', '=IF(C2>=50,"Pass","Retake again")', "61 is a pass."),
        ],
      },
      {
        title: "Capstone: Sales Rep Scorecard",
        kind: "capstone",
        desc: "Lookups, conditional totals, ranking, IFS and FILTER together.",
        learn: `
Build a scorecard for the rep typed in **J1**: their region, totals, rank among the reps, a status, and a live list of their deals.

The helper table in L2:M5 lists each rep's total (you'll fill in M2:M5 first).
`,
        sheet: {
          rows: [
            ["Date", "Rep", "Region", "Product", "Units", "Revenue"],
            [d(2026, 1, 4), "Ava", "North", "Laptop", 5, 5250],
            [d(2026, 1, 9), "Ben", "South", "Tablet", 8, 3920],
            [d(2026, 1, 15), "Ava", "North", "Phone", 12, 8280],
            [d(2026, 1, 22), "Cleo", "East", "Laptop", 3, 3150],
            [d(2026, 2, 3), "Dev", "West", "Tablet", 10, 4900],
            [d(2026, 2, 11), "Ben", "South", "Laptop", 4, 4200],
            [d(2026, 2, 19), "Cleo", "East", "Phone", 9, 6210],
            [d(2026, 2, 27), "Ava", "North", "Tablet", 6, 2940],
            [d(2026, 3, 6), "Dev", "West", "Phone", 15, 10350],
            [d(2026, 3, 14), "Ben", "South", "Phone", 7, 4830],
          ],
          cells: { I1: "Rep", J1: "Ava", I2: "Region", I3: "Revenue", I4: "Deals", I5: "Rank", I6: "Status", L1: "Rep", M1: "Total", L2: "Ava", L3: "Ben", L4: "Cleo", L5: "Dev", I8: "Deals" },
          bold: ["I1", "I2", "I3", "I4", "I5", "I6", "L1", "M1", "I8"],
          editable: ["J1"],
          fmt: { A: "date", F: "currency", J3: "currency", M: "currency" },
        },
        steps: [
          task("M2", "Fill the helper table: Ava's total revenue in **M2** with SUMIFS.", "=SUMIFS($F$2:$F$11,$B$2:$B$11,L2)", "16,470.", { fmt: "currency" }),
          task("M3", "Ben's total in **M3**.", "=SUMIFS($F$2:$F$11,$B$2:$B$11,L3)", "12,950.", { fmt: "currency" }),
          task("M4", "Cleo's total in **M4**.", "=SUMIFS($F$2:$F$11,$B$2:$B$11,L4)", "9,360.", { fmt: "currency" }),
          task("M5", "Dev's total in **M5**.", "=SUMIFS($F$2:$F$11,$B$2:$B$11,L5)", "15,250.", { fmt: "currency" }),
          task("J2", "Region of the rep in J1, in **J2**.", "=XLOOKUP(J1,B2:B11,C2:C11)", "North."),
          task("J3", "Total revenue for the rep in **J3**.", "=SUMIFS(F2:F11,B2:B11,J1)", "16,470.", { fmt: "currency" }),
          task("J4", "Number of deals in **J4**.", "=COUNTIFS(B2:B11,J1)", "3 deals."),
          task("J5", "Rank of that total among the helper totals in **J5**.", "=RANK.EQ(J3,M2:M5)", "Ava is 1st."),
          task("J6", 'Status in **J6** with IFS: 15,000+ "Star", 10,000+ "On track", else "Coach".', '=IFS(J3>=15000,"Star",J3>=10000,"On track",TRUE,"Coach")', "Star."),
          task("I9", "In **I9**, spill the rep's deals (Product, Units, Revenue), largest revenue first.", "=SORT(FILTER(D2:F11,B2:B11=J1),3,-1)", "Phone, Laptop, Tablet for Ava. Change J1 to another rep and the whole scorecard updates.", { spill: true }),
        ],
        done: "You've finished the Intermediate level: logic, lookups, filtering, statistics and formatting.",
      },
    ],
  },
];

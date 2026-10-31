import { d, task, type ChapterSpec, type SheetSpec } from "./build";

// ─── Advanced ─────────────────────────────────────────────────────────────────

const medals: SheetSpec["rows"] = [
  ["Athlete", "Country", "Gender", "Medal"],
  ["Lena", "USA", "Female", "Gold"],
  ["Marco", "UK", "Male", "Silver"],
  ["Sara", "Kenya", "Female", "Bronze"],
  ["Tom", "USA", "Male", "Gold"],
  ["Iris", "Japan", "Female", "Gold"],
  ["Raj", "UK", "Male", "Bronze"],
  ["Amy", "USA", "Female", "Silver"],
  ["Joe", "Brazil", "Male", "Gold"],
];

const staff: SheetSpec["rows"] = [
  ["Name", "Dept", "Remote", "Salary"],
  ["Ava", "IT", "Yes", 68000],
  ["Ben", "Sales", "No", 47000],
  ["Cleo", "IT", "No", 72000],
  ["Dev", "Finance", "Yes", 61000],
  ["Eli", "Sales", "Yes", 52000],
  ["Fay", "IT", "Yes", 58000],
];

const travel: SheetSpec["rows"] = [
  ["Company", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  ["Skyway", 120, 135, 150, 128, 142, 160],
  ["Oceanic", 98, 104, 111, 120, 118, 131],
  ["Trailblaze", 143, 151, 139, 160, 172, 168],
  ["Nomad", 87, 92, 101, 99, 110, 121],
];

export const ADVANCED: ChapterSpec[] = [
  {
    id: "a1",
    title: "Dynamic Arrays",
    desc: "One formula, many results: spills, the # operator and UNIQUE in depth.",
    difficulty: "advanced",
    formula: "=UNIQUE(B2:B9)",
    lessons: [
      {
        title: "Spills and Arrays",
        desc: "How one formula fills many cells.",
        learn: `
Excel 365 can return **many results from one formula**. They **spill** into the cells below and to the right. This came with eight dynamic array functions: \`UNIQUE, SORT, SORTBY, FILTER, SEQUENCE, RANDARRAY, XLOOKUP, XMATCH\`. Before this, array formulas needed Ctrl + Shift + Enter.

- Type \`=B2:B6*C2:C6\` in one cell and five results spill down.
- You can only edit the formula in the first cell (the **anchor**); the rest show it greyed out.
- \`D2#\` refers to the whole spill, wherever it ends, so \`=SUM(D2#)\` keeps working as the list grows.
- **#SPILL!** means something is in the way. Clear the blocking cells. Spills can't go inside a Table.

**Array constants**: \`{1,2,3}\` is a row (commas), \`{1;2;3}\` is a column (semicolons).

\`\`\`show
type E2 =B2:B6*2: One formula, five answers. They **spill** down from E2.
type G2 =SUM(E2#): \`E2#\` refers to the whole spill.
\`\`\`
`,
        sheet: { rows: [["Item", "Qty", "Price"], ["Pen", 10, 1.5], ["Pad", 4, 3.2], ["Ink", 2, 12], ["Clip", 50, 0.1], ["Tape", 6, 2.75]], cells: { D1: "Line total" }, bold: ["D1"], fmt: { C: "currency", D: "currency" } },
        steps: [
          task("D2", "In **D2**, multiply the whole Qty column by the whole Price column in one formula: `=B2:B6*C2:C6`.", "=B2:B6*C2:C6", "Five line totals spill into D2:D6 from a single formula.", { spill: true, fns: [] }),
          task("F1", "In **F1**, total the spill using the # operator.", "=SUM(D2#)", "D2# means the whole spilled range, so the total follows the list.", { contains: ["D2#"] }),
        ],
      },
      {
        title: "Extract and Count Unique Entries",
        desc: "UNIQUE instead of Remove Duplicates, and counting distinct values.",
        learn: `
**Data ▸ Remove Duplicates** deletes rows permanently and can't feed other formulas. \`=UNIQUE(B2:B9)\` leaves the source untouched and updates live.

Count unique values with \`=COUNTA(UNIQUE(B2:B9))\`, or \`=ROWS(UNIQUE(B2:B9))\`. If the list already exists in F2, use \`=COUNTA(F2#)\`.

\`\`\`show
| Colour |
| Red |
| Blue |
| Red |
| Green |
type C2 =UNIQUE(A2:A5): Each value once.
type E2 =COUNTA(UNIQUE(A2:A5)): Count them: 3.
\`\`\`
`,
        sheet: { rows: medals },
        steps: [
          task("F2", "In **F2**, list each country once.", "=UNIQUE(B2:B9)", "USA, UK, Kenya, Japan, Brazil, in order of first appearance.", { spill: true }),
          task("H2", "In **H2**, count the distinct countries without using F2.", "=COUNTA(UNIQUE(B2:B9))", "Five countries."),
        ],
      },
      {
        title: "Unique vs Distinct",
        desc: "Values that appear exactly once.",
        learn: `
"Distinct" means every value listed once, and that's what UNIQUE does by default. "Unique" in the strict sense means values that appear **exactly once**. Set UNIQUE's third argument, *exactly_once*, to TRUE:

\`\`\`
=UNIQUE(B2:B9,,TRUE)
\`\`\`

The empty second argument keeps the default (compare rows).

\`\`\`show
| Colour |
| Red |
| Blue |
| Red |
| Green |
type C2 =UNIQUE(A2:A5): Distinct: Red, Blue, Green.
type E2 =UNIQUE(A2:A5,,TRUE): Exactly once: Red repeats, so it's left out.
\`\`\`
`,
        sheet: { rows: medals },
        steps: [
          task("F2", "In **F2**, list the countries that appear **exactly once**.", "=UNIQUE(B2:B9,,TRUE)", "USA and UK repeat, so only Kenya, Japan and Brazil remain.", { spill: true }),
          task("H2", "In **H2**, count how many countries appear exactly once.", "=ROWS(UNIQUE(B2:B9,,TRUE))", "Three: Kenya, Japan and Brazil."),
        ],
      },
      {
        title: "Unique Rows and Unique Columns",
        desc: "Unique combinations, and unique values across a row.",
        learn: `
\`=UNIQUE(B2:C9)\` returns each distinct **combination** of the two columns, like Country + Gender.

For non-adjacent columns, pick them first: \`=UNIQUE(CHOOSECOLS(A2:D9,2,4))\`.

When data runs **across** a row, set the second argument, *by_col*, to TRUE so UNIQUE compares columns:

\`\`\`
=UNIQUE(B1:G1,TRUE)
\`\`\`
`,
        sheet: { rows: medals, cells: { A12: "Q1", B12: "Q2", C12: "Q1", D12: "Q3", E12: "Q2", F12: "Q4" } },
        steps: [
          task("F2", "In **F2**, list each unique Country + Gender combination (B2:C9).", "=UNIQUE(B2:C9)", "Rows are compared as a whole, so USA/Female and USA/Male are different.", { spill: true }),
          task("I2", "In **I2**, list unique Country + Medal pairs using CHOOSECOLS on A2:D9 (columns 2 and 4).", "=UNIQUE(CHOOSECOLS(A2:D9,2,4))", "CHOOSECOLS picks non-adjacent columns first.", { spill: true }),
          task("A14", "In **A14**, return the unique quarters across row 12 (A12:F12).", "=UNIQUE(A12:F12,TRUE)", "by_col = TRUE compares columns: Q1, Q2, Q3, Q4 across.", { spill: true }),
        ],
      },
    ],
  },

  {
    id: "a2",
    title: "SORT, SORTBY and SEQUENCE",
    desc: "Formula-driven ordering, horizontal sorts and generated series.",
    difficulty: "advanced",
    formula: "=SORT(A2:D7,{2,4},{1,-1})",
    lessons: [
      {
        title: "SORT in Depth",
        desc: "Multi-level sorts and sorting only some columns.",
        learn: `
\`\`\`
=SORT(array, [sort_index], [sort_order], [by_col])
\`\`\`

- *sort_index*: which column of the array to sort by (default 1)
- *sort_order*: 1 ascending, -1 descending
- **Several keys**: pass arrays: \`=SORT(A2:D7,{2,4},{1,-1})\` sorts by column 2 A–Z, then column 4 largest first.

To return only some columns, sort a CHOOSECOLS: \`=SORT(CHOOSECOLS(A2:D7,1,4),2,-1)\`.
`,
        sheet: { rows: staff, fmt: { D: "currency" } },
        steps: [
          task("F2", "In **F2**, sort the staff table by Dept A–Z, then Salary highest first.", "=SORT(A2:D7,{2,4},{1,-1})", "Finance first, then IT (Cleo, Ava, Fay by salary), then Sales.", { spill: true }),
          task("K2", "In **K2**, return just Name and Salary, highest salary first.", "=SORT(CHOOSECOLS(A2:D7,1,4),2,-1)", "Cleo tops the list at 72,000.", { spill: true }),
        ],
      },
      {
        title: "Horizontal Sorting",
        desc: "Sort columns left to right with by_col.",
        learn: `
When data is laid out **across columns**, set the 4th argument of SORT to TRUE. The sort_index now picks a **row**:

\`\`\`
=SORT(B1:G2,2,-1,TRUE)
\`\`\`

SORTBY sorts horizontally on its own when its *by_array* is a row: \`=SORTBY(B1:G2,B2:G2,-1)\`.
`,
        sheet: { rows: [["Product", "Kettle", "Toaster", "Blender", "Fan", "Lamp", "Iron"], ["Sales", 420, 310, 515, 190, 275, 360]] },
        steps: [
          task("B4", "In **B4**, sort the products (B1:G2) by their sales in row 2, highest first, across columns.", "=SORT(B1:G2,2,-1,TRUE)", "Blender, Kettle, Iron, Toaster, Lamp, Fan.", { spill: true }),
          task("B7", "Same result in **B7** with SORTBY using the sales row as the key.", "=SORTBY(B1:G2,B2:G2,-1)", "A row-shaped by_array tells SORTBY to sort columns.", { spill: true }),
        ],
      },
      {
        title: "The SORTBY Function",
        desc: "Sort by ranges, including ones you don't return.",
        learn: `
\`\`\`
=SORTBY(array, by_array1, order1, [by_array2, order2], …)
\`\`\`

\`=SORTBY(A2:A7, D2:D7, -1)\` returns the names sorted by salary without showing the salary.

You can sort by a calculation: \`=SORTBY(A2:A7, C2:C7-B2:B7, -1)\` sorts by variance.
`,
        sheet: { rows: [["Rep", "Target", "Actual"], ["Ava", 45000, 48000], ["Ben", 45000, 39000], ["Cleo", 45000, 51500], ["Dev", 50000, 45000], ["Eli", 50000, 52500]], fmt: { B: "currency", C: "currency" } },
        steps: [
          task("E2", "In **E2**, list the reps sorted by Actual, highest first.", "=SORTBY(A2:A6,C2:C6,-1)", "Eli, Cleo, Ava, Dev, Ben.", { spill: true }),
          task("G2", "In **G2**, list the reps sorted by **variance** (Actual − Target), best first.", "=SORTBY(A2:A6,C2:C6-B2:B6,-1)", "Cleo is 6,500 over target, so she's first even though Eli sold more.", { spill: true }),
        ],
      },
      {
        title: "The SEQUENCE Function",
        desc: "Generate number series, dates and grids.",
        learn: `
\`\`\`
=SEQUENCE(rows, [columns], [start], [step])
\`\`\`

- \`=SEQUENCE(10)\` spills 1 to 10.
- \`=SEQUENCE(3,4,100,10)\` is a 3×4 grid starting at 100 in steps of 10 (filling across, then down).
- Dates: \`=SEQUENCE(7,1,DATE(2026,11,2))\` gives seven consecutive days (format them as dates).
- Row numbers that follow a list: \`=SEQUENCE(ROWS(F2#))\`.

\`\`\`show
| Numbers |
type A2 =SEQUENCE(5): \`SEQUENCE(5)\` spills 1 to 5.
type C2 =SEQUENCE(3,3,10,10): 3 rows × 3 columns, starting at 10, in steps of 10.
\`\`\`
`,
        sheet: { rows: [["Task", "Days"], ["Plan", 2], ["Build", 5], ["Test", 3]] },
        steps: [
          task("D1", "In **D1**, spill the numbers 1 to 10 down the column.", "=SEQUENCE(10)", "One formula, ten rows.", { spill: true }),
          task("F1", "In **F1**, make a 3-row × 4-column grid starting at 100 in steps of 10.", "=SEQUENCE(3,4,100,10)", "It fills across first: 100, 110, 120, 130 on the first row.", { spill: true }),
          task("F5", "In **F5**, total the numbers 1 to 100 with SUM and SEQUENCE.", "=SUM(SEQUENCE(100))", "5,050, the classic Gauss sum."),
          task("F7", "In **F7**, generate 7 dates starting 2 Nov 2026 with SEQUENCE and DATE.", "=SEQUENCE(7,1,DATE(2026,11,2))", "Dates are numbers, so SEQUENCE counts days: 11/2/2026 to 11/8/2026.", { spill: true, fmt: "date" }),
        ],
      },
    ],
  },

  {
    id: "a3",
    title: "FILTER with Logic",
    desc: "Boolean maths inside FILTER: OR, AND, both-or-neither, and one-but-not-both.",
    difficulty: "advanced",
    formula: '=FILTER(A2:D9,(B2:B9="USA")*(D2:D9="Gold"))',
    lessons: [
      {
        title: "FILTER in Depth",
        desc: "Include arrays, if_empty and returning chosen columns.",
        learn: `
\`\`\`
=FILTER(array, include, [if_empty])
\`\`\`

*include* must be a TRUE/FALSE (or 1/0) array the same height as *array*. Rows with TRUE come back.

With no matches FILTER returns **#CALC!**, so always give *if_empty*. To return only some columns, filter a narrower range of the same height, or wrap the result in CHOOSECOLS.
`,
        sheet: { rows: medals },
        steps: [
          task("F2", 'In **F2**, return the athletes (A2:A9 only) who won Gold, with "None" if empty.', '=FILTER(A2:A9,D2:D9="Gold","None")', "Lena, Tom, Iris and Joe.", { spill: true }),
          task("H2", 'In **H2**, filter A2:D9 for Country "France" with an if_empty of "No athletes".', '=FILTER(A2:D9,B2:B9="France","No athletes")', "Nobody is from France, so the message shows instead of #CALC!."),
        ],
      },
      {
        title: "OR Logic with +",
        desc: "Add conditions: keep a row if any are TRUE.",
        learn: `
TRUE behaves as 1 and FALSE as 0. **Adding** conditions gives 0 only when all are FALSE, so any row with at least one TRUE is kept:

\`\`\`
=FILTER(A2:D9,(B2:B9="USA")+(B2:B9="Kenya"))
\`\`\`

Put each condition in its own brackets. Excel's \`OR()\` function doesn't work here because it returns a single TRUE or FALSE for the whole range, not one per row.

\`\`\`show
| Name | Country |
| Lena | USA |
| Sara | Kenya |
| Raj | UK |
type D2 =(B2:B4="USA")+(B2:B4="Kenya"): Each test gives 1 or 0 per row. Added together, a row scores 1 if either is true.
type F2 =FILTER(A2:A4,(B2:B4="USA")+(B2:B4="Kenya")): FILTER keeps every row that isn't 0.
\`\`\`
`,
        sheet: { rows: medals },
        steps: [
          task("F2", "In **F2**, return athletes from the USA **or** Kenya (whole rows).", '=FILTER(A2:D9,(B2:B9="USA")+(B2:B9="Kenya"))', "Lena, Sara, Tom and Amy.", { spill: true }),
          task("F8", "In **F8**, return names (A2:A9) of athletes who won Gold **or** Silver.", '=FILTER(A2:A9,(D2:D9="Gold")+(D2:D9="Silver"))', "Everyone except the Bronze medallists Sara and Raj.", { spill: true }),
        ],
      },
      {
        title: "AND Logic with *",
        desc: "Multiply conditions: keep a row only if all are TRUE.",
        learn: `
Multiplying gives 1 only when every factor is 1:

\`\`\`
=FILTER(A2:D9,(B2:B9="USA")*(D2:D9="Gold"))
\`\`\`

Mix the two: USA **and** (Gold **or** Silver):

\`\`\`show
| Name | Country | Medal |
| Lena | USA | Gold |
| Tom | USA | Bronze |
| Iris | Japan | Gold |
type E2 =(B2:B4="USA")*(C2:C4="Gold"): Multiply: 1 only when both are true.
type G2 =FILTER(A2:A4,(B2:B4="USA")*(C2:C4="Gold")): So FILTER keeps just Lena.
\`\`\`

\`\`\`
(B2:B9="USA")*((D2:D9="Gold")+(D2:D9="Silver"))
\`\`\`
`,
        sheet: { rows: medals },
        steps: [
          task("F2", "In **F2**, return names of USA athletes who won **Gold**.", '=FILTER(A2:A9,(B2:B9="USA")*(D2:D9="Gold"))', "Lena and Tom.", { spill: true }),
          task("H2", "In **H2**, return names of female athletes who won Gold **or** Silver.", '=FILTER(A2:A9,(C2:C9="Female")*((D2:D9="Gold")+(D2:D9="Silver")))', "Lena, Iris and Amy.", { spill: true }),
          task("J2", "In **J2**, sort the USA Gold names from F2's formula A–Z by wrapping it in SORT.", '=SORT(FILTER(A2:A9,(B2:B9="USA")*(D2:D9="Gold")))', "Lena, Tom (already alphabetical, but now guaranteed).", { spill: true }),
        ],
      },
      {
        title: "Both or Neither, and One but Not Both",
        desc: "Compare conditions with = and subtract them for XOR.",
        learn: `
**= (both or neither)**: \`(cond1)=(cond2)\` is TRUE when the two conditions agree, both TRUE or both FALSE.

\`\`\`
=FILTER(A2:D7,(B2:B7="IT")=(C2:C7="Yes"))
\`\`\`

returns IT staff who work remotely **and** non-IT staff who don't.

**− (one but not both)**: \`(cond1)-(cond2)\` is 1 or −1 when exactly one is TRUE, and 0 when both or neither. FILTER keeps any non-zero value, which gives exclusive OR (XOR).
`,
        sheet: { rows: staff, fmt: { D: "currency" } },
        steps: [
          task("F2", "In **F2**, return names where (Dept = IT) **matches** (Remote = Yes).", '=FILTER(A2:A7,(B2:B7="IT")=(C2:C7="Yes"))', "Ava and Fay (IT, remote) plus Ben (not IT, not remote).", { spill: true }),
          task("H2", "In **H2**, return names that are IT **or** remote, but **not both**.", '=FILTER(A2:A7,(B2:B7="IT")-(C2:C7="Yes"))', "Cleo (IT, office), Dev and Eli (remote, not IT).", { spill: true }),
        ],
      },
      {
        title: "RANDARRAY and RANDBETWEEN",
        desc: "Random numbers for test data, samples and shuffling.",
        learn: `
\`=RANDBETWEEN(1,100)\` returns one random whole number. \`=RANDARRAY(rows, cols, min, max, whole_number)\` spills a block of them.

Both are **volatile**: they recalculate on every change. To keep the values, copy them and Paste Special ▸ Values.

Shuffle a list: \`=SORTBY(A2:A9,RANDARRAY(ROWS(A2:A9)))\`.
`,
        sheet: { rows: medals },
        steps: [
          task("F2", "In **F2**, spill 5 random whole numbers between 1 and 100 with RANDARRAY.", "=RANDARRAY(5,1,1,100,TRUE)", "Different numbers every time the sheet recalculates.", { random: true }),
          task("H2", "In **H2**, shuffle the athlete names with SORTBY and RANDARRAY.", "=SORTBY(A2:A9,RANDARRAY(8))", "Sorting by random numbers is a fair shuffle.", { random: true }),
        ],
      },
    ],
  },

  {
    id: "a4",
    title: "Advanced Lookups",
    desc: "Two-way, multi-criteria and duplicate-aware lookups.",
    difficulty: "advanced",
    formula: "=XLOOKUP(H1,A2:A5,XLOOKUP(H2,B1:G1,B2:G5))",
    lessons: [
      {
        title: "Two-Way Lookups with XLOOKUP",
        desc: "Nest XLOOKUP for row × column, and use it for bands.",
        learn: `
**Two-way.** The inner XLOOKUP returns a whole column; the outer one searches it:

\`\`\`
=XLOOKUP(H1, A2:A5, XLOOKUP(H2, B1:G1, B2:G5))
\`\`\`

**Bands without sorting.** match_mode -1 means exact match or the next smaller value:

\`\`\`show
| Shop | Jan | Feb |
| North | 120 | 135 |
| South | 98 | 104 |
type E2 =XLOOKUP("Feb",B1:C1,B2:C3): The inner lookup returns the whole Feb column…
type G2 =XLOOKUP("South",A2:A3,XLOOKUP("Feb",B1:C1,B2:C3)): …the outer one finds South in it: 104.
\`\`\`

\`\`\`
=XLOOKUP(B2, Tiers, Rates, , -1)
\`\`\`
`,
        sheet: {
          rows: travel,
          cells: { I1: "Company", J1: "Nomad", I2: "Month", J2: "Apr", I4: "Revenue", I6: "Sales", J6: 137, I7: "Tier", L1: "Min", M1: "Commission", L2: 0, M2: 0.02, L3: 100, M3: 0.035, L4: 150, M4: 0.05 },
          bold: ["I1", "I2", "I4", "I6", "I7", "L1", "M1"],
          editable: ["J1", "J2", "J6"],
          fmt: { M: "percentage", J7: "percentage" },
        },
        steps: [
          task("J4", "In **J4**, return revenue for the company in J1 and month in J2 with nested XLOOKUPs.", "=XLOOKUP(J1,A2:A5,XLOOKUP(J2,B1:G1,B2:G5))", "The inner lookup returns the April column; the outer finds Nomad in it: 99."),
          task("J7", "In **J7**, find the commission rate for the sales in J6 using XLOOKUP with match_mode -1.", "=XLOOKUP(J6,L2:L4,M2:M4,,-1)", "137 isn't in the table, so it takes the next smaller tier, 100: 3.5%.", { fmt: "percentage" }),
        ],
      },
      {
        title: "The XMATCH Function",
        desc: "Positions with search modes and wildcards.",
        learn: `
\`=XMATCH(lookup, array, [match_mode], [search_mode])\` returns a position and defaults to exact match.

- match_mode: 0 exact, -1 / 1 next smaller / larger, 2 wildcard (\`*\` any text, \`?\` one character)
- search_mode: 1 first to last, -1 last to first

A common pairing for two-way lookups:

\`\`\`
=INDEX(B2:G5, XMATCH(J1,A2:A5), XMATCH(J2,B1:G1))
\`\`\`
`,
        sheet: { rows: travel, cells: { I1: "Company", J1: "Trailblaze", I2: "Month", J2: "May", I4: "INDEX/XMATCH", I5: "Wildcard", I6: "Last 150 (Skyway)" }, bold: ["I1", "I2", "I4", "I5", "I6"], editable: ["J1", "J2"] },
        steps: [
          task("J4", "Two-way lookup with INDEX and two XMATCHes in **J4**.", "=INDEX(B2:G5,XMATCH(J1,A2:A5),XMATCH(J2,B1:G1))", "Trailblaze in May: 172."),
          task("J5", 'In **J5**, find the position of the first company starting with "O" using a wildcard.', '=XMATCH("O*",A2:A5,2)', "match_mode 2 enables wildcards: Oceanic is 2nd."),
          task("J6", "In **J6**, find the position of the **last** month in Skyway's row (B2:G2) equal to 150, searching last to first.", "=XMATCH(150,B2:G2,0,-1)", "Position 3 (March). With search_mode -1 XMATCH reads from the end, so if 150 appeared twice it would return the later month."),
        ],
      },
      {
        title: "Lookups with Multiple Criteria",
        desc: "Return a value where several columns must match.",
        learn: `
Three patterns:

1. **Boolean**: \`=XLOOKUP(1,(A2:A9=H1)*(B2:B9=H2),C2:C9,"Not found")\`
2. **Joined keys**: \`=XLOOKUP(H1&H2,A2:A9&B2:B9,C2:C9)\`
3. **FILTER**: \`=FILTER(C2:C9,(A2:A9=H1)*(B2:B9=H2))\` returns **all** matches.
`,
        sheet: {
          rows: [["Agent", "Quarter", "Sales"], ["Bradley Witt", "Q1", 18200], ["Tom Bruce", "Q1", 22100], ["Bradley Witt", "Q2", 19800], ["Tom Bruce", "Q2", 20400], ["Bradley Witt", "Q3", 24500], ["Tom Bruce", "Q3", 17900]],
          cells: { E1: "Agent", F1: "Tom Bruce", E2: "Quarter", F2: "Q2", E4: "Boolean", E5: "Joined keys" },
          bold: ["E1", "E2", "E4", "E5"],
          editable: ["F1", "F2"],
          fmt: { C: "currency", F4: "currency", F5: "currency" },
        },
        steps: [
          task("F4", "In **F4**, return sales for the agent and quarter in F1:F2 with the boolean method.", '=XLOOKUP(1,(A2:A7=F1)*(B2:B7=F2),C2:C7,"Not found")', "Tom Bruce in Q2: 20,400.", { fmt: "currency" }),
          task("F5", "Same answer in **F5** with joined keys.", "=XLOOKUP(F1&F2,A2:A7&B2:B7,C2:C7)", "Joining makes each agent–quarter pair unique.", { fmt: "currency" }),
          task("F7", "In **F7**, use FILTER to return **every** sales figure for the agent in F1.", "=FILTER(C2:C7,A2:A7=F1)", "Three quarters of figures spill down.", { spill: true }),
        ],
      },
      {
        title: "Lookups with Duplicate Values",
        desc: "Return the last, all, or the nth match.",
        learn: `
- **Last**: \`=XLOOKUP(H1,A2:A9,C2:C9,,0,-1)\`
- **All, spilled**: \`=FILTER(C2:C9,A2:A9=H1)\`
- **All, in one cell**: \`=TEXTJOIN(", ",TRUE,FILTER(C2:C9,A2:A9=H1))\`
- **nth**: \`=INDEX(FILTER(C2:C9,A2:A9=H1),2)\`
`,
        sheet: {
          rows: [["Customer", "Date", "Order"], ["Contoso", d(2026, 1, 4), "SO-118"], ["Litware", d(2026, 1, 9), "SO-121"], ["Contoso", d(2026, 2, 2), "SO-140"], ["Fabrikam", d(2026, 2, 15), "SO-152"], ["Contoso", d(2026, 3, 1), "SO-171"]],
          cells: { E1: "Customer", F1: "Contoso", E3: "First order", E4: "Last order", E5: "All orders", E6: "2nd order" },
          bold: ["E1", "E3", "E4", "E5", "E6"],
          editable: ["F1"],
          fmt: { B: "date" },
        },
        steps: [
          task("F3", "First order for the customer in F1, in **F3**.", "=XLOOKUP(F1,A2:A6,C2:C6)", "SO-118."),
          task("F4", "Last order in **F4** (search last to first).", "=XLOOKUP(F1,A2:A6,C2:C6,,0,-1)", "SO-171."),
          task("F5", "All orders in one cell in **F5**, separated by \", \".", '=TEXTJOIN(", ",TRUE,FILTER(C2:C6,A2:A6=F1))', "SO-118, SO-140, SO-171."),
          task("F6", "The 2nd order in **F6** with INDEX and FILTER.", "=INDEX(FILTER(C2:C6,A2:A6=F1),2)", "SO-140."),
        ],
      },
      {
        title: "Lab: Agent × Quarter Report",
        kind: "lab",
        desc: "Unique lists, a two-criteria lookup and a filtered view.",
        learn: `
Agent names repeat across quarters, so a lookup on the name alone would return the wrong quarter. Build the unique lists, then a two-criteria lookup and a sorted view.
`,
        sheet: {
          rows: [["Agent", "Quarter", "Sales"], ["Bradley Witt", "Q1", 18200], ["Tom Bruce", "Q1", 22100], ["Ana Diaz", "Q1", 15900], ["Bradley Witt", "Q2", 19800], ["Tom Bruce", "Q2", 20400], ["Ana Diaz", "Q2", 23300]],
          cells: { E1: "Agent", F1: "Ana Diaz", E2: "Quarter", F2: "Q2", E3: "Sales", H1: "Agents", I1: "Quarters", E6: "Q2 sorted" },
          bold: ["E1", "E2", "E3", "H1", "I1", "E6"],
          editable: ["F1", "F2"],
          fmt: { C: "currency", F3: "currency" },
        },
        steps: [
          task("H2", "Sorted unique list of agents in **H2**.", "=SORT(UNIQUE(A2:A7))", "Ana Diaz, Bradley Witt, Tom Bruce.", { spill: true }),
          task("I2", "Unique quarters in **I2**.", "=UNIQUE(B2:B7)", "Q1, Q2. These lists would feed the drop-downs in F1 and F2.", { spill: true }),
          task("F3", "Sales for the agent and quarter in F1:F2, in **F3**.", "=XLOOKUP(1,(A2:A7=F1)*(B2:B7=F2),C2:C7)", "Ana Diaz in Q2: 23,300.", { fmt: "currency" }),
          task("E7", "In **E7**, spill Agent and Sales for the quarter in F2, sorted by sales highest first.", "=SORT(FILTER(CHOOSECOLS(A2:C7,1,3),B2:B7=F2),2,-1)", "Ana Diaz, Tom Bruce, Bradley Witt.", { spill: true }),
        ],
      },
    ],
  },

  {
    id: "a5",
    title: "LET and LAMBDA",
    desc: "Name the parts of a formula, then turn it into your own function.",
    difficulty: "advanced",
    formula: "=LET(t,SUM(B2:B13),t*IF(t>1E5,5%,2%))",
    lessons: [
      {
        title: "The LET Function",
        desc: "Variables inside a formula: readable, and calculated once.",
        learn: `
\`\`\`
=LET(name1, value1, [name2, value2, …], calculation)
\`\`\`

Each name gets a value, later names can use earlier ones, and the last argument is the result.

Before:

\`\`\`
=IF(SUM(B2:B7)>200000,SUM(B2:B7)*5%,SUM(B2:B7)*2%)
\`\`\`

After:

\`\`\`
=LET(total,SUM(B2:B7), rate,IF(total>200000,5%,2%), total*rate)
\`\`\`

SUM runs once instead of three times, the logic reads in steps, and there's one place to change it.

\`\`\`show
| Price | Qty |
| 12 | 4 |
type C2 =LET(total,A2*B2,total*1.2): Name a value (\`total\`), then use it. Here: 48 plus 20% tax.
\`\`\`
`,
        sheet: { rows: [["Month", "Sales"], ["Jan", 41000], ["Feb", 38500], ["Mar", 45200], ["Apr", 39900], ["May", 47300], ["Jun", 44100]], cells: { D1: "Bonus pool", D2: "Above-average months" }, bold: ["D1", "D2"], fmt: { B: "currency", E1: "currency" } },
        steps: [
          task("E1", "In **E1**, use LET: total = SUM(B2:B7), rate = 5% if total > 200,000 else 2%, result total*rate.", "=LET(total,SUM(B2:B7),rate,IF(total>200000,5%,2%),total*rate)", "Total is 256,000, so the rate is 5%: 12,800.", { fmt: "currency" }),
          task("E2", "In **E2**, use LET to name the average, then count months above it with COUNTIF.", '=LET(avg,AVERAGE(B2:B7),COUNTIF(B2:B7,">"&avg))', "Average is about 42,667; three months beat it."),
        ],
      },
      {
        title: "Create Your Own Functions with LAMBDA",
        desc: "Write a reusable function and call it by name.",
        learn: `
\`=LAMBDA(x, y, calculation)\` defines a function. Test it in a cell by adding the arguments in brackets straight after:

\`\`\`
=LAMBDA(price,rate,price*(1+rate))(B2,0.2)
\`\`\`

Then save it: **Formulas ▸ Name Manager ▸ New**, name it \`ADDTAX\` and paste the LAMBDA (without the test brackets) into *Refers to*. Now \`=ADDTAX(B2,0.2)\` works anywhere in the workbook.

In this sheet a function called **MARGIN** has already been defined as \`=LAMBDA(rev,cost,(rev-cost)/rev)\`.

Helper functions take LAMBDAs as arguments: \`BYROW\`, \`BYCOL\`, \`MAP\`, \`REDUCE\`.
`,
        sheet: {
          rows: [["Product", "Price", "Cost", "With tax", "Margin"], ["Desk", 240, 150, null, null], ["Chair", 95, 52, null, null]],
          fmt: { B: "currency", C: "currency", D: "currency", E: "percentage" },
          names: { MARGIN: "=LAMBDA(rev,cost,(rev-cost)/rev)" },
        },
        steps: [
          task("D2", "In **D2**, test a LAMBDA in place: `=LAMBDA(price,rate,price*(1+rate))(B2,0.2)`.", "=LAMBDA(price,rate,price*(1+rate))(B2,0.2)", "The brackets after the LAMBDA call it immediately: 240 × 1.2 = 288.", { fmt: "currency" }),
          task("E2", "In **E2**, use the saved function: `=MARGIN(B2,C2)`.", "=MARGIN(B2,C2)", "(240 − 150) / 240 = 37.5%.", { fmt: "percentage", fns: ["MARGIN"] }),
          task("E3", "Margin for the chair in **E3**.", "=MARGIN(B3,C3)", "Your own function works like any built-in one.", { fmt: "percentage", fns: ["MARGIN"] }),
          task("G2", "In **G2**, use BYROW to return the larger of Price and Cost for each row: `=BYROW(B2:C3,LAMBDA(r,MAX(r)))`.", "=BYROW(B2:C3,LAMBDA(r,MAX(r)))", "BYROW hands each row to the LAMBDA and spills one result per row.", { spill: true }),
        ],
      },
      {
        title: "Lab: Build TEXTMID",
        kind: "lab",
        desc: "Extract the middle of a code, then reuse it as a function.",
        learn: `
Invoice numbers hold the client between dashes, like \`INV-Gramazon-2291\`. Extract it with text functions, then try the saved function **TEXTMID**, defined as:

\`\`\`
=LAMBDA(text,delim,TEXTBEFORE(TEXTAFTER(text,delim),delim))
\`\`\`

\`TEXTAFTER(text,"-")\` returns everything after the first dash; \`TEXTBEFORE(…,"-")\` keeps what's before the next one.
`,
        sheet: {
          rows: [["Invoice", "Client"], ["INV-Gramazon-2291", null], ["INV-Samsing-3047", null], [null, null], ["Part number", "Code"], ["2290/PKR/88", null], ["1105/ELE/12", null]],
          bold: ["A5", "B5"],
          names: { TEXTMID: "=LAMBDA(text,delim,TEXTBEFORE(TEXTAFTER(text,delim),delim))" },
        },
        steps: [
          task("B2", 'In **B2**, extract the client with `=TEXTBEFORE(TEXTAFTER(A2,"-"),"-")`.', '=TEXTBEFORE(TEXTAFTER(A2,"-"),"-")', "Gramazon."),
          task("B3", 'In **B3**, do the same with an in-place LAMBDA: `=LAMBDA(t,d,TEXTBEFORE(TEXTAFTER(t,d),d))(A3,"-")`.', '=LAMBDA(t,d,TEXTBEFORE(TEXTAFTER(t,d),d))(A3,"-")', "Samsing. Saved in Name Manager, this becomes TEXTMID."),
          task("B6", 'Use the saved **TEXTMID** on the part number in **B6**, with "/" as the delimiter.', '=TEXTMID(A6,"/")', "PKR. Same function, different delimiter.", { fns: ["TEXTMID"] }),
          task("B7", "Part code for A7 in **B7**.", '=TEXTMID(A7,"/")', "ELE.", { fns: ["TEXTMID"] }),
        ],
      },
    ],
  },

  {
    id: "a6",
    title: "Power Pivot and the Data Model",
    desc: "Relate several tables and summarise them as one.",
    difficulty: "advanced",
    formula: "=AVERAGEIFS(D2:D7,E2:E7,H2)",
    lessons: [
      {
        title: "Relationships and RELATED",
        desc: "Link a fact table to lookup tables, and fetch across the link.",
        learn: `
In the Power Pivot window ▸ **Diagram View**, drag a key from the **many** side (\`tblSales[ProductID]\`) onto the matching key on the **one** side (\`tblProducts[ProductID]\`). A line marked 1 and * appears.

- **Fact** tables hold transactions (many rows per product).
- **Dimension** (lookup) tables hold one row per product, region or employee. Their keys must be unique.

A **calculated column** in Power Pivot can fetch a value across the relationship with DAX: \`=RELATED(tblProducts[Category])\`. That's what XLOOKUP does on a worksheet, so practise the idea here with XLOOKUP.
`,
        sheet: {
          rows: [["OrderID", "ProductID", "Units", "Category"], [5001, "P2", 3, null], [5002, "P1", 5, null], [5003, "P3", 2, null]],
          cells: { F1: "ProductID", G1: "Product", H1: "Category", F2: "P1", G2: "Laptop", H2: "Computers", F3: "P2", G3: "Mouse", H3: "Accessories", F4: "P3", G4: "Monitor", H4: "Displays" },
          bold: ["F1", "G1", "H1"],
        },
        steps: [
          task("D2", "In **D2**, fetch the category for order 5001's product from the lookup table (like RELATED).", "=XLOOKUP(B2,$F$2:$F$4,$H$2:$H$4)", "P2 → Accessories. In Power Pivot, =RELATED(tblProducts[Category]) does this through the relationship."),
          task("D3", "Category for order 5002 in **D3**.", "=XLOOKUP(B3,$F$2:$F$4,$H$2:$H$4)", "P1 → Computers."),
        ],
      },
      {
        title: "PivotTables from Multiple Tables",
        desc: "One PivotTable, fields from several related tables.",
        learn: `
**Power Pivot ▸ PivotTable** (or Insert ▸ PivotTable ▸ *From Data Model*). The field list shows **All** tables. Put Department in Rows and Salary in Values, set to Average, and the relationship connects them.

Data Model PivotTables also offer **Distinct Count**, and **measures** written in DAX:

\`\`\`
Total Sales := SUM(tblSales[Revenue])
\`\`\`

The worksheet version of "average salary by department" is \`AVERAGEIFS\`.
`,
        sheet: {
          rows: [["Emp", "Name", "DeptID", "Salary", "Department"], ["E1", "Ava", "D1", 68000, null], ["E2", "Ben", "D2", 47000, null], ["E3", "Cleo", "D1", 72000, null], ["E4", "Dev", "D3", 61000, null], ["E5", "Eli", "D2", 52000, null], ["E6", "Fay", "D1", 58000, null]],
          cells: { G1: "DeptID", H1: "Department", I1: "Avg salary", G2: "D1", H2: "IT", G3: "D2", H3: "Sales", G4: "D3", H4: "Finance" },
          bold: ["G1", "H1", "I1"],
          fmt: { D: "currency", I: "currency" },
        },
        steps: [
          task("E2", "Bring the department name into **E2** from the department table.", "=XLOOKUP(C2,$G$2:$G$4,$H$2:$H$4)", "D1 → IT. This is the relationship at work."),
          task("I2", "Average salary for department D1 in **I2** with AVERAGEIFS.", "=AVERAGEIFS($D$2:$D$7,$C$2:$C$7,G2)", "(68,000 + 72,000 + 58,000) / 3 = 66,000.", { fmt: "currency" }),
          task("I3", "Average salary for D2 in **I3**.", "=AVERAGEIFS($D$2:$D$7,$C$2:$C$7,G3)", "49,500.", { fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "a7",
    title: "Power Query",
    desc: "Import, clean, combine and refresh data without redoing the work.",
    difficulty: "advanced",
    formula: "=VSTACK(A2:C4,E2:G4)",
    lessons: [
      {
        title: "Import and Clean with Power Query",
        desc: "Get Data, Applied Steps and the common cleaning fixes.",
        learn: `
**Data ▸ Get Data** connects to Excel files, CSV, folders, the web and databases. Choose **Transform Data** to open the Power Query Editor. Every step you take is recorded in **Applied Steps**, and **Refresh** repeats them all on new data.

| Problem | Power Query fix |
| Extra spaces | Transform ▸ Format ▸ Trim |
| Names in CAPS | Format ▸ Capitalize Each Word |
| "City, Country" in one column | Split Column ▸ By Delimiter |
| Dates stored as text | Change Type ▸ Date |
| Months across 12 columns | Unpivot Other Columns |
| Duplicates / blank rows | Remove Rows |

On a worksheet, the same fixes are formulas: \`TRIM\`, \`PROPER\`, \`TEXTBEFORE\`, \`TEXTAFTER\`.
`,
        sheet: { rows: [["Raw name", "Clean name", "Location", "City", "Country"], ["  maria   LOPEZ ", null, "Lyon, France", null, null], ["JAMES o'neil", null, "Cork, Ireland", null, null]] },
        steps: [
          task("B2", "In **B2**, clean the name: trim the spaces and capitalise each word.", "=PROPER(TRIM(A2))", "Maria Lopez. Power Query's Trim + Capitalize Each Word do the same."),
          task("B3", "Clean the second name in **B3**.", "=PROPER(TRIM(A3))", "James O'Neil."),
          task("D2", 'In **D2**, split out the city: text before ", ".', '=TEXTBEFORE(C2,", ")', "Lyon. Split Column by Delimiter does this in Power Query."),
          task("E2", 'In **E2**, the country: text after ", ".', '=TEXTAFTER(C2,", ")', "France."),
        ],
      },
      {
        title: "Combine Files from a Folder",
        desc: "Append matching files into one table, and refresh when new ones arrive.",
        learn: `
1. Data ▸ Get Data ▸ From File ▸ **From Folder**, then pick the folder.
2. **Combine & Transform Data**, pick the sample table ▸ OK.
3. Power Query appends every file and adds a \`Source.Name\` column with the file name. Remove it if you don't need it.
4. Check the data types ▸ Close & Load.

Every file must have the **same structure**: same columns, same headers. Drop a new file into the folder and click **Data ▸ Refresh All**: it's included automatically.

On a worksheet, \`VSTACK\` appends tables the same way:

\`\`\`show
| 2023 | Amount | | 2024 | Amount |
| INV-1 | 100 | | INV-3 | 300 |
| INV-2 | 200 | | INV-4 | 400 |
type G2 =VSTACK(A2:B3,D2:E3): Two tables stacked into one, like Power Query's Append.
\`\`\`

\`\`\`
=VSTACK(A2:C4, E2:G4)
\`\`\`
`,
        sheet: {
          rows: [["Invoices 2023", null, null, null, "Invoices 2024", null, null], ["INV-301", "Contoso", 1200, null, "INV-401", "Litware", 950], ["INV-302", "Fabrikam", 860, null, "INV-402", "Contoso", 1430], ["INV-303", "Litware", 2210, null, "INV-403", "Northwind", 640]],
          cells: { I1: "Combined", M1: "Grand total" },
          bold: ["I1", "M1"],
          fmt: { C: "currency", G: "currency", N1: "currency" },
        },
        steps: [
          task("I2", "In **I2**, append the 2024 invoices under the 2023 ones with VSTACK.", "=VSTACK(A2:C4,E2:G4)", "Six rows, one table, like Combine Files from a Folder.", { spill: true }),
          task("N1", "In **N1**, total the Amount column of the combined table (the 3rd column of I2#).", "=SUM(CHOOSECOLS(I2#,3))", "7,290. Add another year's block to the VSTACK and this updates.", { fmt: "currency" }),
        ],
      },
      {
        title: "Capstone: Automated Sales Report",
        kind: "capstone",
        desc: "Combine, relate, summarise and rank with one set of live formulas.",
        learn: `
Three monthly sales blocks need combining into one table, then enriching from the rep table, summarising by region and ranking.

You'll use VSTACK, XLOOKUP, SUMIFS, LET, SORTBY, TAKE and UNIQUE: the worksheet equivalents of Power Query, the Data Model and a PivotTable.
`,
        sheet: {
          rows: [
            ["Jan RepID", "Revenue", null, "Feb RepID", "Revenue", null, "Mar RepID", "Revenue"],
            ["R1", 5200, null, "R2", 4100, null, "R1", 6300],
            ["R2", 3900, null, "R3", 5600, null, "R4", 7100],
            ["R3", 4400, null, "R4", 2800, null, "R2", 3100],
          ],
          cells: { J1: "RepID", K1: "Rep", L1: "Region", J2: "R1", K2: "Ava", L2: "North", J3: "R2", K3: "Ben", L3: "South", J4: "R3", K4: "Cleo", L4: "North", J5: "R4", K5: "Dev", L5: "West", A7: "All sales", D7: "Rep", F7: "Region", N1: "Region", O1: "Revenue", N6: "Top rep", N7: "Growth Jan→Mar" },
          bold: ["A7", "D7", "F7", "N1", "O1", "N6", "N7"],
          fmt: { B: "currency", E: "currency", H: "currency", O: "currency", O7: "percentage" },
        },
        steps: [
          task("A8", "In **A8**, stack the three months (A2:B4, D2:E4, G2:H4) into one table.", "=VSTACK(A2:B4,D2:E4,G2:H4)", "Nine sales rows: Power Query's append, as a formula.", { spill: true }),
          task("D8", "In **D8**, look up the rep name for every RepID in the stacked list (A8# column 1) in one formula.", "=XLOOKUP(CHOOSECOLS(A8#,1),J2:J5,K2:K5)", "XLOOKUP with an array of keys spills one name per row, like RELATED.", { spill: true }),
          task("F8", "In **F8**, the region for every row the same way.", "=XLOOKUP(CHOOSECOLS(A8#,1),J2:J5,L2:L5)", "Now every sale has a region.", { spill: true }),
          task("N2", "In **N2**, a sorted unique list of regions.", "=SORT(UNIQUE(L2:L5))", "North, South, West.", { spill: true }),
          task("O2", "In **O2**, total revenue for each region in N2# with one SUMIFS over the stacked data.", "=SUMIFS(CHOOSECOLS(A8#,2),F8#,N2#)", "Passing N2# as the criteria returns one total per region, like a PivotTable: North 21,500, South 11,100, West 9,900.", { spill: true, fmt: "currency" }),
          task("O6", "In **O6**, the rep with the highest total revenue: use LET to name the stacked revenue and rep names, then TAKE the first of SORTBY.", "=LET(reps,UNIQUE(D8#),totals,SUMIFS(CHOOSECOLS(A8#,2),D8#,reps),TAKE(SORTBY(reps,totals,-1),1))", "Ava: 5,200 + 6,300 = 11,500."),
          task("O7", "In **O7**, growth from January's total to March's total.", "=SUM(H2:H4)/SUM(B2:B4)-1", "16,500 ÷ 13,500 − 1 ≈ 22.2%.", { fmt: "percentage" }),
        ],
        done: "You've completed the Excel 365 path, from your first cell to dynamic arrays, LAMBDA and Power Query.",
      },
    ],
  },
];

import { d, enter, task, type ChapterSpec } from "./build";

// ─── Beginner ─────────────────────────────────────────────────────────────────

const products = [
  ["Product", "Sales", "Region"],
  ["Laptop", 1200, "North"],
  ["Mouse", 45, "South"],
  ["Keyboard", 89, "East"],
  ["Monitor", 310, "West"],
];

export const BEGINNER: ChapterSpec[] = [
  {
    id: "b1",
    title: "Excel Fundamentals",
    desc: "Cells, rows, columns, the formula bar, ribbons and the shortcuts that save you clicks.",
    difficulty: "beginner",
    formula: "=B2+B3",
    lessons: [
      {
        title: "Meet the Spreadsheet",
        desc: "Learn the anatomy of a spreadsheet: cells, rows, columns, and the formula bar.",
        learn: `
A worksheet is a grid of boxes, organised into columns and rows.

\`\`\`show
col B: A **column** is a line of cells going **down** the sheet. Each column has a letter at the top. The highlighted one is **column B**.
row 3: A **row** is a line of cells going **across** the sheet. Each row has a number on the left. The highlighted one is **row 3**.
cell C4: A **cell** is one box, where a column and a row cross. Its **address** is its column letter plus its row number: column C, row 4 is \`C4\`.
cell A2: Click any cell to select it. The **Name Box** at the top left always shows its address, here \`A2\`.
range A1:C5: A **range** is a block of cells side by side, written first cell : last cell. This one is \`A1:C5\`.
value E5 Hi: To fill a cell, **click it and type**, then press **Enter** to save it.
\`\`\`
`,
        sheet: { rows: products },
        steps: [
          enter("E3", "Click cell **E3** and type the word `Hello`.", "Hello", "Every cell can hold text, numbers or formulas. E3 means column E, row 3.", { hint: "Find column E along the top and row 3 down the side." }),
          enter("E4", "Now type the number `42` in **E4**.", 42, "Numbers line up on the right of the cell. That's how you can tell Excel recognised it as a number."),
        ],
      },
      {
        title: "Explore the Interface",
        desc: "Name Box, formula bar, ribbons, sheet tabs and the status bar.",
        learn: `
Learn the names of these parts of the Excel window. Every later lesson refers to them.

| Part | What it does |
| Ribbon | Tabs (Home, Insert, Formulas, Data…) with groups of commands |
| Name Box | Shows the address of the selected cell. Type an address to jump to it |
| Formula bar | Shows what's really in the cell, including the formula behind a result |
| Grid | The worksheet itself |
| Sheet tabs | The worksheets inside the workbook |
| Status bar | Sum, Average and Count of the selection, plus zoom |

The cell shows the **result**; the formula bar shows the **formula**. Select a few numbers and the status bar adds them up for you without a formula.

\`\`\`show
cell B2: The **Name Box**, at the top left, always shows the address of the selected cell. B2 is selected, so it says B2.
type D2 =B2*2: The **formula bar**, next to the Name Box, shows what's really in a cell. Here D2 holds a formula: the bar shows the formula and the cell shows its result.
range B2:B5: The **status bar**, along the bottom of Excel, adds up whatever numbers you select, without any formula.
\`\`\`
`,
        sheet: { rows: products },
        steps: [
          enter("F2", "The word **East** is in this sheet. Type its cell address into **F2**.", "C4", "East sits in column C, row 4, so its address is C4. The Name Box would show C4 when you select it.", { hint: "Find East, then read the column letter above it and the row number beside it." }),
          enter("F3", "Which cell holds the number **310**? Type its address into **F3**.", "B5", "310 is in column B, row 5."),
        ],
      },
      {
        title: "Lab: Interface Workout",
        kind: "lab",
        desc: "Put the interface skills together: addresses, the formula bar and the toolbar.",
        learn: `
Time to combine what you've learned in this chapter. You'll identify cells by address, read values from the grid and answer questions about the Excel window.

Take your time: there are no new ideas here, only practice.
`,
        sheet: {
          rows: [
            ["Item", "Units", "Store"],
            ["Pens", 120, "Leeds"],
            ["Pads", 64, "York"],
            ["Ink", 18, "Leeds"],
            ["Tape", 75, "Hull"],
            ["Clips", 240, "York"],
          ],
        },
        steps: [
          enter("E2", "Type the address of the cell that holds **Ink** into **E2**.", "A4", "Ink is in column A, row 4."),
          enter("E3", "How many **Tape** units are there? Type the number into **E3**.", 75, "Reading values from the grid is the first step to referencing them in formulas."),
          enter("E4", "Type the address of the last cell in the Store column into **E4**.", "C6", "The Store column is C and the last row of data is 6."),
        ],
      },
    ],
  },

  {
    id: "b2",
    title: "Workbooks and Data Entry",
    desc: "Templates, worksheets, OneDrive, and typing data Excel understands.",
    difficulty: "beginner",
    formula: "=COUNTA(A2:A6)",
    lessons: [
      {
        title: "Enter Text, Numbers and Dates",
        desc: "How Excel decides what you typed, and why it matters.",
        learn: `
Excel decides the type of everything you type:

- **Numbers** align to the right and can be calculated.
- **Text** aligns to the left.
- **Dates** are stored as numbers (days since 1 January 1900), so they align right too.

If a column of numbers aligns left, Excel is treating them as text and \`SUM\` will ignore them.

\`\`\`show
| Entry | Value |
| Quantity | 125 |
| Name | Laptop |
| Code | '00125 |
cell B2: Excel can tell numbers from text. A **number** lines up on the **right** of its cell, like 125 here.
cell B3: **Text** lines up on the **left**, like Laptop here.
cell B4: Codes like \`00125\` would lose their zeros as numbers. Typing an apostrophe first stores them as **text**, so the zeros stay.
\`\`\`

**Editing tips**

- Typing into a filled cell replaces it. Press **F2** to edit it instead.
- Start an entry with an apostrophe to keep it as text: \`'00125\` keeps its leading zeros.
- Ctrl + ; enters today's date.
- \`#####\` in a cell means the column is too narrow. Double-click the column border to fit it.
`,
        sheet: { rows: [["Entry", "You type"], ["Quantity", null], ["Product code", null], ["Price", null]] },
        steps: [
          enter("B2", "Enter the quantity `125` in **B2**.", 125, "A number lines up on the right of the cell and can be used in calculations."),
          enter("B3", "Product codes need their leading zeros. Enter `'00125` in **B3** (with the apostrophe).", "'00125", "The apostrophe tells Excel to store it as text, so the zeros are kept. It doesn't appear in the cell.", { hint: "Type the apostrophe first, then 00125." }),
          enter("B4", "Enter the price `4.99` in **B4**.", 4.99, "Decimals are numbers too. You can format them as currency later."),
        ],
      },
      {
        title: "AutoFill and Custom Lists",
        desc: "Fill series automatically and teach Excel your own lists.",
        learn: `
Select a cell and drag the **fill handle** (the small square at its bottom-right corner):

- One number copies it. Two numbers (1, 2) continue the pattern: 3, 4, 5…
- \`Monday\` fills the days of the week; \`Jan\` fills the months.
- Text with a number, like \`Week 1\`, becomes Week 2, Week 3…
- A formula copies down with its references adjusted.

Double-click the fill handle to fill down as far as the column next to it has data.

\`\`\`show
| Month | Quarter |
| Jan | Q1 |
| Feb | Q2 |
range A2:A3: **AutoFill** continues a pattern for you. First, select the start of the pattern: Jan, Feb.
value A4 Mar: Then drag the small square at the corner of the selection (the **fill handle**). Excel carries on: Mar.
value B4 Q3: Text that ends in a number counts up too: Q1, Q2, Q3.
\`\`\`

**Custom lists.** Teach Excel your own sequence (staff names, regions): File ▸ Options ▸ Advanced ▸ **Edit Custom Lists** ▸ import from cells. Then type the first item and drag. Custom lists also control **Sort ▸ Custom List**, for example North, South, East, West.
`,
        sheet: { rows: [["Day", "Week"], ["Monday", "Week 1"], ["Tuesday", "Week 2"], [null, null], [null, null]] },
        steps: [
          enter("A4", "AutoFill would continue the days. Type the next day into **A4**.", "Wednesday", "Excel has built-in lists for days and months, so dragging Monday down gives Tuesday, Wednesday…"),
          enter("B4", "What would AutoFill put in **B4**? Type it.", "Week 3", "Text that ends in a number counts up when you fill it."),
        ],
      },
      {
        title: "Lab: Set Up a Student Register",
        kind: "lab",
        desc: "Enter clean data: text, numbers, codes and series.",
        learn: `
Put this chapter together. You'll complete a small register: student names, ID codes that keep their zeros, and test scores.

Remember the alignment test: numbers go right, text goes left.
`,
        sheet: { rows: [["Student", "ID", "Score"], ["Amira", "'00101", 88], ["Ben", "'00102", 74], [null, null, null]] },
        steps: [
          enter("A4", "Add a third student, **Carlos**, in **A4**.", "Carlos", "Text entries align to the left."),
          enter("B4", "Give Carlos the ID `'00103` in **B4**, keeping the zeros.", "'00103", "The apostrophe keeps the code as text with its leading zeros."),
          enter("C4", "Carlos scored **91**. Enter it in **C4**.", 91, "Scores are numbers, so you'll be able to total and average them later."),
        ],
      },
    ],
  },

  {
    id: "b3",
    title: "Core Formulas",
    desc: "Operators, the six everyday functions, absolute references and AutoSum.",
    difficulty: "beginner",
    formula: "=SUM(B2:B4)",
    lessons: [
      {
        title: "Enter Your First Formula",
        desc: "Every formula starts with =. Point at cells instead of typing numbers.",
        learn: `
A formula starts with \`=\`. Then you combine **cell references** with operators:

| Operator | Meaning |
| + | Add |
| - | Subtract |
| * | Multiply |
| / | Divide |
| ^ | Power |

Write \`=B2*C2\`, not \`=3.5*4\`. With references, the result updates automatically when the inputs change.

You can type the address, or click the cell while writing the formula and Excel inserts it for you.

\`\`\`show
cell B2: A **formula** calculates using the values in other cells. The coffee's price is in \`B2\`.
cell C2: The quantity is in \`C2\`.
type D2 =B2*C2: Every formula starts with **=**. Then use the cell addresses: \`=B2*C2\` multiplies them. Excel outlines each cell you use and shows the result.
\`\`\`
`,
        sheet: { rows: [["Item", "Price", "Quantity", "Total"], ["Coffee", 3.5, 4, null], ["Sandwich", 8, 2, null], ["Muffin", 2.75, 6, null]], fmt: { B: "currency", D: "currency" } },
        steps: [
          task("D2", "In **D2**, multiply the Price (B2) by the Quantity (C2).", "=B2*C2", "=B2*C2 takes 3.50 × 4. Change B2 and D2 updates on its own.", { fmt: "currency", hint: "Start with =, click B2, type *, click C2." }),
          task("D3", "Do the same for the Sandwich in **D3**.", "=B3*C3", "Each row's formula points at its own row."),
          task("D4", "And the Muffin in **D4**.", "=B4*C4", "Notice the pattern: only the row number changes. Copying a formula down does this for you."),
        ],
      },
      {
        title: "Order of Operations",
        desc: "Why =2+3*4 is 14, and how brackets change the answer.",
        learn: `
Excel calculates in a fixed order, like maths at school:

| Order | Operator |
| 1 | ( ) brackets |
| 2 | - negation, % percent |
| 3 | ^ power |
| 4 | * and / (left to right) |
| 5 | + and - (left to right) |
| 6 | & join text |
| 7 | = < > comparisons |

So \`=2+3*4\` is 14 (multiply first) but \`=(2+3)*4\` is 20.

\`\`\`show
| Formula | Result |
| No brackets | |
| Brackets | |
type B2 =2+3*4: Multiply first: 3 × 4 = 12, then + 2 = **14**.
type B3 =(2+3)*4: Brackets first: 2 + 3 = 5, then × 4 = **20**.
\`\`\`

A common mistake is averaging two cells as \`=A2+B2/2\`. That only halves B2. Write \`=(A2+B2)/2\`.
`,
        sheet: { rows: [["Test", "Score 1", "Score 2", "Average"], ["Amira", 70, 90, null], ["Ben", 64, 80, null]] },
        steps: [
          task("D2", "In **D2**, average Amira's two scores using brackets: add B2 and C2, then divide by 2.", "=(B2+C2)/2", "Brackets force the addition first: (70 + 90) / 2 = 80.", { hint: "Put B2+C2 in brackets, then /2." }),
          task("D3", "Do the same for Ben in **D3**.", "=(B3+C3)/2", "(64 + 80) / 2 = 72. Without brackets you'd get 64 + 40 = 104."),
        ],
      },
      {
        title: "Add Up Sales with SUM",
        desc: "Add a whole range at once instead of cell by cell.",
        learn: `
A **function** is a ready-made formula with a name: \`=NAME(arguments)\`.

\`SUM\` adds a range: \`=SUM(B2:B5)\` means B2 + B3 + B4 + B5. The colon means "through".

\`\`\`show
| Day | Visitors |
| Mon | 120 |
| Tue | 95 |
| Wed | 140 |
range B2:B4: \`B2:B4\` is a range: B2 **through** B4, all three cells.
type B5 =SUM(B2:B4): **SUM** is a function that adds up every number in a range, in one go.
\`\`\`

You can add several ranges or single cells, separated by commas: \`=SUM(B2:B5, D2)\`.

The quickest way is **AutoSum**: click the cell under the numbers and press **Alt + =**. Excel writes the SUM for you; check the highlighted range, then press Enter.
`,
        sheet: { rows: [["Week", "Sales"], ["Week 1", 1250], ["Week 2", 1890], ["Week 3", 2100], ["Week 4", 1750], [null, null], ["Total", null]], bold: ["A7"], fmt: { B: "currency" } },
        steps: [
          task("B7", "In **B7**, use SUM to add up all four weeks of sales.", "=SUM(B2:B5)", "=SUM(B2:B5) adds the four weeks to give 6,990. Add a week inside the range and the total updates.", { fmt: "currency" }),
        ],
      },
      {
        title: "The Big Six Functions",
        desc: "SUM, AVERAGE, MIN, MAX, COUNT and COUNTA.",
        learn: `
These six functions cover most everyday questions:

| Function | Returns |
| SUM | Total of the numbers |
| AVERAGE | Mean of the numbers |
| MIN / MAX | Smallest / largest number |
| COUNT | How many cells contain **numbers** |
| COUNTA | How many cells are **not empty**, text included |

To count how many companies are in a list of names you need \`COUNTA\`, because \`COUNT\` ignores text and would return 0.

\`\`\`show
| Item | Price |
| Pen | 2 |
| Pad | 5 |
| Ink | 11 |
| Tape | |
type D2 =SUM(B2:B5): **SUM** adds the numbers: 18.
type D3 =AVERAGE(B2:B5): **AVERAGE** skips the blank: 18 ÷ 3 = 6.
type D4 =MAX(B2:B5): **MAX** finds the largest.
type D5 =COUNT(A2:A5): **COUNT** only counts numbers, so names give 0.
type D6 =COUNTA(A2:A5): **COUNTA** counts every filled cell: 4.
\`\`\`
`,
        sheet: {
          rows: [
            ["Company", "Revenue", "Profit"],
            ["Apex Ltd", 52000, 14000],
            ["Blue Fin", 41000, 11500],
            ["Cedar Co", 67000, 16000],
            ["Delta Inc", 29000, 3500],
            ["Echo plc", 58000, 12000],
          ],
          cells: { E1: "Question", F1: "Answer", E2: "Total revenue", E3: "Average profit", E4: "Lowest revenue", E5: "Highest profit", E6: "Companies", E7: "Revenue figures" },
          bold: ["E1", "F1"],
          fmt: { B: "currency", C: "currency", F2: "currency", F3: "currency", F4: "currency", F5: "currency" },
        },
        steps: [
          task("F2", "Total revenue in **F2**.", "=SUM(B2:B6)", "SUM adds every number in the range.", { fmt: "currency" }),
          task("F3", "Average profit in **F3**.", "=AVERAGE(C2:C6)", "AVERAGE = SUM ÷ COUNT.", { fmt: "currency" }),
          task("F4", "Lowest revenue in **F4**.", "=MIN(B2:B6)", "MIN finds the smallest number."),
          task("F5", "Highest profit in **F5**.", "=MAX(C2:C6)", "MAX finds the largest number."),
          task("F6", "How many companies are listed? Answer in **F6**.", "=COUNTA(A2:A6)", "COUNTA counts non-empty cells, so it counts the names.", { hint: "Names are text. Which count function counts text?" }),
          task("F7", "Use **COUNT** on the Revenue column in **F7**.", "=COUNT(B2:B6)", "COUNT only counts cells holding numbers."),
        ],
      },
      {
        title: "Absolute vs Relative References",
        desc: "Lock a cell with $ so it stays fixed when the formula is copied.",
        learn: `
Copy \`=B2*E1\` down one row and it becomes \`=B3*E2\`. Every reference moves. That's a **relative** reference, and usually what you want: B2 should become B3.

But if E1 holds a rate, it should never move. Lock it with dollar signs: \`=B2*$E$1\`. Press **F4** while the cursor is on a reference to cycle through the options:

\`\`\`show
| Item | Price | Tax | | Rate |
| Desk | 200 | | | 0.1 |
| Chair | 80 | | | |
| Lamp | 30 | | | |
type C2 =B2*E2: Tax = price × the rate in E2.
fill C2 C4: Copy it down. B2 moves to B3 ✓ but E2 moves to E3, which is empty ✗
type C2 =B2*$E$2: Lock the rate with dollar signs: \`$E$2\`.
fill C2 C4: Copy again. Every row still points at E2 ✓
\`\`\`

| Form | Column | Row |
| E1 | moves | moves |
| $E$1 | locked | locked |
| E$1 | moves | locked |
| $E1 | locked | moves |
`,
        sheet: {
          rows: [["Student", "Term Fee", "Next Year"], ["Aisha", 4200, null], ["Bruno", 3900, null], ["Chen", 4500, null], ["Dara", 4100, null]],
          cells: { E1: "Fee increase", F1: 0.052 },
          bold: ["E1"],
          fmt: { B: "currency", C: "currency", F1: "percentage" },
        },
        steps: [
          task("C2", "In **C2**, work out next year's fee: B2 plus B2 times the increase in **F1**. Lock F1 with $.", "=B2+B2*$F$1", "$F$1 stays fixed when the formula is copied, while B2 moves to B3, B4…", { contains: ["$F$1"], fmt: "currency", hint: "Type F1, then press F4 to turn it into $F$1." }),
          task("C3", "Write the same formula for Bruno in **C3**, keeping F1 locked.", "=B3+B3*$F$1", "Only the B reference changed. That's exactly what copying down would produce.", { contains: ["$F$1"], fmt: "currency" }),
        ],
      },
      {
        title: "Quick Totals and Status Bar Maths",
        fullExcel: true, // the AutoSum button and status bar are what this lesson is about
        desc: "AutoSum for rows and columns, and totals of totals.",
        learn: `
**AutoSum** (Alt + =) writes a SUM for the numbers above or to the left. Select a block of numbers *plus* an empty row and column and press Alt + = once to total every row and column.

AutoSum stops at the first blank cell, so always check the highlighted range.

\`\`\`show
| Product | Q1 | Q2 | Total |
| Laptops | 120 | 135 | |
| Tablets | 80 | 95 | |
type D2 =SUM(B2:C2): Alt + = writes the SUM for you. A row total adds across.
fill D2 D3: Copy it down for every row.
type B4 =SUM(B2:B3): A column total adds down.
\`\`\`

A grand total can add the row totals or the column totals. Both should agree, which makes a good check.
`,
        sheet: {
          rows: [["Product", "Q1", "Q2", "Q3", "Q4", "Total"], ["Laptops", 120, 135, 150, 170, null], ["Tablets", 80, 95, 70, 110, null], ["Phones", 300, 280, 310, 355, null], ["Total", null, null, null, null, null]],
          bold: ["A5"],
        },
        steps: [
          task("F2", "Total the Laptops row in **F2**.", "=SUM(B2:E2)", "A row total adds across the four quarters."),
          task("F3", "Total Tablets in **F3**.", "=SUM(B3:E3)", "Same pattern, next row."),
          task("F4", "Total Phones in **F4**.", "=SUM(B4:E4)", "Same pattern again."),
          task("B5", "Total the Q1 column in **B5**.", "=SUM(B2:B4)", "A column total adds down."),
          task("F5", "Grand total in **F5**: add up the row totals.", "=SUM(F2:F4)", "The grand total is 2,175 whichever way you add it. Matching totals are a good self-check."),
        ],
      },
      {
        title: "Join and Split Text",
        desc: "What Flash Fill does, and how to do it with a formula that updates.",
        learn: `
**Flash Fill** (Ctrl + E) spots a pattern from an example you type and fills the rest of the column: splitting full names, joining first and last names, reformatting codes. It writes **fixed values**, so it won't update if the source changes.

A formula does the same job and stays live. The **&** operator joins text:

\`\`\`
=B2&" "&C2
\`\`\`

The space in quotes goes between the two names. Text inside formulas always goes in "double quotes".

\`\`\`show
| First | Last | Full name |
| Ada | King | |
cell A2: The first name is in A2.
cell B2: The last name is in B2.
type C2 =A2&" "&B2: The **&** sign joins text together. \`" "\` adds a space between the names.
\`\`\`
`,
        sheet: { rows: [["ID", "First", "Last", "Full Name"], [1, "Maria", "Lopez", null], [2, "James", "Oneil", null], [3, "Priya", "Sharma", null]] },
        steps: [
          task("D2", "In **D2**, join First and Last with a space between, using &.", '=B2&" "&C2', '"Maria" & " " & "Lopez" gives Maria Lopez. The space is a piece of text in quotes.', { hint: 'B2, then &" "&, then C2.' }),
          task("D3", "Do the same in **D3**.", '=B3&" "&C3', "Formulas update if a name is corrected; Flash Fill results don't."),
        ],
      },
      {
        title: "Lab: Test Scores and Fees",
        kind: "lab",
        desc: "Totals, non-adjacent sums, counts, averages and a locked fee rate.",
        learn: `
Part 1 practises the Big Six on four test scores (each out of 100). Part 2 calculates next year's fees with a locked rate.

A comma lets you add cells that aren't next to each other: \`=SUM(C3,E3)\`.
`,
        sheet: {
          rows: [
            ["Student", "Test 1", "Test 2", "Test 3", "Test 4", "Term Fee"],
            ["Prem", 88, 91, 79, 89, 4200],
            ["Adele", 72, 65, 80, 69, 3900],
            ["Kresa", 85, 78, 84, 78, 4500],
            ["Olivia", 60, 77, 71, 74, 4100],
            ["Tom", 92, 88, 95, 90, 4300],
          ],
          cells: { H1: "Question", I1: "Answer", H2: "Prem's total (of 400)", H3: "Adele: Test 2 + Test 4", H4: "Students who sat", H5: "Kresa's average", H6: "Olivia's best score", H8: "Fee increase", I8: 0.052, H9: "Prem's new fee", H10: "Adele's new fee" },
          bold: ["H1", "I1", "H8"],
          fmt: { F: "currency", I8: "percentage", I9: "currency", I10: "currency" },
        },
        steps: [
          task("I2", "Prem's total score in **I2**.", "=SUM(B2:E2)", "347 out of a possible 400."),
          task("I3", "Adele's Test 2 plus Test 4 only, in **I3**.", "=SUM(C3,E3)", "The comma adds two separate cells: 65 + 69 = 134.", { hint: "SUM(first cell, second cell)." }),
          task("I4", "How many students sat the tests? Answer in **I4**.", "=COUNTA(A2:A6)", "COUNTA counts the names."),
          task("I5", "Kresa's average score in **I5**.", "=AVERAGE(B4:E4)", "(85 + 78 + 84 + 78) / 4 = 81.25."),
          task("I6", "Olivia's best score in **I6**.", "=MAX(B5:E5)", "MAX across her four tests gives 77."),
          task("I9", "Prem's fee next year in **I9**: fee plus fee × the increase in I8 (locked).", "=F2+F2*$I$8", "Lock I8 with F4 so the formula could be copied for every student.", { contains: ["$I$8"], fmt: "currency" }),
          task("I10", "Adele's new fee in **I10**, same locked rate.", "=F3+F3*$I$8", "Same formula, next student.", { contains: ["$I$8"], fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "b4",
    title: "Named Ranges",
    desc: "Give cells meaningful names and write formulas people can read.",
    difficulty: "beginner",
    formula: "=SUM(Amount)",
    lessons: [
      {
        title: "What Are Named Ranges?",
        desc: "A name like TaxRate instead of a reference like $G$1.",
        learn: `
A **named range** is a label for a cell or range. \`=Price*TaxRate\` reads far better than \`=B2*$G$1\`, and a name is automatically absolute, so there's no need for F4.

**Creating names** (in desktop Excel):

- **Name Box**: select the cells, type a name in the Name Box, press Enter.
- **Formulas ▸ Define Name**: also lets you set the scope and a comment.
- **Formulas ▸ Create from Selection**: select a table with its headers and tick Top row. Every column is named after its header in one go.

**Rules:** start with a letter or underscore, no spaces (use \`Tax_Rate\`), and don't look like a cell address (\`Q1\` is taken). Manage them all in **Name Manager** (Ctrl + F3).

In this sheet, F1 has been named **TaxRate**.

\`\`\`show
cell F1: A **named range** gives a cell a readable name. This cell has been named **TaxRate**.
type D2 =B2*TaxRate: Now you can write the name instead of the address. Excel still outlines the cell it points to.
\`\`\`
`,
        sheet: {
          rows: [["Item", "Price", "Tax"], ["Desk", 240, null], ["Chair", 95, null]],
          cells: { E1: "Tax rate", F1: 0.2 },
          bold: ["E1"],
          fmt: { B: "currency", C: "currency", F1: "percentage" },
          names: { TaxRate: "F1" },
        },
        steps: [
          task("C2", "In **C2**, calculate tax using the name: `=B2*TaxRate`.", "=B2*TaxRate", "TaxRate always points at F1, so you never need $ signs.", { fns: [], contains: ["TAXRATE"], fmt: "currency" }),
          task("C3", "Tax on the chair in **C3**, again using TaxRate.", "=B3*TaxRate", "Names make the formula read like a sentence.", { fns: [], contains: ["TAXRATE"], fmt: "currency" }),
        ],
      },
      {
        title: "Use Named Ranges in Formulas",
        desc: "Write SUM(Amount) instead of SUM(E2:E9).",
        learn: `
Once names exist, type them straight into functions. As you type, names appear in the AutoComplete list with a tag icon. In desktop Excel, **F3** opens Paste Name.

In this sheet each column has been named after its header: **Invoice**, **Customer**, **Description** and **Amount**.

\`\`\`show
range D2:D7: A whole range can have a name too. This column is named **Amount**.
type F9 =MIN(Amount): So \`=MIN(Amount)\` reads like a sentence: the smallest amount.
\`\`\`

\`\`\`
=SUM(Amount)
=COUNTA(Description)
\`\`\`
`,
        sheet: {
          rows: [
            ["Invoice", "Customer", "Description", "Amount"],
            ["INV-1001", "Northwind", "Consulting", 1250],
            ["INV-1002", "Contoso", "Training", 860],
            ["INV-1003", "Fabrikam", "Licences", 2400],
            ["INV-1004", "Northwind", "Support", 540],
            ["INV-1005", "Litware", "Consulting", 1780],
            ["INV-1006", "Contoso", "Licences", 1320],
          ],
          cells: { F1: "Question", G1: "Answer", F2: "Total invoiced", F3: "Number of invoices", F4: "Average invoice", F5: "Largest invoice" },
          bold: ["F1", "G1"],
          fmt: { D: "currency", G2: "currency", G4: "currency", G5: "currency" },
          names: { Invoice: "A2:A7", Customer: "B2:B7", Description: "C2:C7", Amount: "D2:D7" },
        },
        steps: [
          task("G2", "Total invoiced in **G2**, using the name **Amount**.", "=SUM(Amount)", "SUM(Amount) is the same as SUM(D2:D7), but readable.", { contains: ["AMOUNT"], fmt: "currency" }),
          task("G3", "Number of invoices in **G3**, using **Description**.", "=COUNTA(Description)", "Any text column works for counting rows.", { contains: ["DESCRIPTION"] }),
          task("G4", "Average invoice in **G4**.", "=AVERAGE(Amount)", "Names work in every function.", { contains: ["AMOUNT"], fmt: "currency" }),
          task("G5", "Largest invoice in **G5**.", "=MAX(Amount)", "MAX(Amount) = 2,400.", { contains: ["AMOUNT"], fmt: "currency" }),
        ],
      },
      {
        title: "Lab: Named Invoice Report",
        kind: "lab",
        desc: "Answer a set of questions using only named ranges.",
        learn: `
The invoice table's columns are named **Date**, **Customer**, **Amount** and **Status**, and the target is in a cell named **Target**.

Answer every question using names, not cell addresses.
`,
        sheet: {
          rows: [
            ["Date", "Customer", "Amount", "Status"],
            [d(2026, 1, 3), "Northwind", 1250, "Paid"],
            [d(2026, 1, 9), "Contoso", 860, "Due"],
            [d(2026, 1, 14), "Fabrikam", 2400, "Paid"],
            [d(2026, 1, 20), "Litware", 540, "Due"],
            [d(2026, 1, 27), "Contoso", 1780, "Paid"],
          ],
          cells: { F1: "Target", G1: 7500, F3: "Total", F4: "Smallest", F5: "Invoices", F6: "Short of target" },
          bold: ["F1", "F3", "F4", "F5", "F6"],
          fmt: { A: "date", C: "currency", G1: "currency", G3: "currency", G4: "currency", G6: "currency" },
          names: { Date: "A2:A6", Customer: "B2:B6", Amount: "C2:C6", Status: "D2:D6", Target: "G1" },
        },
        steps: [
          task("G3", "Total of all invoices in **G3**.", "=SUM(Amount)", "6,830 in total.", { contains: ["AMOUNT"], fmt: "currency" }),
          task("G4", "Smallest invoice in **G4**.", "=MIN(Amount)", "MIN(Amount) = 540.", { contains: ["AMOUNT"], fmt: "currency" }),
          task("G5", "Number of invoices in **G5** (use Customer).", "=COUNTA(Customer)", "Five invoices.", { contains: ["CUSTOMER"] }),
          task("G6", "How far short of the target are we? In **G6**, subtract the total from **Target**.", "=Target-SUM(Amount)", "7,500 − 6,830 = 670 still to invoice.", { contains: ["TARGET", "AMOUNT"], fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "b5",
    title: "Formatting Cells",
    desc: "Number formats, fonts, borders, Format Painter and cleaning up.",
    difficulty: "beginner",
    formula: '=TEXT(B2,"$#,##0.00")',
    lessons: [
      {
        title: "Apply Number Formats",
        fullExcel: true, // number formats live on the Home ribbon
        desc: "Change how a value looks without changing the value.",
        learn: `
A number format changes only the **display**. \`0.256\` shown as \`26%\` is still 0.256 in calculations.

| Format | Shortcut | Use |
| General | Ctrl+Shift+~ | Remove formatting |
| Number | Ctrl+Shift+! | Quantities with separators |
| Currency | Ctrl+Shift+$ | Symbol next to the number |
| Accounting | Home ▸ $ | Symbol at the left edge, decimals line up, zero shows – |
| Percentage | Ctrl+Shift+% | Rates and margins |
| Date | Ctrl+Shift+# | Dates |

Each format has a **code** behind it. The \`TEXT\` function applies a code inside a formula, which is a good way to see how codes work:

\`\`\`
=TEXT(1234.5,"$#,##0.00")   → $1,234.50
=TEXT(0.256,"0%")           → 26%
\`\`\`

\`0\` always shows a digit, \`#\` only shows significant digits, and \`,\` adds thousands separators.

\`\`\`show
| Value | Shown as |
| 1234.5 | |
| 0.256 | |
type B2 =TEXT(A2,"$#,##0.00"): Same number, shown as money.
type B3 =TEXT(A3,"0%"): 0.256 shown as a percentage. The value underneath doesn't change.
\`\`\`
`,
        sheet: { rows: [["Item", "Value", "Formatted"], ["Price", 1234.5, null], ["Rate", 0.075, null], ["Units", 48210, null]] },
        steps: [
          task("C2", 'Show the price as currency in **C2**: `=TEXT(B2,"$#,##0.00")`.', '=TEXT(B2,"$#,##0.00")', "The code adds the $ sign, thousands separator and two decimals."),
          task("C3", 'Show the rate as a percentage with one decimal in **C3** using the code `"0.0%"`.', '=TEXT(B3,"0.0%")', "0.075 displays as 7.5%. The value itself doesn't change."),
          task("C4", 'Show Units with a thousands separator and no decimals in **C4** (code `"#,##0"`).', '=TEXT(B4,"#,##0")', "48210 becomes 48,210."),
        ],
      },
      {
        title: "Lab: Format a Sales Report",
        kind: "lab",
        desc: "Apply number formats with codes and choose the right tools.",
        learn: `
Format the report values with \`TEXT\`, then answer questions about the formatting tools.

Codes you'll need: \`"$#,##0.00"\`, \`"0%"\` and \`"#,##0"\`.
`,
        sheet: { rows: [["Region", "Revenue", "Margin", "Units"], ["North", 125400.5, 0.184, 3120], ["South", 98200, 0.152, 2475]], cells: { F1: "Report line" }, bold: ["F1"] },
        steps: [
          task("F2", 'In **F2**, show North revenue as `$#,##0.00`.', '=TEXT(B2,"$#,##0.00")', "$125,400.50"),
          task("F3", 'In **F3**, show North margin as a whole percentage.', '=TEXT(C2,"0%")', "0.184 → 18%"),
          task("F4", 'In **F4**, build the sentence `North: 3,120 units` by joining A2, ": ", the formatted units and " units".', '=A2&": "&TEXT(D2,"#,##0")&" units"', "TEXT is handy for putting formatted numbers inside sentences.", { hint: 'A2&": "&TEXT(D2,"#,##0")&" units"' }),
        ],
      },
    ],
  },

  {
    id: "b6",
    title: "Excel Tables",
    desc: "Ctrl+T turns a range into a table that grows, filters and totals itself.",
    difficulty: "beginner",
    formula: "=AVERAGE(Invoices[Amount])",
    lessons: [
      {
        title: "Format as Table and the Total Row",
        desc: "Create, name and total a table.",
        learn: `
1. Click anywhere in the data and press **Ctrl + T**, then confirm *My table has headers*.
2. **Table Design ▸ Table Name**: replace \`Table1\` with something meaningful like \`Invoices\` (no spaces).
3. **Table Style Options**: Header Row, **Total Row**, Banded Rows, Filter Button.

Each Total Row cell has a drop-down (Sum, Average, Count, Max…). It writes a \`SUBTOTAL\` formula, so the total respects filters:

\`\`\`
=SUBTOTAL(109,Invoices[Amount])
\`\`\`

109 means SUM of visible rows only. In this sheet the table is named **Invoices**.

\`\`\`show
range C2:C5: \`Invoices[Amount]\` means this whole column of the table.
type E2 =SUM(Invoices[Amount]): Use it in any function. Add a row to the table and it's included.
\`\`\`
`,
        sheet: {
          rows: [["Invoice", "Customer", "Amount"], ["INV-1001", "Northwind", 1250], ["INV-1002", "Contoso", 860], ["INV-1003", "Fabrikam", 2400], ["INV-1004", "Litware", 540], ["Total", null, null]],
          bold: ["A6"],
          fmt: { C: "currency" },
          names: { "Invoices[Amount]": "C2:C5", "Invoices[Customer]": "B2:B5", "Invoices[Invoice]": "A2:A5" },
        },
        steps: [
          task("C6", "Write the Total Row formula in **C6**: `=SUBTOTAL(109,Invoices[Amount])`.", "=SUBTOTAL(109,Invoices[Amount])", "SUBTOTAL(109,…) sums only visible rows, so the total follows your filters.", { fmt: "currency" }),
        ],
      },
      {
        title: "Table References in Formulas",
        desc: "Structured references: TableName[Column].",
        learn: `
Click a table column while writing a formula and Excel writes a **structured reference**, not a range like \`C2:C5\`:

| Reference | Means |
| Invoices[Amount] | Whole Amount column (data only) |
| [@Amount] | Amount in the current row |
| Invoices[#Totals] | The Total Row |

Inside a table, \`=[@Amount]*0.2\` in an empty column creates a **calculated column** that fills every row, including new ones.

In this sheet the table is **Invoices** with columns Invoice, Customer and Amount.

\`\`\`show
range C2:C6: \`Invoices[Amount]\` is the Amount column…
range B2:B6: …and \`Invoices[Customer]\` is the Customer column.
type H2 =MAX(Invoices[Amount]): Structured references say what they mean.
\`\`\`
`,
        sheet: {
          rows: [["Invoice", "Customer", "Amount"], ["INV-1001", "Northwind", 1250], ["INV-1002", "Contoso", 860], ["INV-1003", "Fabrikam", 2400], ["INV-1004", "Northwind", 540], ["INV-1005", "Contoso", 1780]],
          cells: { E1: "Question", F1: "Answer", E2: "Average invoice", E3: "Invoices", E4: "Northwind total" },
          bold: ["E1", "F1"],
          fmt: { C: "currency", F2: "currency", F4: "currency" },
          names: { "Invoices[Amount]": "C2:C6", "Invoices[Customer]": "B2:B6", "Invoices[Invoice]": "A2:A6" },
        },
        steps: [
          task("F2", "Average invoice in **F2** using `Invoices[Amount]`.", "=AVERAGE(Invoices[Amount])", "The reference names the table and the column, so it's clear what's being averaged.", { contains: ["INVOICES[AMOUNT]"], fmt: "currency" }),
          task("F3", "Count the invoices in **F3** using `Invoices[Invoice]`.", "=COUNTA(Invoices[Invoice])", "COUNTA on any text column counts the rows.", { contains: ["INVOICES[INVOICE]"] }),
          task("F4", 'Total for Northwind in **F4**: `=SUMIF(Invoices[Customer],"Northwind",Invoices[Amount])`.', '=SUMIF(Invoices[Customer],"Northwind",Invoices[Amount])', "Structured references work in every function. You'll learn SUMIF fully in the Intermediate level.", { fmt: "currency" }),
        ],
      },
      {
        title: "Lab: Build an Invoice Table",
        kind: "lab",
        desc: "Totals and averages with structured references.",
        learn: `
This range has been converted to a table called **Invoices** (columns Invoice, Date, Customer, Amount). Use structured references for every answer.
`,
        sheet: {
          rows: [
            ["Invoice", "Date", "Customer", "Amount"],
            ["INV-2001", d(2026, 2, 2), "Litware", 980],
            ["INV-2002", d(2026, 2, 5), "Contoso", 1450],
            ["INV-2003", d(2026, 2, 11), "Northwind", 2210],
            ["INV-2004", d(2026, 2, 17), "Contoso", 640],
            ["INV-2005", d(2026, 2, 23), "Fabrikam", 1875],
            ["Total", null, null, null],
          ],
          cells: { F1: "Average invoice", F2: "Largest invoice" },
          bold: ["A7", "F1", "F2"],
          fmt: { B: "date", D: "currency", G1: "currency", G2: "currency" },
          names: { "Invoices[Amount]": "D2:D6", "Invoices[Customer]": "C2:C6", "Invoices[Invoice]": "A2:A6", "Invoices[Date]": "B2:B6" },
        },
        steps: [
          task("D7", "Total Row: sum the visible amounts in **D7** with SUBTOTAL 109.", "=SUBTOTAL(109,Invoices[Amount])", "7,155 in total.", { fmt: "currency" }),
          task("G1", "Average invoice amount in **G1**.", "=AVERAGE(Invoices[Amount])", "1,431 on average.", { contains: ["INVOICES[AMOUNT]"], fmt: "currency" }),
          task("G2", "Largest invoice in **G2**.", "=MAX(Invoices[Amount])", "2,210 from Northwind.", { contains: ["INVOICES[AMOUNT]"], fmt: "currency" }),
        ],
      },
    ],
  },

  {
    id: "b7",
    title: "Beginner Project",
    desc: "Build a monthly expense tracker with everything from the Beginner level.",
    difficulty: "beginner",
    formula: "=Budget-SUM(D2:D11)",
    lessons: [
      {
        title: "Capstone: Monthly Expense Tracker",
        kind: "capstone",
        desc: "Use every beginner skill on one real sheet.",
        learn: `
Build the calculations for a monthly expense tracker. The monthly budget is in a cell named **Budget**.

You'll need SUM, AVERAGE, MAX, MIN, COUNTA, an absolute reference and a named range.
`,
        sheet: {
          rows: [
            ["Date", "Category", "Description", "Amount", "Share"],
            [d(2026, 10, 2), "Rent", "October rent", 1150, null],
            [d(2026, 10, 3), "Groceries", "Supermarket", 84.2, null],
            [d(2026, 10, 5), "Transport", "Bus pass", 55, null],
            [d(2026, 10, 8), "Utilities", "Electricity", 72.35, null],
            [d(2026, 10, 11), "Groceries", "Market", 39.9, null],
            [d(2026, 10, 14), "Fun", "Cinema", 24, null],
            [d(2026, 10, 18), "Groceries", "Supermarket", 91.15, null],
            [d(2026, 10, 21), "Transport", "Taxi", 18.5, null],
            [d(2026, 10, 25), "Utilities", "Internet", 45, null],
            [d(2026, 10, 29), "Fun", "Concert", 60, null],
          ],
          cells: { G1: "Budget", H1: 2000, G3: "Total spent", G4: "Average expense", G5: "Largest", G6: "Smallest", G7: "Expenses", G8: "Left in budget" },
          bold: ["G1", "G3", "G4", "G5", "G6", "G7", "G8"],
          fmt: { A: "date", D: "currency", E: "percentage", H1: "currency", H3: "currency", H4: "currency", H5: "currency", H6: "currency", H8: "currency" },
          names: { Budget: "H1" },
        },
        steps: [
          task("H3", "Total spent in **H3**.", "=SUM(D2:D11)", "1,640.10 spent this month.", { fmt: "currency" }),
          task("H4", "Average expense in **H4**.", "=AVERAGE(D2:D11)", "SUM ÷ 10.", { fmt: "currency" }),
          task("H5", "Largest expense in **H5**.", "=MAX(D2:D11)", "Rent, of course.", { fmt: "currency" }),
          task("H6", "Smallest expense in **H6**.", "=MIN(D2:D11)", "The taxi at 18.50.", { fmt: "currency" }),
          task("H7", "How many expenses? **H7**.", "=COUNTA(C2:C11)", "Ten entries."),
          task("H8", "Budget left in **H8**: the named cell **Budget** minus the total.", "=Budget-SUM(D2:D11)", "2,000 − 1,640.10 = 359.90 left.", { contains: ["BUDGET"], fmt: "currency" }),
          task("E2", "In **E2**, rent's share of total spending: D2 divided by the total in H3 (locked).", "=D2/$H$3", "Locking H3 means the same formula works for every row.", { contains: ["$H$3"], fmt: "percentage" }),
          task("E3", "Groceries' share in **E3**, same locked total.", "=D3/$H$3", "Copy this down and the shares add up to 100%.", { contains: ["$H$3"], fmt: "percentage" }),
        ],
        done: "You've finished the Beginner level. You can enter data, write formulas with absolute references and names, and use tables.",
      },
    ],
  },
];

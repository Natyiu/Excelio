import type { LessonData, LessonDifficulty } from "@/types/excel-learning";
import { buildChapters, task, type LessonSpec } from "./build";

/**
 * Challenges: short real-world scenarios grouped by level, so learners test only
 * the skills they've covered. Built with the same builder as lessons, so every
 * expected answer comes from the formula engine.
 */

const BEGINNER: LessonSpec[] = [
  {
    title: "Q4 Marketing ROI",
    desc: "Work out each channel's profit and the total for the CMO.",
    skills: ["Subtraction", "SUM"],
    learn: "The CMO wants the net profit of three ad channels: revenue minus ad spend, then the total.",
    sheet: {
      rows: [["Channel", "Ad Spend", "Revenue", "Net Profit"], ["Google Ads", 15000, 48000, null], ["LinkedIn", 22000, 65000, null], ["Meta", 12000, 39000, null], ["Total", null, null, null]],
      bold: ["A5"],
      fmt: { B: "currency", C: "currency", D: "currency" },
    },
    steps: [
      task("D2", "Net profit for Google Ads in **D2**.", "=C2-B2", "Revenue − spend: 33,000.", { fmt: "currency" }),
      task("D3", "Net profit for LinkedIn in **D3**.", "=C3-B3", "43,000.", { fmt: "currency" }),
      task("D4", "Net profit for Meta in **D4**.", "=C4-B4", "27,000.", { fmt: "currency" }),
      task("D5", "Total net profit in **D5**.", "=SUM(D2:D4)", "103,000 across all three channels.", { fmt: "currency" }),
    ],
  },
  {
    title: "Coffee Shop Week",
    desc: "Summarise a week of sales: total, average, best and worst day.",
    skills: ["SUM", "AVERAGE", "MAX", "MIN"],
    learn: "The owner wants a quick summary of this week's takings.",
    sheet: {
      rows: [["Day", "Sales"], ["Mon", 420], ["Tue", 385], ["Wed", 460], ["Thu", 510], ["Fri", 690], ["Sat", 820], ["Sun", 610]],
      cells: { D1: "Total", D2: "Average", D3: "Best day", D4: "Worst day" },
      bold: ["D1", "D2", "D3", "D4"],
      fmt: { B: "currency", E: "currency" },
    },
    steps: [
      task("E1", "Total sales for the week in **E1**.", "=SUM(B2:B8)", "3,895 for the week.", { fmt: "currency" }),
      task("E2", "Average daily sales in **E2**.", "=AVERAGE(B2:B8)", "About 556 a day.", { fmt: "currency" }),
      task("E3", "The best day's sales in **E3**.", "=MAX(B2:B8)", "Saturday: 820.", { fmt: "currency" }),
      task("E4", "The worst day's sales in **E4**.", "=MIN(B2:B8)", "Tuesday: 385.", { fmt: "currency" }),
    ],
  },
  {
    title: "Office Supplies Order",
    desc: "Line totals, VAT with a locked rate, and what's left of the budget.",
    skills: ["Multiplication", "Absolute references", "SUM"],
    learn: "You're ordering supplies. VAT is in **G1** and the budget is in **G2**.",
    sheet: {
      rows: [["Item", "Qty", "Price", "Line Total", "VAT"], ["Paper", 10, 4.5, null, null], ["Pens", 24, 0.8, null, null], ["Folders", 15, 1.2, null, null], ["Total", null, null, null, null]],
      cells: { F1: "VAT rate", G1: 0.2, F2: "Budget", G2: 150, F3: "Left" },
      bold: ["A5", "F1", "F2", "F3"],
      fmt: { C: "currency", D: "currency", E: "currency", G1: "percentage", G2: "currency", G3: "currency" },
    },
    steps: [
      task("D2", "Line total for paper in **D2**: Qty × Price.", "=B2*C2", "10 × 4.50 = 45.", { fmt: "currency" }),
      task("D3", "Line total for pens in **D3**.", "=B3*C3", "19.20.", { fmt: "currency" }),
      task("D4", "Line total for folders in **D4**.", "=B4*C4", "18.", { fmt: "currency" }),
      task("E2", "VAT on paper in **E2**, using the rate in G1 (lock it).", "=D2*$G$1", "9.00.", { contains: ["$G$1"], fmt: "currency" }),
      task("D5", "Order total in **D5**.", "=SUM(D2:D4)", "82.20.", { fmt: "currency" }),
      task("G3", "Budget left in **G3**.", "=G2-D5", "67.80 left.", { fmt: "currency" }),
    ],
  },
  {
    title: "Team Timesheet",
    desc: "Total and average hours, and how many people logged time.",
    skills: ["SUM", "AVERAGE", "COUNTA"],
    learn: "Five people logged hours this week. Fill in the summary.",
    sheet: {
      rows: [["Name", "Mon", "Tue", "Wed", "Thu", "Fri", "Total"], ["Ana", 8, 8, 7, 9, 6, null], ["Ben", 6, 7, 8, 8, 8, null], ["Cy", 9, 9, 8, 7, 5, null], ["Dee", 7, 6, 6, 8, 7, null], ["Eli", 8, 8, 8, 8, 8, null]],
      cells: { I1: "People", I2: "Team hours", I3: "Average per person" },
      bold: ["I1", "I2", "I3"],
    },
    steps: [
      task("G2", "Ana's total hours in **G2**.", "=SUM(B2:F2)", "38 hours."),
      task("G3", "Ben's total in **G3**.", "=SUM(B3:F3)", "37 hours."),
      task("J1", "How many people logged hours? **J1**.", "=COUNTA(A2:A6)", "5 people."),
      task("J2", "Total team hours (all days, all people) in **J2**.", "=SUM(B2:F6)", "SUM works on a whole block: 187 hours."),
      task("J3", "Average hours per person in **J3**.", "=J2/J1", "187 ÷ 5 = 37.4."),
    ],
  },
  {
    title: "Gym Membership Revenue",
    desc: "Revenue per plan and each plan's share of the total.",
    skills: ["Multiplication", "SUM", "Absolute references"],
    learn: "Work out monthly revenue for each membership plan, then each plan's share.",
    sheet: {
      rows: [["Plan", "Members", "Fee", "Revenue", "Share"], ["Basic", 320, 25, null, null], ["Plus", 180, 40, null, null], ["Premium", 60, 70, null, null], ["Total", null, null, null, null]],
      bold: ["A5"],
      fmt: { C: "currency", D: "currency", E: "percentage" },
    },
    steps: [
      task("D2", "Basic revenue in **D2**.", "=B2*C2", "8,000.", { fmt: "currency" }),
      task("D3", "Plus revenue in **D3**.", "=B3*C3", "7,200.", { fmt: "currency" }),
      task("D4", "Premium revenue in **D4**.", "=B4*C4", "4,200.", { fmt: "currency" }),
      task("D5", "Total revenue in **D5**.", "=SUM(D2:D4)", "19,400.", { fmt: "currency" }),
      task("E2", "Basic's share of the total in **E2** (lock the total).", "=D2/$D$5", "About 41%.", { contains: ["$D$5"], fmt: "percentage" }),
    ],
  },
];

const INTERMEDIATE: LessonSpec[] = [
  {
    title: "Sales Commission Run",
    desc: "Pay commission only to reps who hit target, then summarise by region.",
    skills: ["IF", "SUMIFS", "COUNTIFS"],
    learn: "Reps earn 5% commission (rate in **H1**) only if they hit their target.",
    sheet: {
      rows: [["Rep", "Region", "Sales", "Target", "Commission"], ["Ava", "North", 48000, 45000, null], ["Ben", "South", 39000, 45000, null], ["Cleo", "North", 51500, 45000, null], ["Dev", "West", 45000, 45000, null], ["Eli", "South", 52500, 50000, null]],
      cells: { G1: "Rate", H1: 0.05, G3: "North sales", G4: "Reps on target" },
      bold: ["G1", "G3", "G4"],
      fmt: { C: "currency", D: "currency", E: "currency", H1: "percentage", H3: "currency" },
    },
    steps: [
      task("E2", "Ava's commission in **E2**: Sales × rate if she hit target, else 0.", "=IF(C2>=D2,C2*$H$1,0)", "2,400.", { fmt: "currency", contains: ["$H$1"] }),
      task("E3", "Ben's commission in **E3**.", "=IF(C3>=D3,C3*$H$1,0)", "Missed target: 0.", { fmt: "currency" }),
      task("H3", "Total North sales in **H3** with SUMIFS.", '=SUMIFS(C2:C6,B2:B6,"North")', "99,500.", { fmt: "currency" }),
      task("H4", "How many reps hit target? **H4**. (Tip: compare row by row with SUMPRODUCT.)", "=SUMPRODUCT(--(C2:C6>=D2:D6))", "Ava, Cleo, Dev and Eli: 4.", { fns: ["SUMPRODUCT"] }),
    ],
  },
  {
    title: "Exam Results",
    desc: "Grades with IFS, the class average, pass count and rankings.",
    skills: ["IFS", "AVERAGE", "COUNTIF", "RANK.EQ"],
    learn: "Grade bands: 85+ A, 70+ B, 50+ C, otherwise F. The pass mark is 50.",
    sheet: {
      rows: [["Student", "Score", "Grade", "Rank"], ["Amira", 91, null, null], ["Ben", 64, null, null], ["Carlos", 47, null, null], ["Dina", 78, null, null], ["Ethan", 85, null, null]],
      cells: { F1: "Class average", F2: "Passed" },
      bold: ["F1", "F2"],
    },
    steps: [
      task("C2", "Amira's grade in **C2** with IFS.", '=IFS(B2>=85,"A",B2>=70,"B",B2>=50,"C",TRUE,"F")', "A."),
      task("C4", "Carlos's grade in **C4**.", '=IFS(B4>=85,"A",B4>=70,"B",B4>=50,"C",TRUE,"F")', "F."),
      task("G1", "Class average in **G1**.", "=AVERAGE(B2:B6)", "73."),
      task("G2", "How many passed (50 or more)? **G2**.", '=COUNTIF(B2:B6,">=50")', "4 students."),
      task("D5", "Dina's rank in **D5**, highest = 1.", "=RANK.EQ(B5,$B$2:$B$6)", "3rd.", { contains: ["$B$2:$B$6"] }),
    ],
  },
  {
    title: "Price Check",
    desc: "Look up prices, total an order and round the tax.",
    skills: ["XLOOKUP", "ROUND"],
    learn: "The price list is in **F1:G6**. Fill in the order using lookups.",
    sheet: {
      rows: [["Product", "Qty", "Price", "Total"], ["Mouse", 3, null, null], ["Monitor", 1, null, null], ["Webcam", 2, null, null], ["Speaker", 1, null, null]],
      cells: { F1: "Product", G1: "Price", F2: "Mouse", G2: 24.99, F3: "Keyboard", G3: 49.5, F4: "Monitor", G4: 189, F5: "Webcam", G5: 64.75, F6: "Headset", G6: 79, I1: "Tax (7.5%)" },
      bold: ["F1", "G1", "I1"],
      fmt: { C: "currency", D: "currency", G: "currency", J1: "currency" },
    },
    steps: [
      task("C2", "Price of a mouse in **C2** with XLOOKUP.", "=XLOOKUP(A2,$F$2:$F$6,$G$2:$G$6)", "24.99.", { fmt: "currency" }),
      task("C5", 'Price of a speaker in **C5**. It isn\'t on the list, so show `"N/A"`.', '=XLOOKUP(A5,$F$2:$F$6,$G$2:$G$6,"N/A")', "if_not_found handles missing products."),
      task("D2", "Line total for mice in **D2**.", "=B2*C2", "74.97.", { fmt: "currency" }),
      task("J1", "Tax on the mice line (D2) at 7.5%, rounded to cents, in **J1**.", "=ROUND(D2*7.5%,2)", "5.62.", { fmt: "currency" }),
    ],
  },
  {
    title: "Customer Orders",
    desc: "Totals per customer, the biggest order, and a sorted customer list.",
    skills: ["SUMIFS", "MAXIFS", "SORT", "UNIQUE"],
    learn: "Summarise this order log for the account managers.",
    sheet: {
      rows: [["Customer", "Order", "Amount"], ["Contoso", "SO-1", 1250], ["Litware", "SO-2", 860], ["Contoso", "SO-3", 2400], ["Fabrikam", "SO-4", 540], ["Litware", "SO-5", 1780], ["Contoso", "SO-6", 320]],
      cells: { E1: "Contoso total", E2: "Biggest Litware order", E4: "Customers" },
      bold: ["E1", "E2", "E4"],
      fmt: { C: "currency", F1: "currency", F2: "currency" },
    },
    steps: [
      task("F1", "Contoso's total in **F1**.", '=SUMIFS(C2:C7,A2:A7,"Contoso")', "3,970.", { fmt: "currency" }),
      task("F2", "Litware's biggest order in **F2** with MAXIFS.", '=MAXIFS(C2:C7,A2:A7,"Litware")', "1,780.", { fmt: "currency" }),
      task("E5", "A sorted list of customers, each once, in **E5**.", "=SORT(UNIQUE(A2:A7))", "Contoso, Fabrikam, Litware.", { spill: true }),
    ],
  },
  {
    title: "Stock Check",
    desc: "Flag items to reorder and count them.",
    skills: ["IF", "COUNTIF", "IFERROR"],
    learn: "An item needs reordering when its stock is below its reorder level.",
    sheet: {
      rows: [["Item", "Stock", "Reorder at", "Action", "Weeks left"], ["Cables", 40, 50, null, null], ["Chargers", 120, 60, null, null], ["Adapters", 15, 30, null, null], ["Stands", 0, 10, null, null]],
      cells: { G1: "Weekly sales", H1: 20, G3: "Items to reorder" },
      bold: ["G1", "G3"],
    },
    steps: [
      task("D2", 'In **D2**, show "Reorder" if stock is below the reorder level, otherwise "OK".', '=IF(B2<C2,"Reorder","OK")', "Reorder."),
      task("D3", "Same check for chargers in **D3**.", '=IF(B3<C3,"Reorder","OK")', "OK."),
      task("H3", 'How many items need reordering? **H3**. (Count stock below the reorder level row by row with SUMPRODUCT.)', "=SUMPRODUCT(--(B2:B5<C2:C5))", "3 items.", { fns: ["SUMPRODUCT"] }),
      task("E5", "Weeks of stock left for stands in **E5**: stock ÷ weekly sales in H1, shown as 0 if there's an error.", "=IFERROR(B5/$H$1,0)", "0 left."),
    ],
  },
];

const ADVANCED: LessonSpec[] = [
  {
    title: "Regional Deal Filter",
    desc: "Filter big deals for one region, sorted, then the top three.",
    skills: ["FILTER", "SORT", "TAKE"],
    learn: "Pull the deals your regional manager asked for. The region is in **G1**.",
    sheet: {
      rows: [["Rep", "Region", "Product", "Revenue"], ["Ava", "North", "Laptop", 5250], ["Ben", "South", "Tablet", 3920], ["Ava", "North", "Phone", 8280], ["Cleo", "East", "Laptop", 3150], ["Dev", "North", "Tablet", 4900], ["Ben", "South", "Phone", 4830], ["Cleo", "North", "Phone", 6210], ["Dev", "West", "Laptop", 6300]],
      cells: { F1: "Region", G1: "North" },
      bold: ["F1"],
      editable: ["G1"],
      fmt: { D: "currency" },
    },
    steps: [
      task("F3", "In **F3**, FILTER the deals for the region in G1 with revenue over 5,000, sorted by revenue highest first.", "=SORT(FILTER(A2:D9,(B2:B9=G1)*(D2:D9>5000)),4,-1)", "Three North deals over 5,000.", { spill: true }),
      task("K3", "In **K3**, the names of the top 3 reps by revenue across all regions (A2:A9 sorted by D2:D9), with TAKE.", "=TAKE(SORTBY(A2:A9,D2:D9,-1),3)", "Ava, Dev, Cleo.", { spill: true }),
    ],
  },
  {
    title: "Shipping Rate Matrix",
    desc: "A two-way lookup across zones and weights.",
    skills: ["XLOOKUP", "Nested lookups"],
    learn: "Find the shipping cost for the zone in **G1** and the weight band in **G2**.",
    sheet: {
      rows: [["Zone", "Up to 1kg", "Up to 5kg", "Up to 10kg"], ["Local", 4.5, 7.9, 12.5], ["National", 6.9, 11.5, 18], ["Europe", 12.5, 24, 39], ["World", 19.9, 38, 65]],
      cells: { F1: "Zone", G1: "Europe", F2: "Band", G2: "Up to 5kg", F4: "Cost", F5: "Cost (INDEX/XMATCH)" },
      bold: ["F1", "F2", "F4", "F5"],
      editable: ["G1", "G2"],
      fmt: { B: "currency", C: "currency", D: "currency", G4: "currency", G5: "currency" },
    },
    steps: [
      task("G4", "The cost in **G4** with nested XLOOKUPs.", "=XLOOKUP(G1,A2:A5,XLOOKUP(G2,B1:D1,B2:D5))", "Europe, up to 5kg: 24.", { fmt: "currency" }),
      task("G5", "The same cost in **G5** with INDEX and two XMATCHes.", "=INDEX(B2:D5,XMATCH(G1,A2:A5),XMATCH(G2,B1:D1))", "24 again.", { fmt: "currency" }),
    ],
  },
  {
    title: "Agent Quarter Lookup",
    desc: "Look up a value that needs two matching columns.",
    skills: ["XLOOKUP", "Multiple criteria", "TEXTJOIN"],
    learn: "Agent names repeat across quarters, so a lookup needs both the agent (**G1**) and the quarter (**G2**).",
    sheet: {
      rows: [["Agent", "Quarter", "Sales"], ["Bradley Witt", "Q1", 18200], ["Tom Bruce", "Q1", 22100], ["Bradley Witt", "Q2", 19800], ["Tom Bruce", "Q2", 20400], ["Bradley Witt", "Q3", 24500], ["Tom Bruce", "Q3", 17900]],
      cells: { F1: "Agent", G1: "Bradley Witt", F2: "Quarter", G2: "Q3", F4: "Sales", F5: "All quarters" },
      bold: ["F1", "F2", "F4", "F5"],
      editable: ["G1", "G2"],
      fmt: { C: "currency", G4: "currency" },
    },
    steps: [
      task("G4", "Sales for the agent and quarter in **G4**, matching both columns.", "=XLOOKUP(1,(A2:A7=G1)*(B2:B7=G2),C2:C7)", "24,500.", { fmt: "currency" }),
      task("G5", 'Every quarter the agent in G1 sold in, in one cell separated by ", ", in **G5**.', '=TEXTJOIN(", ",TRUE,FILTER(B2:B7,A2:A7=G1))', "Q1, Q2, Q3."),
    ],
  },
  {
    title: "Bonus Pool with LET",
    desc: "A readable bonus calculation using named steps.",
    skills: ["LET", "IF"],
    learn: "The bonus pool is 5% of total sales if they beat **200,000**, otherwise 2%. Write it once, readably.",
    sheet: {
      rows: [["Month", "Sales"], ["Jan", 41000], ["Feb", 38500], ["Mar", 45200], ["Apr", 39900], ["May", 47300], ["Jun", 44100]],
      cells: { D1: "Bonus pool", D2: "Months above average" },
      bold: ["D1", "D2"],
      fmt: { B: "currency", E1: "currency" },
    },
    steps: [
      task("E1", "In **E1**, use LET to name the total and the rate, then return total × rate.", "=LET(total,SUM(B2:B7),rate,IF(total>200000,5%,2%),total*rate)", "12,800.", { fmt: "currency", fns: ["LET"] }),
      task("E2", "In **E2**, use LET to name the average, then count the months above it.", '=LET(avg,AVERAGE(B2:B7),COUNTIF(B2:B7,">"&avg))', "3 months.", { fns: ["LET", "COUNTIF"] }),
    ],
  },
  {
    title: "Combine Two Years",
    desc: "Stack two years of invoices and total by customer.",
    skills: ["VSTACK", "SUMIFS", "CHOOSECOLS"],
    learn: "Invoices for two years sit side by side. Combine them into one list, then total Contoso across both.",
    sheet: {
      rows: [["2025 Customer", "Amount", null, "2026 Customer", "Amount"], ["Contoso", 1200, null, "Litware", 950], ["Fabrikam", 860, null, "Contoso", 1430], ["Litware", 2210, null, "Contoso", 640]],
      cells: { G1: "Combined", J1: "Contoso total" },
      bold: ["G1", "J1"],
      fmt: { B: "currency", E: "currency", K1: "currency" },
    },
    steps: [
      task("G2", "In **G2**, stack both years (A2:B4 and D2:E4) into one list.", "=VSTACK(A2:B4,D2:E4)", "Six invoices in one table.", { spill: true }),
      task("K1", "Contoso's total across both years in **K1**, using the stacked list in G2#.", '=SUMIFS(CHOOSECOLS(G2#,2),CHOOSECOLS(G2#,1),"Contoso")', "3,270.", { fmt: "currency" }),
    ],
  },
];

const SPECS: Record<LessonDifficulty, LessonSpec[]> = {
  beginner: BEGINNER,
  intermediate: INTERMEDIATE,
  advanced: ADVANCED,
};

const LABEL: Record<LessonDifficulty, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export const CHALLENGES: Record<LessonDifficulty, LessonData[]> = Object.fromEntries(
  (Object.keys(SPECS) as LessonDifficulty[]).map((level) => {
    const [set] = buildChapters([
      {
        id: `ch-${level}`,
        title: `${LABEL[level]} challenges`,
        desc: "",
        difficulty: level,
        formula: "",
        lessons: SPECS[level].map((s) => ({ ...s, kind: "lab" as const })),
      },
    ]);
    return [level, set!.lessons];
  })
) as Record<LessonDifficulty, LessonData[]>;

/** The featured challenge for a level today; the same all day, a different one tomorrow. */
export function todaysChallenge(level: LessonDifficulty, date = new Date()): LessonData {
  const list = CHALLENGES[level];
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return list[day % list.length]!;
}

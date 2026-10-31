import { describe, expect, it } from "vitest";
import type { WorksheetData } from "@/types/excel-learning";
import { parseCellInput, recalcSheet } from "@/lib/formula-engine";

/** Build a sheet from rows starting at A1, run a formula in `at`, return the recalculated cells. */
function sheet(rows: Array<Array<string | number | null>>, formulas: Record<string, string> = {}, names: Record<string, string> = {}) {
  const cells: WorksheetData = {};
  rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === null) return;
      const id = String.fromCharCode(65 + c) + (r + 1);
      cells[id] = { id, value: parseCellInput(String(v)) };
    }),
  );
  for (const [id, f] of Object.entries(formulas)) cells[id] = { id, value: parseCellInput(f) };
  return recalcSheet(cells, names);
}
const val = (cells: WorksheetData, id: string) => cells[id]?.value.error ?? cells[id]?.value.computed ?? null;
function calc(rows: Array<Array<string | number | null>>, formula: string, names: Record<string, string> = {}) {
  return val(sheet(rows, { Z1: formula }, names), "Z1");
}

const sales = [
  ["Rep", "Region", "Sales"],
  ["Ava", "North", 48000],
  ["Ben", "South", 39000],
  ["Cleo", "North", 51500],
  ["Dev", "West", 45000],
];

describe("basics", () => {
  it("respects operator precedence", () => {
    expect(calc([], "=2+3*4")).toBe(14);
    expect(calc([], "=(2+3)*4")).toBe(20);
    expect(calc([], "=-2^2")).toBe(4);
    expect(calc([], "=10%*200+1")).toBe(21);
  });
  it("handles absolute references and ranges", () => {
    expect(calc([[1000, 0.08]], "=A1*$B$1")).toBe(80);
    expect(calc(sales, "=SUM($C$2:$C$5)")).toBe(183500);
    expect(calc(sales, "=SUM(C:C)")).toBe(183500);
  });
  it("counts like Excel", () => {
    expect(calc(sales, "=COUNT(A1:A5)")).toBe(0);
    expect(calc(sales, "=COUNTA(A2:A5)")).toBe(4);
    expect(calc(sales, "=COUNT(C1:C5)")).toBe(4);
  });
  it("supports named ranges and Table[Column]", () => {
    expect(calc(sales, "=SUM(Sales)", { Sales: "C2:C5" })).toBe(183500);
    expect(calc(sales, "=AVERAGE(tblSales[Sales])", { "tblSales[Sales]": "C2:C5" })).toBe(45875);
  });
});

describe("logic and conditional aggregation", () => {
  it("IF / IFS / SWITCH", () => {
    expect(calc(sales, '=IF(C2>=45000,"Yes","No")')).toBe("Yes");
    expect(calc([[83]], '=IFS(A1>=90,"A",A1>=75,"B",TRUE,"F")')).toBe("B");
    expect(calc([["S"]], '=SWITCH(A1,"N","North","S","South","?")')).toBe("South");
  });
  it("SUMIFS / COUNTIFS / MAXIFS", () => {
    expect(calc(sales, '=SUMIFS(C2:C5,B2:B5,"North")')).toBe(99500);
    expect(calc(sales, '=COUNTIFS(B2:B5,"North",C2:C5,">50000")')).toBe(1);
    expect(calc(sales, '=COUNTIF(C2:C5,">="&45000)')).toBe(3);
    expect(calc(sales, '=MAXIFS(C2:C5,B2:B5,"North")')).toBe(51500);
    expect(calc(sales, '=COUNTIF(A2:A5,"C*")')).toBe(1);
  });
  it("IFERROR / IFNA", () => {
    expect(calc([[5, 0]], "=IFERROR(A1/B1,0)")).toBe(0);
    expect(calc(sales, '=IFNA(VLOOKUP("Zed",A2:C5,3,FALSE),"Not found")')).toBe("Not found");
  });
});

describe("lookups", () => {
  it("VLOOKUP exact and approximate", () => {
    expect(calc(sales, '=VLOOKUP("Cleo",A2:C5,3,FALSE)')).toBe(51500);
    const bands = [[0, "F"], [50, "C"], [75, "B"], [90, "A"]];
    expect(calc(bands, "=VLOOKUP(83,A1:B4,2,TRUE)")).toBe("B");
    expect(calc(bands, "=VLOOKUP(49,A1:B4,2)")).toBe("F");
  });
  it("INDEX/MATCH, XLOOKUP, XMATCH", () => {
    expect(calc(sales, '=INDEX(A2:A5,MATCH(51500,C2:C5,0))')).toBe("Cleo");
    expect(calc(sales, '=XLOOKUP("Dev",A2:A5,B2:B5,"none")')).toBe("West");
    expect(calc(sales, '=XLOOKUP("Zed",A2:A5,B2:B5,"none")')).toBe("none");
    expect(calc(sales, '=XLOOKUP("North",B2:B5,A2:A5,,0,-1)')).toBe("Cleo");
    expect(calc(sales, '=XLOOKUP(1,(B2:B5="North")*(C2:C5>50000),A2:A5)')).toBe("Cleo");
    expect(calc(sales, '=XMATCH("Ben",A2:A5)')).toBe(2);
    expect(calc(sales, '=XLOOKUP("Ben"&"South",A2:A5&B2:B5,C2:C5)')).toBe(39000);
  });
  it("XLOOKUP returning several columns spills", () => {
    const out = sheet(sales, { F2: '=XLOOKUP("Ben",A2:A5,B2:C5)' });
    expect(val(out, "F2")).toBe("South");
    expect(val(out, "G2")).toBe(39000);
  });
});

describe("dynamic arrays", () => {
  it("spills and reports #SPILL!", () => {
    const out = sheet(sales, { E2: "=C2:C5*2" });
    expect(val(out, "E5")).toBe(90000);
    expect(out.E2?.value.spillRange).toBe("E2:E5");
    const blocked = sheet([...sales.map((r) => [...r, null, null]), [null, null, null, null, "x"]], { E2: "=C2:C6*2" });
    expect(val(blocked, "E2")).toBe("#SPILL!");
    expect(val(sheet(sales, { E2: "=C2:C5*2", F1: "=SUM(E2#)" }), "F1")).toBe(367000);
  });
  it("UNIQUE / SORT / SORTBY / FILTER", () => {
    expect(calc(sales, "=COUNTA(UNIQUE(B2:B5))")).toBe(3);
    expect(calc(sales, "=ROWS(UNIQUE(B2:B5,,TRUE))")).toBe(2);
    const sorted = sheet(sales, { E2: "=SORT(A2:C5,3,-1)" });
    expect(val(sorted, "E2")).toBe("Cleo");
    expect(val(sorted, "E5")).toBe("Ben");
    expect(val(sheet(sales, { E2: "=SORTBY(A2:A5,C2:C5,1)" }), "E2")).toBe("Ben");
    const f = sheet(sales, { E2: '=FILTER(A2:A5,(B2:B5="North")+(B2:B5="West"),"None")' });
    expect([val(f, "E2"), val(f, "E3"), val(f, "E4")]).toEqual(["Ava", "Cleo", "Dev"]);
    expect(calc(sales, '=FILTER(A2:A5,B2:B5="East","None")')).toBe("None");
    expect(calc(sales, '=ROWS(FILTER(A2:A5,(B2:B5="North")-(C2:C5>50000)))')).toBe(1);
    expect(calc(sales, '=ROWS(FILTER(A2:A5,(B2:B5="North")=(C2:C5>46000)))')).toBe(4);
  });
  it("SEQUENCE, TAKE, CHOOSECOLS, LARGE with arrays", () => {
    expect(calc([], "=SUM(SEQUENCE(10))")).toBe(55);
    expect(calc(sales, "=SUM(TAKE(SORT(C2:C5,1,-1),2))")).toBe(99500);
    expect(calc(sales, "=SUM(LARGE(C2:C5,{1,2,3}))")).toBe(144500);
    expect(val(sheet(sales, { E2: "=CHOOSECOLS(A2:C5,3)" }), "E3")).toBe(39000);
  });
  it("LET and LAMBDA", () => {
    expect(calc(sales, "=LET(t,SUM(C2:C5),r,IF(t>100000,5%,2%),t*r)")).toBe(9175);
    expect(calc([], "=LAMBDA(p,r,p*(1+r))(100,0.2)")).toBe(120);
    expect(calc([[212]], "=FTOC(A1)", { FTOC: "=LAMBDA(f,(f-32)*5/9)" })).toBe(100);
    expect(calc([["INV-Gramazon-2291"]], '=TEXTBEFORE(TEXTAFTER(A1,"-"),"-")')).toBe("Gramazon");
  });
});

describe("statistics and rounding", () => {
  const scores = [[72], [85], [72], [90], [64], [85], [72], [58]];
  it("median, mode, rank", () => {
    expect(calc(scores, "=MEDIAN(A1:A8)")).toBe(72);
    expect(calc(scores, "=MODE.SNGL(A1:A8)")).toBe(72);
    expect(calc(scores, "=RANK.EQ(A2,$A$1:$A$8)")).toBe(2);
    expect(calc(scores, "=RANK.AVG(A1,$A$1:$A$8)")).toBe(5);
    expect(calc(scores, "=RANK.EQ(A8,$A$1:$A$8,1)")).toBe(1);
  });
  it("subtotal and aggregate", () => {
    expect(val(sheet(scores, { A9: "=SUBTOTAL(9,A1:A8)", A10: "=SUBTOTAL(9,A1:A9)" }), "A10")).toBe(598);
    expect(val(sheet([[1], ["#N/A"], [3]], { A2: "=NA()", B1: "=AGGREGATE(9,6,A1:A3)" }), "B1")).toBe(4);
  });
  it("rounding family", () => {
    expect(calc([], "=ROUND(4567,-2)")).toBe(4600);
    expect(calc([], "=ROUND(2.5,0)")).toBe(3);
    expect(calc([], "=ROUNDUP(1234.561,1)")).toBe(1234.6);
    expect(calc([], "=MROUND(7.19,0.2)")).toBe(7.2);
    expect(calc([], "=CEILING.MATH(12.34,0.25)")).toBe(12.5);
    expect(calc([], "=FLOOR.MATH(12.34,0.25)")).toBe(12.25);
    expect(calc([], "=MROUND(51234+614.81,100)")).toBe(51800);
  });
  it("dates and text", () => {
    expect(calc([], "=YEAR(DATE(2026,3,15))")).toBe(2026);
    expect(calc([], '=TEXT(DATE(2026,3,15),"mmm d")')).toBe("Mar 15");
    expect(calc([], "=MONTH(EOMONTH(DATE(2026,1,15),1))")).toBe(2);
    expect(calc([["  maria   LOPEZ "]], "=PROPER(TRIM(A1))")).toBe("Maria Lopez");
    expect(calc([], '=TEXTJOIN(", ",TRUE,"a","","b")')).toBe("a, b");
  });
});

describe("TEXT custom formats", () => {
  it("uses positive;negative;zero sections", () => {
    expect(calc([], '=TEXT(20,"▲ 0;▼ 0;0")')).toBe("▲ 20");
    expect(calc([], '=TEXT(-40,"▲ 0;▼ 0;0")')).toBe("▼ 40");
    expect(calc([], '=TEXT(0,"[Color10]▲ 0;[Red]▼ 0;""–""")')).toBe("–");
    expect(calc([], '=TEXT(1234.5,"$#,##0.00")')).toBe("$1,234.50");
    expect(calc([], '=TEXT(0.256,"0%")')).toBe("26%");
    expect(calc([], '=TEXT(42,"""ID-""00000")')).toBe("ID-00042");
  });
});

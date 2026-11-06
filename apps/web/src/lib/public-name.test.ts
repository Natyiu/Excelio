import { describe, expect, it } from "vitest";
import { publicName } from "./public-name";

describe("publicName", () => {
  it("shortens the last name to an initial", () => {
    expect(publicName("Cheryl Reilly")).toBe("Cheryl R.");
    expect(publicName("  Mary Jane  watson ")).toBe("Mary W.");
  });
  it("keeps a single name", () => {
    expect(publicName("Natnael")).toBe("Natnael");
  });
  it("never shows an email used as a name", () => {
    expect(publicName("someone@example.com")).toBe("Learner");
    expect(publicName("Cheryl cheryl@example.com")).toBe("Learner");
  });
  it("handles an empty name", () => {
    expect(publicName("   ")).toBe("Learner");
  });
});

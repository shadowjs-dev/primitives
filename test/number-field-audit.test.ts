import { describe, expect, it } from "vitest";
import { createNumberFormatter } from "../src/number-field/number";

describe("[NUM-AUD-1] a number the formatter wrote is read back", () => {
  it("[NUM-AUD-1.1] a unit whose name holds a space (pl-PL celsius, ur-PK kilometer) is removed before the digits are read", () => {
    const polish = createNumberFormatter("pl-PL", { style: "unit", unit: "celsius" });
    expect(polish.format(1234.5)).toBe("1234,5 st. C");
    expect(polish.parse(polish.format(1234.5))).toBe(1234.5);
    expect(polish.parse("-3 st. C")).toBe(-3);
    const urdu = createNumberFormatter("ur-PK", { style: "unit", unit: "kilometer" });
    expect(urdu.parse(urdu.format(1234.5))).toBe(1234.5);
  });
});

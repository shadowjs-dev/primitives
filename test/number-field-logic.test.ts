import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createNumberFormatter,
  DEFAULT_LOCALE,
  formatNumber,
  parseNumber,
} from "../src/number-field/number";
import { createRepeater, REPEAT_DELAY, REPEAT_INTERVAL } from "../src/number-field/repeater";
import { addDecimal, settleValue, stepValue } from "../src/number-field/step";

const SEED = { seed: 42 };
const LOCALES = ["en-US", "de-DE", "ar-EG", "fr-FR"] as const;

describe("formatNumber", () => {
  it("[NUM-L01] groups and separates the way each locale does", () => {
    expect(formatNumber(1234567.5, "en-US")).toBe("1,234,567.5");
    expect(formatNumber(1234567.5, "de-DE")).toBe("1.234.567,5");
    expect(formatNumber(1234567.5, "fr-FR").replace(/\s/gu, " ")).toBe("1 234 567,5");
    expect(formatNumber(1234.5, "ar-EG")).toMatch(/^[٠-٩٫٬]+$/u);
  });

  it("[NUM-L02] the default locale is fixed so server and client agree", () => {
    expect(DEFAULT_LOCALE).toBe("en-US");
    expect(formatNumber(1234.5)).toBe("1,234.5");
  });

  it("[NUM-L03] NaN formats as empty text; options apply", () => {
    expect(formatNumber(Number.NaN)).toBe("");
    expect(formatNumber(5, "en-US", { minimumFractionDigits: 2 })).toBe("5.00");
    expect(formatNumber(0.256, "en-US", { style: "percent" })).toBe("26%");
    expect(formatNumber(12, "en-US", { style: "currency", currency: "USD" })).toBe("$12.00");
  });
});

describe("parseNumber", () => {
  it("[NUM-L10] reads each locale's separators", () => {
    expect(parseNumber("1,234,567.5", "en-US")).toBe(1234567.5);
    expect(parseNumber("1.234.567,5", "de-DE")).toBe(1234567.5);
    expect(parseNumber("1 234 567,5", "fr-FR")).toBe(1234567.5);
    expect(parseNumber("1 234 567,5", "fr-FR")).toBe(1234567.5);
    expect(parseNumber("1 234,5", "fr-FR")).toBe(1234.5);
  });

  it("[NUM-L11] reads Arabic-Indic, Persian and fullwidth digits in any locale", () => {
    expect(parseNumber("١٢٣٫٥", "ar-EG")).toBe(123.5);
    expect(parseNumber("١٬٢٣٤٫٥", "ar-EG")).toBe(1234.5);
    expect(parseNumber("۱۲۳", "en-US")).toBe(123);
    expect(parseNumber("１２３", "en-US")).toBe(123);
    expect(parseNumber("१२", "en-US")).toBe(12);
  });

  it("[NUM-L12] understands every minus: hyphen, Unicode minus, bidi-wrapped, trailing, accounting", () => {
    expect(parseNumber("-5", "en-US")).toBe(-5);
    expect(parseNumber("−5", "en-US")).toBe(-5);
    expect(parseNumber("؜-٥", "ar-EG")).toBe(-5);
    expect(parseNumber("‎-5", "en-US")).toBe(-5);
    expect(parseNumber("5-", "en-US")).toBe(-5);
    expect(parseNumber("(12.5)", "en-US")).toBe(-12.5);
    expect(parseNumber("+5", "en-US")).toBe(5);
    expect(parseNumber("-0", "en-US")).toBe(0);
    expect(Object.is(parseNumber("-0", "en-US"), 0)).toBe(true);
  });

  it("[NUM-L13] strips percent signs, currency symbols and units; percent divides by 100", () => {
    expect(parseNumber("50%", "en-US", { style: "percent" })).toBe(0.5);
    expect(parseNumber("50", "en-US", { style: "percent" })).toBe(0.5);
    expect(parseNumber("12,5 %", "fr-FR", { style: "percent" })).toBe(0.125);
    expect(parseNumber("0.07%", "en-US", { style: "percent" })).toBe(0.0007);
    expect(parseNumber("$1,234.50", "en-US", { style: "currency", currency: "USD" })).toBe(1234.5);
    expect(parseNumber("-$5.00", "en-US", { style: "currency", currency: "USD" })).toBe(-5);
    expect(parseNumber("1.234,50 €", "de-DE", { style: "currency", currency: "EUR" })).toBe(1234.5);
    expect(parseNumber("12 kg", "en-US", { style: "unit", unit: "kilogram" })).toBe(12);
    expect(
      parseNumber("2 hours", "en-US", { style: "unit", unit: "hour", unitDisplay: "long" }),
    ).toBe(2);
  });

  it("[NUM-L14] accepts '.' and ',' as the decimal separator when the locale does not group with them", () => {
    expect(parseNumber("1.5", "fr-FR")).toBe(1.5);
    expect(parseNumber("1,5", "fr-FR")).toBe(1.5);
    expect(parseNumber("1,5", "ar-EG")).toBe(1.5);
    expect(parseNumber("1.5", "ar-EG")).toBe(1.5);
    // 'en-US' groups with ',' and 'de-DE' with '.': there those characters stay group separators.
    expect(parseNumber("1,5", "en-US")).toBe(15);
    expect(parseNumber("1.500", "de-DE")).toBe(1500);
  });

  it("[NUM-L15] rejects empty, partial and garbage text", () => {
    for (const text of [
      "",
      "  ",
      "-",
      ".",
      "abc",
      "1a",
      "1..2",
      "1.2.3",
      "--5",
      "5-5",
      "1e5x",
      "$",
    ]) {
      expect(parseNumber(text, "en-US")).toBeNull();
    }
    expect(parseNumber("1.2,3", "fr-FR")).toBeNull();
  });

  it("[NUM-L16] leading and trailing decimals and surrounding space", () => {
    expect(parseNumber(" .5 ", "en-US")).toBe(0.5);
    expect(parseNumber("5.", "en-US")).toBe(5);
    expect(parseNumber("007", "en-US")).toBe(7);
    expect(parseNumber("1 2 3", "en-US")).toBe(123);
  });
});

describe("format then parse", () => {
  const fractionDigits = fc.integer({ min: 0, max: 4 });
  const mantissa = fc.integer({ min: -999_999_999, max: 999_999_999 });

  it("[NUM-L20] round-trips decimals in en-US, de-DE, ar-EG and fr-FR within the fraction digits", () => {
    fc.assert(
      fc.property(fc.constantFrom(...LOCALES), mantissa, fractionDigits, (locale, n, digits) => {
        const value = n / 10 ** digits;
        const formatter = createNumberFormatter(locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: digits,
        });
        expect(formatter.parse(formatter.format(value))).toBe(value);
      }),
      SEED,
    );
  });

  it("[NUM-L21] round-trips with fixed minimum fraction digits and without grouping", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LOCALES),
        mantissa,
        fractionDigits,
        fc.boolean(),
        (locale, n, digits, grouping) => {
          const value = n / 10 ** digits;
          const formatter = createNumberFormatter(locale, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
            useGrouping: grouping,
          });
          expect(formatter.parse(formatter.format(value))).toBe(value);
        },
      ),
      SEED,
    );
  });

  it("[NUM-L22] round-trips percentages (the number is a fraction)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LOCALES),
        mantissa,
        fc.integer({ min: 0, max: 2 }),
        (locale, n, digits) => {
          const value = n / 10 ** (digits + 2);
          const formatter = createNumberFormatter(locale, {
            style: "percent",
            maximumFractionDigits: digits,
          });
          expect(formatter.parse(formatter.format(value))).toBe(value);
        },
      ),
      SEED,
    );
  });

  it("[NUM-L23] round-trips currency amounts in each locale", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LOCALES),
        fc.constantFrom("USD", "EUR", "EGP", "JPY"),
        fc.integer({ min: -99_999_999, max: 99_999_999 }),
        (locale, currency, n) => {
          const formatter = createNumberFormatter(locale, { style: "currency", currency });
          const digits = formatter.maximumFractionDigits;
          const value = n / 10 ** digits;
          expect(formatter.parse(formatter.format(value))).toBe(value);
        },
      ),
      SEED,
    );
  });

  it("[NUM-L24] round-trips units and accounting currency", () => {
    fc.assert(
      fc.property(fc.constantFrom(...LOCALES), mantissa, (locale, n) => {
        const value = n / 100;
        const unit = createNumberFormatter(locale, {
          style: "unit",
          unit: "kilometer-per-hour",
          maximumFractionDigits: 2,
        });
        expect(unit.parse(unit.format(value))).toBe(value);
        const accounting = createNumberFormatter(locale, {
          style: "currency",
          currency: "USD",
          currencySign: "accounting",
        });
        expect(accounting.parse(accounting.format(value))).toBe(value);
      }),
      SEED,
    );
  });

  it("[NUM-L25] the formatter reports the precision it shows", () => {
    expect(createNumberFormatter("en-US").maximumFractionDigits).toBe(3);
    expect(createNumberFormatter("en-US", { maximumFractionDigits: 1 }).maximumFractionDigits).toBe(
      1,
    );
    expect(createNumberFormatter("en-US", { style: "percent" }).maximumFractionDigits).toBe(2);
    expect(
      createNumberFormatter("en-US", { style: "currency", currency: "USD" }).maximumFractionDigits,
    ).toBe(2);
    expect(createNumberFormatter("en-US", { style: "percent" }).percent).toBe(true);
    expect(createNumberFormatter("en-US").percent).toBe(false);
  });

  it("[NUM-L26] parsing never throws on arbitrary text", () => {
    fc.assert(
      fc.property(fc.constantFrom(...LOCALES), fc.string({ unit: "binary" }), (locale, text) => {
        const result = parseNumber(text, locale);
        expect(result === null || Number.isFinite(result)).toBe(true);
      }),
      SEED,
    );
  });
});

describe("step arithmetic", () => {
  it("[NUM-L30] addDecimal has no floating point noise", () => {
    expect(addDecimal(0.1, 0.2)).toBe(0.3);
    expect(addDecimal(0.7, 0.1)).toBe(0.8);
    expect(addDecimal(1.1, 2.2)).toBe(3.3);
    expect(addDecimal(-0.3, 0.1)).toBe(-0.2);
    expect(addDecimal(5, -7)).toBe(-2);
    expect(addDecimal(1e-7, 2e-7)).toBe(3e-7);
  });

  it("[NUM-L31] addDecimal equals the decimal sum for numbers with up to 6 decimals", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 0, max: 6 }),
        (a, b, da, db) => {
          const x = a / 10 ** da;
          const y = b / 10 ** db;
          const decimals = Math.max(da, db);
          const expected = Number(
            ((a * 10 ** (decimals - da) + b * 10 ** (decimals - db)) / 10 ** decimals).toFixed(
              decimals,
            ),
          );
          expect(addDecimal(x, y)).toBe(expected);
        },
      ),
      SEED,
    );
  });

  it("[NUM-L32] stepValue moves by the amount, stays in range, and starts empty fields like a native input", () => {
    expect(stepValue(0.2, 1, 0.1, undefined, undefined)).toBe(0.3);
    expect(stepValue(9.5, 1, 1, 0, 10)).toBe(10);
    expect(stepValue(0.5, -1, 1, 0, 10)).toBe(0);
    expect(stepValue(null, 1, 1, 4, 9)).toBe(4);
    expect(stepValue(null, -1, 1, 4, 9)).toBe(9);
    expect(stepValue(null, 1, 5, undefined, undefined)).toBe(5);
    expect(stepValue(null, -1, 5, undefined, undefined)).toBe(-5);
    expect(stepValue(null, 1, 5, undefined, 3)).toBe(3);
  });

  it("[NUM-L33] stepValue never leaves [min, max] and up then down returns when nothing clamps", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.constantFrom(1, 0.1, 0.25, 5, 0.01),
        fc.constantFrom<1 | -1>(1, -1),
        (n, amount, direction) => {
          const base = n / 100;
          const up = stepValue(base, direction, amount, -50, 50);
          expect(up).toBeGreaterThanOrEqual(-50);
          expect(up).toBeLessThanOrEqual(50);
          expect(stepValue(up, (direction * -1) as 1 | -1, amount, undefined, undefined)).toBe(
            addDecimal(up, -direction * amount),
          );
          expect(stepValue(base, direction, amount, undefined, undefined)).toBe(
            addDecimal(base, direction * amount),
          );
        },
      ),
      SEED,
    );
  });

  const constraints = (over: Partial<Parameters<typeof settleValue>[1]> = {}) => ({
    step: 1,
    snap: false,
    fractionDigits: 3,
    clamp: true,
    ...over,
  });

  it("[NUM-L34] settleValue rounds to the shown precision", () => {
    expect(settleValue(1.23456, constraints())).toBe(1.235);
    expect(settleValue(1.26, constraints({ fractionDigits: 1 }))).toBe(1.3);
    expect(settleValue(1.5, constraints({ fractionDigits: 0 }))).toBe(2);
  });

  it("[NUM-L35] settleValue snaps to the grid from min only when snapping is on", () => {
    expect(settleValue(14, constraints({ min: 3, max: 20, step: 5, snap: true }))).toBe(13);
    expect(settleValue(19, constraints({ min: 3, max: 20, step: 5, snap: true }))).toBe(18);
    expect(settleValue(7, constraints({ step: 5, snap: true }))).toBe(5);
    expect(settleValue(-7, constraints({ step: 5, snap: true }))).toBe(-5);
    expect(settleValue(0.30000000000000004, constraints({ step: 0.1, snap: true }))).toBe(0.3);
    expect(settleValue(14, constraints({ min: 3, max: 20, step: 5 }))).toBe(14);
  });

  it("[NUM-L36] settleValue clamps unless told not to; a maximum off the grid yields the last grid point", () => {
    expect(settleValue(99, constraints({ min: 0, max: 10 }))).toBe(10);
    expect(settleValue(-9, constraints({ min: 0, max: 10 }))).toBe(0);
    expect(settleValue(99, constraints({ min: 0, max: 10, clamp: false }))).toBe(99);
    expect(settleValue(99, constraints({ min: 0, max: 10, step: 3, snap: true }))).toBe(9);
  });

  it("[NUM-L37] settleValue is idempotent and lands inside the range", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.constantFrom(1, 0.5, 0.1, 7),
        fc.boolean(),
        (raw, step, snap) => {
          const c = constraints({ min: -20, max: 50, step, snap, fractionDigits: 2 });
          const once = settleValue(raw, c);
          expect(once).toBeGreaterThanOrEqual(-20);
          expect(once).toBeLessThanOrEqual(50);
          expect(settleValue(once, c)).toBe(once);
        },
      ),
      SEED,
    );
  });
});

describe("repeater", () => {
  afterEach(() => vi.useRealTimers());

  it("[NUM-L40] steps at once, repeats after the delay, then on the interval, and stops", () => {
    vi.useFakeTimers();
    let count = 0;
    const repeater = createRepeater(() => {
      count += 1;
      return true;
    });
    expect([REPEAT_DELAY, REPEAT_INTERVAL]).toEqual([400, 60]);
    repeater.start();
    expect(count).toBe(1);
    vi.advanceTimersByTime(399);
    expect(count).toBe(1);
    vi.advanceTimersByTime(1);
    expect(count).toBe(2);
    vi.advanceTimersByTime(60 * 4);
    expect(count).toBe(6);
    repeater.stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(count).toBe(6);
  });

  it("[NUM-L41] ends by itself when a step changes nothing, and never has more than one timer", () => {
    vi.useFakeTimers();
    let left = 3;
    const repeater = createRepeater(() => {
      left -= 1;
      return left > 0;
    });
    repeater.start();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(400);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(60);
    expect(left).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("[NUM-L42] a start while running restarts cleanly; stop is idempotent", () => {
    vi.useFakeTimers();
    let count = 0;
    const repeater = createRepeater(() => {
      count += 1;
      return true;
    });
    repeater.start();
    vi.advanceTimersByTime(300);
    repeater.start();
    expect(count).toBe(2);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(399);
    expect(count).toBe(2);
    repeater.stop();
    repeater.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});

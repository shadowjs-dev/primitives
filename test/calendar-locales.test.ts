import { describe, expect, it, vi } from "vitest";
import { dateLabel, formatDate, monthCaption, parseDateInput } from "../src/calendar/date";

const day = { year: 2026, month: 3, day: 5 };

describe("[CAL-AUD-1] the calendar writes and reads days in a calendar that matches its Gregorian grid", () => {
  it("[CAL-AUD-1.1] a day formatted for a locale is read back as the same day, in every locale", () => {
    for (const locale of [
      "en-US",
      "de-DE",
      "ar-EG",
      "ar-SA",
      "fa-IR",
      "bn-BD",
      "hi-IN",
      "th-TH",
      "ja-JP",
      "he-IL",
      "ar-SA-u-ca-islamic-umalqura",
    ]) {
      const text = formatDate(locale, day);
      expect({ locale, text, read: parseDateInput(text, locale) }).toEqual({
        locale,
        text,
        read: day,
      });
    }
  });

  it("[CAL-AUD-1.2] digits of another numbering system are read (Arabic-Indic, Persian, Bengali, fullwidth)", () => {
    expect(parseDateInput("٠٥/٠٣/٢٠٢٦", "ar-EG")).toEqual(day);
    expect(parseDateInput("۲۰۲۶/۰۳/۰۵", "ja-JP")).toEqual(day);
    expect(parseDateInput("০৫/০৩/২০২৬", "bn-BD")).toEqual(day);
    expect(parseDateInput("２０２６-０３-０５", "en-US")).toEqual(day);
  });

  it("[CAL-AUD-1.3] a Thai locale shows the Buddhist year and reads either that year or the Gregorian one", () => {
    expect(formatDate("th-TH", day)).toBe("05/03/2569");
    expect(parseDateInput("05/03/2569", "th-TH")).toEqual(day);
    expect(parseDateInput("05/03/2026", "th-TH")).toEqual(day);
    expect(parseDateInput("2026-03-05", "th-TH")).toEqual(day);
  });

  it("[CAL-AUD-1.4] a locale with its own calendar names the Gregorian month the grid shows", () => {
    // fa-IR defaults to the Persian calendar, whose months do not line up with the Gregorian grid.
    expect(monthCaption("fa-IR", { year: 2026, month: 3 })).toBe(
      new Intl.DateTimeFormat("fa-IR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
        calendar: "gregory",
      }).format(new Date(Date.UTC(2026, 2, 1))),
    );
    expect(dateLabel("fa-IR", day)).toContain("۲۰۲۶");
  });
});

describe("[CAL-AUD-2] the calendar of a locale is looked up once and the memory of it is bounded", () => {
  it("[CAL-AUD-2.1] a month of labels asks Intl once per locale, and a flood of locales does not keep them all", () => {
    const real = Intl.DateTimeFormat;
    const asked: string[] = [];
    const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
      this: unknown,
      ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
    ) {
      // Only the argument-less-options construction made by the calendar lookup has no options.
      if (args[1] === undefined) asked.push(String(args[0]));
      return new real(...args);
    } as never);
    try {
      const first = "en-x-b0";
      for (let cell = 0; cell < 42; cell += 1) formatDate(first, day);
      expect(asked).toEqual([first]);
      for (let index = 1; index <= 200; index += 1) formatDate(`en-x-b${index}`, day);
      asked.length = 0;
      formatDate(first, day);
      // Dropped when the cache filled up: it is looked up again.
      expect(asked).toEqual([first]);
    } finally {
      spy.mockRestore();
    }
  });
});

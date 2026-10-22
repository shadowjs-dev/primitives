// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Calendar, dateKey, useCalendar } from "../../src/index";

type Props = Record<string, unknown>;

/** The grid an application writes, as in the calendar fixture. */
function Grid(): JsxChild {
  const calendar = useCalendar("Grid");
  return (
    <table data-testid="grid" role="grid" aria-labelledby={calendar.captionId()}>
      <tbody>
        {calendar.weeks().map((week) => (
          <tr role="row">
            {week.map((day) => (
              <Calendar.Day date={day} data-testid={`day-${dateKey(day)}`}>
                {day.day}
              </Calendar.Day>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A calendar inside a wrapper with `dir="rtl"`; every root prop passes through `props`. */
export function InRtlWrapper(props: Props): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <Calendar data-testid="root" {...props}>
        <Grid />
      </Calendar>
    </div>
  );
}

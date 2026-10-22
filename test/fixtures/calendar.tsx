// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Calendar, dateKey, useCalendar } from "../../src/index";

type Props = Record<string, unknown>;

/** The grid an application writes: the header from the weekdays, the rows from the weeks. */
function Grid(): JsxChild {
  const calendar = useCalendar("Grid");
  return (
    <table data-testid="grid" role="grid" aria-labelledby={calendar.captionId()}>
      <thead>
        <tr>
          {calendar.weekdays().map((label) => (
            <th scope="col" abbr={label.long}>
              {label.short}
            </th>
          ))}
        </tr>
      </thead>
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

/** A calendar with its navigation and grid; every root prop passes through. */
export function Demo(props: Props): JsxChild {
  return (
    <Calendar data-testid="root" {...props}>
      <Calendar.Previous data-testid="prev" />
      <Calendar.Caption data-testid="caption" />
      <Calendar.Next data-testid="next" />
      <Grid />
    </Calendar>
  );
}

/** The grid outside a calendar. */
export function Orphan(): JsxChild {
  return <Grid />;
}

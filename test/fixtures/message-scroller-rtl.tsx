import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MessageScroller } from "../../src/index";

const label = "الرسائل";
const rows = [
  { id: "q", text: "كيف أضيف نافذة حوار؟", anchor: true },
  { id: "a", text: "استخدم المكوّن Dialog وافتحه من زر." },
];

export function Rtl(): JsxChild {
  return (
    <div dir="rtl" data-testid="root">
      <MessageScroller.Provider>
        <MessageScroller.Root>
          <MessageScroller.Viewport aria-label={label} data-testid="viewport">
            <MessageScroller.Content data-testid="content">
              <For each={rows}>
                {(row) => (
                  <MessageScroller.Item messageId={row.id} scrollAnchor={row.anchor} data-testid={`row-${row.id}`}>
                    {row.text}
                  </MessageScroller.Item>
                )}
              </For>
            </MessageScroller.Content>
          </MessageScroller.Viewport>
          <MessageScroller.Button data-testid="button" aria-label="إلى آخر رسالة" />
        </MessageScroller.Root>
      </MessageScroller.Provider>
    </div>
  );
}

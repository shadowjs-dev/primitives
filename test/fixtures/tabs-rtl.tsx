import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tabs } from "../../src/index";

interface ArabicProps {
  defaultValue?: string;
  dir?: "ltr" | "rtl";
}

const VALUES = ["حساب", "كلمة", "فاتورة"];

/** Three Arabic-labeled tabs and panels. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <Tabs data-testid="root" defaultValue={props.defaultValue} dir={props.dir}>
      <Tabs.List data-testid="list" aria-label="الإعدادات">
        {VALUES.map((value) => (
          <Tabs.Trigger data-testid={`tab-${value}`} value={value}>
            {value}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {VALUES.map((value) => (
        <Tabs.Content data-testid={`panel-${value}`} value={value}>
          <p>{value}</p>
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

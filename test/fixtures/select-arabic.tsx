import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Select } from "../../src/index";

interface ArabicProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  dir?: "ltr" | "rtl";
}

/** Arabic select in a right-to-left document: Arabic placeholder, trigger, and items. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="outside">
        خارج
      </button>
      <Select
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        dir={props.dir}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" placeholder="اختر فاكهة" />
          <Select.Icon data-testid="icon" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content data-testid="content">
            <Select.Viewport data-testid="viewport">
              <Select.Item value="apple" data-testid="apple">
                <Select.ItemText>تفاح</Select.ItemText>
              </Select.Item>
              <Select.Item value="apricot" data-testid="apricot">
                <Select.ItemText>مشمش</Select.ItemText>
              </Select.Item>
              <Select.Item value="blueberry" data-testid="blueberry">
                <Select.ItemText>توت ٣</Select.ItemText>
              </Select.Item>
              <Select.Item value="cherry" data-testid="cherry">
                <Select.ItemText>كرز</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select>
      <button type="button" data-testid="after">
        بعد
      </button>
    </div>
  );
}

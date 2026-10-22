import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Menu } from "../../src/index";

interface ArabicProps {
  defaultOpen?: boolean;
  dir?: "ltr" | "rtl";
}

/** Arabic labels in a right-to-left document: items with Arabic-Indic digits, a separator and a submenu. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="before">
        قبل
      </button>
      <Menu defaultOpen={props.defaultOpen} dir={props.dir}>
        <Menu.Anchor data-testid="anchor">مرساة</Menu.Anchor>
        <Menu.Portal>
          <Menu.Content data-testid="content">
            <Menu.Label data-testid="label">إجراءات</Menu.Label>
            <Menu.Item data-testid="alpha">ألفا</Menu.Item>
            <Menu.Item data-testid="beta">بيتا ١٢٣</Menu.Item>
            <Menu.Item data-testid="delta">دلتا</Menu.Item>
            <Menu.Separator data-testid="separator" />
            <Menu.Sub>
              <Menu.SubTrigger data-testid="sub-trigger">المزيد</Menu.SubTrigger>
              <Menu.SubContent data-testid="sub-content">
                <Menu.Item data-testid="sub-one">فرعي ٤٥</Menu.Item>
                <Menu.Item data-testid="sub-two">فرعي آخر</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Portal>
      </Menu>
      <button type="button" data-testid="after">
        بعد
      </button>
    </div>
  );
}

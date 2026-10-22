import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { DropdownMenu } from "../../src/index";

interface ArabicProps {
  dir?: "ltr" | "rtl";
}

/** Arabic labels in a right-to-left document: trigger, items with Arabic-Indic digits, and a submenu. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <DropdownMenu dir={props.dir}>
        <DropdownMenu.Trigger data-testid="trigger">خيارات</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content data-testid="content">
            <DropdownMenu.Item data-testid="one">الخيار ١٢٣</DropdownMenu.Item>
            <DropdownMenu.Item data-testid="two">حفظ الملف</DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger data-testid="sub-trigger">المزيد</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent data-testid="sub-content">
                <DropdownMenu.Item data-testid="sub-one">مشاركة ٤٥</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
    </div>
  );
}

import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Menubar } from "../../src/index";

interface ArabicProps {
  dir?: "ltr" | "rtl";
}

/** Arabic menubar in a right-to-left document: menus with Arabic labels and Arabic-Indic digits. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="before">
        قبل
      </button>
      <Menubar data-testid="bar" dir={props.dir}>
        <Menubar.Menu value="file">
          <Menubar.Trigger data-testid="t-file">ملف</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-file">
              <Menubar.Item data-testid="new">جديد</Menubar.Item>
              <Menubar.Item data-testid="open">فتح ٢٠٢٦</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger data-testid="t-edit">تحرير</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-edit">
              <Menubar.Item data-testid="undo">تراجع ١</Menubar.Item>
              <Menubar.Item data-testid="redo">إعادة ٢</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="view">
          <Menubar.Trigger data-testid="t-view">عرض</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-view">
              <Menubar.Item data-testid="zoom">تكبير</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar>
      <button type="button" data-testid="after">
        بعد
      </button>
    </div>
  );
}

import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NavigationMenu } from "../../src/index";

interface ArabicProps {
  dir?: "ltr" | "rtl";
  defaultValue?: string;
}

/** Arabic navigation in a right-to-left document: two flyouts with Arabic links and Arabic-Indic digits. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="before">
        قبل
      </button>
      <NavigationMenu
        data-testid="root"
        aria-label="الرئيسية"
        dir={props.dir}
        defaultValue={props.defaultValue}
      >
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger data-testid="products">المنتجات</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="products-content">
              <NavigationMenu.Link href="/a" active data-testid="link-a">
                منتج ألف
              </NavigationMenu.Link>
              <NavigationMenu.Link href="/b" data-testid="link-b">
                منتج ٢
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="company">
            <NavigationMenu.Trigger data-testid="company">الشركة</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="company-content">
              <NavigationMenu.Link href="/about" data-testid="link-about">
                عن الشركة
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
      <button type="button" data-testid="after">
        بعد
      </button>
    </div>
  );
}

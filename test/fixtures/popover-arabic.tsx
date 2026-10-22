import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popover } from "../../src/index";

interface ArabicProps {
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Arabic popover in a right-to-left document: Arabic trigger, title, fields, and close button. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="outside">
        خارج
      </button>
      <Popover
        defaultOpen={props.defaultOpen}
        modal={props.modal}
        onOpenChange={props.onOpenChange}
      >
        <Popover.Trigger data-testid="trigger">فتح الأبعاد</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content data-testid="content" sideOffset={4}>
            <Popover.Title data-testid="title">الأبعاد</Popover.Title>
            <Popover.Description data-testid="description">حدد الحجم ٣٠٠ بكسل</Popover.Description>
            <input data-testid="first" aria-label="العرض" />
            <input data-testid="last" aria-label="الارتفاع" />
            <Popover.Arrow data-testid="arrow" />
            <Popover.Close data-testid="close">تم</Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
      <button type="button" data-testid="after">
        بعد
      </button>
    </div>
  );
}

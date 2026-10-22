import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { HoverCard } from "../../src/index";

interface ArabicProps {
  openDelay?: number;
  closeDelay?: number;
}

/** Arabic labels in a right-to-left document: a trigger link, a card with Arabic-Indic digits, a link and a button. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <button type="button" data-testid="outside">
        خارج
      </button>
      <HoverCard openDelay={props.openDelay} closeDelay={props.closeDelay}>
        <HoverCard.Trigger href="/ada" data-testid="trigger">
          @آدا
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content data-testid="content">
            <p data-testid="text">آدا لوفليس</p>
            <p data-testid="count">١٢٠ متابعا</p>
            <a href="/ada/posts" data-testid="inner-link">
              المنشورات
            </a>
            <button type="button" data-testid="inner-button">
              متابعة
            </button>
            <HoverCard.Arrow data-testid="arrow" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard>
    </div>
  );
}

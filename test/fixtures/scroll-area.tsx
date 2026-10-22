// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ScrollArea } from "../../src/index";

type Props = Record<string, unknown>;

/** A scroll area with a vertical and a horizontal bar and a corner; every root prop passes through. */
export function Demo(props: Props): JsxChild {
  return (
    <ScrollArea data-testid="root" {...props}>
      <ScrollArea.Viewport data-testid="viewport">
        <p data-testid="content">Long content</p>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar data-testid="vertical" orientation="vertical">
        <ScrollArea.Thumb data-testid="vthumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar data-testid="horizontal" orientation="horizontal">
        <ScrollArea.Thumb data-testid="hthumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner data-testid="corner" />
    </ScrollArea>
  );
}

/** Scrollbars that are always shown (`forceMount`), with the root in hover mode. */
export function Forced(): JsxChild {
  return (
    <ScrollArea data-testid="root" type="hover">
      <ScrollArea.Viewport data-testid="viewport">
        <p>Content</p>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar data-testid="vertical" orientation="vertical" forceMount>
        <ScrollArea.Thumb data-testid="vthumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  );
}

/** A viewport outside a root, to prove the error message. */
export function Orphan(): JsxChild {
  return <ScrollArea.Viewport>x</ScrollArea.Viewport>;
}

// biome-ignore-all lint/a11y: fixtures check typing; accessibility rules do not apply to them
/**
 * Type tests for Dialog and AlertDialog: valid usage compiles, misuse is a compile error
 * (`@ts-expect-error` proves each rejection).
 * @since 1.0.0
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { AlertDialog, Dialog } from "../src/index";

declare function sink(...values: readonly unknown[]): void;

sink(
  <Dialog>
    <Dialog.Trigger>open</Dialog.Trigger>
    <Dialog.Portal container={() => document.body} forceMount>
      <Dialog.Overlay class="overlay" forceMount />
      <Dialog.Content
        class="content"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.detail.originalEvent.button}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Dialog.Title>title</Dialog.Title>
        <Dialog.Description>description</Dialog.Description>
        <Dialog.Close aria-label="Close">x</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog>,
);

// Controlled and uncontrolled.
sink(<Dialog open onOpenChange={(open: boolean) => open} />);
sink(<Dialog defaultOpen modal={false} />);

// The trigger takes the attributes of the element it renders as.
sink(<Dialog.Trigger as="a" href="/x" />);
sink(<Dialog.Trigger as="div" />);
sink(<Dialog.Title as="h3" />);

// Misuse is a compile error.
// @ts-expect-error `open` is a boolean
sink(<Dialog open="yes" />);
// @ts-expect-error `onOpenChange` receives a boolean
sink(<Dialog onOpenChange={(open: string) => open} />);
// @ts-expect-error `href` does not exist on a button
sink(<Dialog.Trigger href="/x" />);
// @ts-expect-error `as` takes a tag name or a component
sink(<Dialog.Trigger as="not-a-tag-in-the-table" />);
// @ts-expect-error `forceMount` is a boolean
sink(<Dialog.Overlay forceMount="always" />);
// @ts-expect-error an alert dialog is always modal
sink(<AlertDialog modal={false} />);
// @ts-expect-error `onEscapeKeyDown` receives a KeyboardEvent
sink(<Dialog.Content onEscapeKeyDown={(event: MouseEvent) => event} />);

sink(
  <AlertDialog>
    <AlertDialog.Trigger>delete</AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Overlay />
      <AlertDialog.Content>
        <AlertDialog.Title>sure?</AlertDialog.Title>
        <AlertDialog.Cancel>no</AlertDialog.Cancel>
        <AlertDialog.Action onClick={() => undefined}>yes</AlertDialog.Action>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog>,
);

export const _typed: JsxChild = null;

// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createToaster,
  Toast,
  type Toaster,
  type ToastItem,
  type ToastPromiseHandle,
} from "../src/toast/index";

export const full: JsxChild = (
  <Toast.Provider label="Notifications" duration={4000} swipeDirection="left" swipeThreshold={80}>
    <Toast.Viewport hotkey={["altKey", "KeyT"]} label="Alerts" class="viewport">
      <Toast
        defaultOpen
        duration={Number.POSITIVE_INFINITY}
        type="background"
        forceMount
        onOpenChange={(open: boolean) => open}
        onPause={() => undefined}
        onResume={() => undefined}
        onEscapeKeyDown={(event: KeyboardEvent) => event.preventDefault()}
        onSwipeStart={(event) => event.detail.delta.x}
        onSwipeMove={(event) => event.detail.originalEvent.clientX}
        onSwipeCancel={(event) => event.detail.delta.y}
        onSwipeEnd={(event) => event.preventDefault()}
        onExitComplete={() => undefined}
        class="toast"
      >
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description as="p">Done</Toast.Description>
        <Toast.Action altText="Undo the save" onClick={() => undefined}>
          Undo
        </Toast.Action>
        <Toast.Close aria-label="Dismiss">x</Toast.Close>
      </Toast>
    </Toast.Viewport>
  </Toast.Provider>
);

export const polymorphic: JsxChild = (
  <Toast as="div">
    <Toast.Action as="a" href="/undo" altText="Undo">
      Undo
    </Toast.Action>
  </Toast>
);

// @ts-expect-error altText is required
export const noAltText: JsxChild = <Toast.Action>Undo</Toast.Action>;

// @ts-expect-error altText is a string
export const numericAltText: JsxChild = <Toast.Action altText={1}>Undo</Toast.Action>;

// @ts-expect-error type is "foreground" or "background"
export const badType: JsxChild = <Toast type="loud" />;

// @ts-expect-error swipeDirection is one of four sides
export const badDirection: JsxChild = <Toast.Provider swipeDirection="diagonal" />;

// @ts-expect-error a button has no href
export const hrefOnClose: JsxChild = <Toast.Close href="/x" />;

// @ts-expect-error the hotkey is a list of key codes
export const badHotkey: JsxChild = <Toast.Viewport hotkey="F8" />;

// @ts-expect-error duration is a number of milliseconds
export const badDuration: JsxChild = <Toast duration="5s" />;

export const toaster: Toaster<{ readonly variant: string }> = createToaster<{
  readonly variant: string;
}>({
  limit: 3,
  duration: 4000,
  order: "newest-first",
  idPrefix: "app",
  onExitComplete: (item) => item.data?.variant,
});

export const id: string = toaster.add({ title: "Saved", key: "saved", data: { variant: "ok" } });
export const updated: boolean = toaster.update(id, { description: "later", duration: undefined });
export const list: readonly ToastItem<{ readonly variant: string }>[] = toaster.toasts();
export const handle: ToastPromiseHandle<number> = toaster.promise(Promise.resolve(3), {
  loading: "Working",
  success: (value: number) => `Got ${value}`,
  error: (reason: unknown) => ({ title: String(reason) }),
});
export const result: Promise<number> = handle.result;

// @ts-expect-error data must match the toaster's payload type
toaster.add({ data: { variant: 1 } });

// @ts-expect-error the type of a toast is foreground or background
toaster.add({ type: "loud" });

// @ts-expect-error promise messages need loading, success and error
toaster.promise(Promise.resolve(1), { loading: "x" });

// @ts-expect-error success receives the resolved value
toaster.promise(Promise.resolve(1), { loading: "x", success: (v: string) => v, error: "e" });

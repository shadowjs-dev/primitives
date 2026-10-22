import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toast, type Toaster, type ToastItem } from "../../src/toast/index";

type Props = Record<string, unknown>;

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  providerDuration?: number;
  type?: "foreground" | "background";
  forceMount?: boolean;
  label?: string;
  viewportLabel?: string;
  hotkey?: string[];
  swipeDirection?: "right" | "left" | "up" | "down";
  swipeThreshold?: number;
  toastProps?: Props;
  viewportProps?: Props;
  actionProps?: Props;
}

/** One toast with a title, a description, an action and a close button, inside the viewport. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Toast.Provider
      label={props.label}
      duration={props.providerDuration}
      swipeDirection={props.swipeDirection}
      swipeThreshold={props.swipeThreshold}
    >
      <button type="button" data-testid="outside">
        outside
      </button>
      <Toast.Viewport
        data-testid="viewport"
        hotkey={props.hotkey}
        label={props.viewportLabel}
        {...props.viewportProps}
      >
        <Toast
          data-testid="toast"
          open={props.open}
          defaultOpen={props.defaultOpen}
          onOpenChange={props.onOpenChange}
          duration={props.duration}
          type={props.type}
          forceMount={props.forceMount}
          {...props.toastProps}
        >
          <Toast.Title data-testid="title">Saved</Toast.Title>
          <Toast.Description data-testid="description">Your changes were saved.</Toast.Description>
          <Toast.Action altText="Undo the save" data-testid="action" {...props.actionProps}>
            Undo
          </Toast.Action>
          <Toast.Close data-testid="close" aria-label="Dismiss">
            x
          </Toast.Close>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  );
}

/** Two toasts to move focus between. */
export function Two(props: DemoProps): JsxChild {
  return (
    <Toast.Provider duration={props.providerDuration}>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Toast.Viewport data-testid="viewport">
        <Toast data-testid="toast-a">
          <Toast.Title>A</Toast.Title>
          <Toast.Close data-testid="close-a">x</Toast.Close>
        </Toast>
        <Toast data-testid="toast-b">
          <Toast.Title>B</Toast.Title>
          <Toast.Close data-testid="close-b">x</Toast.Close>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  );
}

/** The toast is declared next to the viewport, not inside it (the Radix arrangement). */
export function Outside(props: DemoProps): JsxChild {
  return (
    <Toast.Provider duration={props.providerDuration}>
      <Toast data-testid="toast" open={props.open} onOpenChange={props.onOpenChange}>
        <Toast.Title>Elsewhere</Toast.Title>
      </Toast>
      <Toast.Viewport data-testid="viewport" />
    </Toast.Provider>
  );
}

/** No viewport: the toast has nowhere to go and renders nothing. */
export function NoViewport(): JsxChild {
  return (
    <Toast.Provider>
      <Toast data-testid="toast">
        <Toast.Title>Lost</Toast.Title>
      </Toast>
    </Toast.Provider>
  );
}

/** A toaster-driven list, rendered the way an application does. */
export function Queue(props: {
  toaster: Toaster;
  providerDuration?: number;
  onExitComplete?: (id: string) => void;
}): JsxChild {
  return (
    <Toast.Provider duration={props.providerDuration}>
      <Toast.Viewport data-testid="viewport">
        <For each={props.toaster.toasts()} key={(item: ToastItem) => item.id}>
          {(item: () => ToastItem) => (
            <Toast
              data-testid={item().id}
              open={item().open}
              duration={item().duration}
              type={item().type}
              onOpenChange={(open: boolean) => {
                if (!open) props.toaster.dismiss(item().id);
              }}
              onExitComplete={() => {
                props.onExitComplete?.(item().id);
                props.toaster.remove(item().id);
              }}
            >
              <Toast.Title>{item().title}</Toast.Title>
              <Toast.Description>{item().description}</Toast.Description>
              <Toast.Close aria-label="Dismiss">x</Toast.Close>
            </Toast>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Provider>
  );
}

/** Polymorphic parts. */
export function AsParts(): JsxChild {
  return (
    <Toast.Provider>
      <Toast.Viewport as="div" data-testid="viewport">
        <Toast as="div" data-testid="toast">
          <Toast.Title as="h3" data-testid="title">
            Title
          </Toast.Title>
          <Toast.Description as="p" data-testid="description">
            Description
          </Toast.Description>
          <Toast.Action as="a" href="#undo" altText="Undo" data-testid="action">
            Undo
          </Toast.Action>
          <Toast.Close as="span" data-testid="close">
            x
          </Toast.Close>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  );
}

/** A part outside its root. */
export function OrphanAction(): JsxChild {
  return <Toast.Action altText="x">x</Toast.Action>;
}

/** A viewport outside its provider. */
export function OrphanViewport(): JsxChild {
  return <Toast.Viewport />;
}

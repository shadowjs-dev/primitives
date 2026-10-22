import { onMount, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Dialog } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentProps?: Record<string, unknown>;
  forceMount?: boolean;
}

/** A complete dialog in a portal, with a form inside. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Dialog
      open={props.open}
      defaultOpen={props.defaultOpen}
      modal={props.modal}
      onOpenChange={props.onOpenChange}
    >
      <Dialog.Trigger data-testid="trigger">Edit profile</Dialog.Trigger>
      <Dialog.Portal forceMount={props.forceMount}>
        <Dialog.Overlay data-testid="overlay" forceMount={props.forceMount} />
        <Dialog.Content data-testid="content" forceMount={props.forceMount} {...props.contentProps}>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Make changes here.</Dialog.Description>
          <input data-testid="first" />
          <input data-testid="last" />
          <Dialog.Close data-testid="close">Done</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/** Content without a portal: renders on the server when open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <div>
      <Dialog open={props.open} defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Inline</Dialog.Title>
          <Dialog.Description>Described</Dialog.Description>
          <button type="button">Inside</button>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

/** A dialog opened from inside another dialog. */
export function Nested(): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        page
      </button>
      <Dialog>
        <Dialog.Trigger data-testid="outer-trigger">Outer</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay data-testid="outer-overlay" />
          <Dialog.Content data-testid="outer-content">
            <Dialog.Title>Outer</Dialog.Title>
            <Dialog>
              <Dialog.Trigger data-testid="inner-trigger">Inner</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay data-testid="inner-overlay" />
                <Dialog.Content data-testid="inner-content">
                  <Dialog.Title>Inner</Dialog.Title>
                  <button type="button" data-testid="inner-button">
                    inner action
                  </button>
                  <Dialog.Close data-testid="inner-close">Close inner</Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
}

/** The trigger rendered as a link. */
export function AsLink(): JsxChild {
  return (
    <Dialog>
      <Dialog.Trigger as="a" href="#edit" data-testid="trigger">
        Edit
      </Dialog.Trigger>
    </Dialog>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Dialog.Trigger>Orphan</Dialog.Trigger>;
}

/** Title only: no description part. */
export function TitleOnly(): JsxChild {
  return (
    <Dialog defaultOpen>
      <Dialog.Portal>
        <Dialog.Content data-testid="content">
          <Dialog.Title>Only a title</Dialog.Title>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/** A dialog opened by application code: there is no Dialog.Trigger. */
export function NoTrigger(): JsxChild {
  const [open, setOpen] = useSignal(false);
  return (
    <div>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog open={open()} onOpenChange={(next: boolean) => setOpen(next)}>
        <Dialog.Portal>
          <Dialog.Content data-testid="content">
            <Dialog.Title>Controlled</Dialog.Title>
            <Dialog.Description>No trigger.</Dialog.Description>
            <input data-testid="first" />
            <Dialog.Close data-testid="close">Done</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
}

/** Content with no Dialog.Title: named by the application's aria-label, or not named at all. */
export function Unnamed(props: {
  readonly ariaLabel?: string | undefined;
  readonly defaultOpen?: boolean | undefined;
}): JsxChild {
  return (
    <Dialog defaultOpen={props.defaultOpen}>
      <Dialog.Portal>
        <Dialog.Content data-testid="content" aria-label={props.ariaLabel}>
          <button type="button" data-testid="inside">
            Inside
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/** A title that mounts a moment after the content (an application that loads its heading later). */
function LateTitle(): JsxChild {
  const [shown, setShown] = useSignal(false);
  return (
    <>
      <LateTrigger onReady={() => setShown(true)} />
      {shown() ? <Dialog.Title>Late title</Dialog.Title> : null}
    </>
  );
}

function LateTrigger(props: { readonly onReady: () => void }): JsxChild {
  onMount(() => props.onReady());
  return null;
}

/** Opened on mount, with a Dialog.Title that appears after the content mounted. */
export function LateNamed(): JsxChild {
  return (
    <Dialog defaultOpen>
      <Dialog.Portal>
        <Dialog.Content data-testid="content">
          <LateTitle />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { AlertDialog } from "../../src/index";

interface DemoProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentProps?: Record<string, unknown>;
}

/** A complete alert dialog with its cancel and action buttons, and a button outside to press. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        page
      </button>
      <AlertDialog defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
        <AlertDialog.Trigger data-testid="trigger">Delete</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay data-testid="overlay" />
          <AlertDialog.Content data-testid="content" {...props.contentProps}>
            <AlertDialog.Title>Delete project?</AlertDialog.Title>
            <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
            <AlertDialog.Cancel data-testid="cancel">Cancel</AlertDialog.Cancel>
            <AlertDialog.Action data-testid="action">Delete</AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </div>
  );
}

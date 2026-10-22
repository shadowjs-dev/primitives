import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { AlertDialog, Dialog } from "../../src/index";

interface WrapperProps {
  wrapperDir?: "ltr" | "rtl";
  contentDir?: "ltr" | "rtl";
}

/** A dialog whose trigger sits in a wrapper with a dir attribute. The content is portaled to the body. */
export function DialogInWrapper(props: WrapperProps): JsxChild {
  return (
    <div dir={props.wrapperDir} data-testid="wrapper">
      <Dialog defaultOpen>
        <Dialog.Trigger data-testid="trigger">فتح الحوار</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content data-testid="content" dir={props.contentDir}>
            <Dialog.Title>تعديل الملف الشخصي</Dialog.Title>
            <Dialog.Close data-testid="close">إغلاق</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
}

/** An alert dialog whose trigger sits in a wrapper with a dir attribute. The content is portaled to the body. */
export function AlertDialogInWrapper(props: WrapperProps): JsxChild {
  return (
    <div dir={props.wrapperDir} data-testid="wrapper">
      <AlertDialog defaultOpen>
        <AlertDialog.Trigger data-testid="trigger">حذف</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content data-testid="content" dir={props.contentDir}>
            <AlertDialog.Title>حذف المشروع؟</AlertDialog.Title>
            <AlertDialog.Cancel data-testid="cancel">إلغاء</AlertDialog.Cancel>
            <AlertDialog.Action data-testid="action">حذف</AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </div>
  );
}

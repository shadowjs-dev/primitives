import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toast } from "../../src/toast/index";

interface WrapperProps {
  wrapperDir?: "ltr" | "rtl";
  swipeDirection?: "right" | "left" | "up" | "down";
}

/** An open toast inside a wrapper with a dir attribute, under a provider with the given swipe direction. */
export function ToastInWrapper(props: WrapperProps): JsxChild {
  return (
    <div dir={props.wrapperDir} data-testid="wrapper">
      <Toast.Provider swipeDirection={props.swipeDirection}>
        <Toast.Viewport data-testid="viewport">
          <Toast data-testid="toast" defaultOpen>
            <Toast.Title>تم الحفظ</Toast.Title>
            <Toast.Close aria-label="إغلاق">x</Toast.Close>
          </Toast>
        </Toast.Viewport>
      </Toast.Provider>
    </div>
  );
}

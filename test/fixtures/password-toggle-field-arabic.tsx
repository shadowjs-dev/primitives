import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PasswordToggleField } from "../../src/index";

interface ArabicProps {
  disabled?: boolean;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  label?: string;
}

/** Arabic password field in a right-to-left document: Arabic label, hint, and toggle text. */
export function Arabic(props: ArabicProps): JsxChild {
  return (
    <div lang="ar" dir="rtl">
      <label htmlFor="account-password">كلمة المرور</label>
      <PasswordToggleField
        data-testid="root"
        disabled={props.disabled}
        visible={props.visible}
        defaultVisible={props.defaultVisible}
        onVisibleChange={props.onVisibleChange}
      >
        <PasswordToggleField.Input data-testid="input" id="account-password" />
        <PasswordToggleField.Toggle
          data-testid="toggle"
          aria-label={props.label ?? "إظهار كلمة المرور"}
        />
      </PasswordToggleField>
      <p data-testid="hint">الحد الأدنى ٨ أحرف</p>
    </div>
  );
}

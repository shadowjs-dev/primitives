import { untrack } from "@shadow-js/core";
import {
  normalizeDigit,
  type OneTimePasswordEdit,
  type OneTimePasswordType,
  sanitize,
} from "../one-time-password/logic";
import type { OneTimePasswordCharacterFilter } from "../one-time-password/pattern";

/** Compile once per reactive pattern, with no mutable regex cursor or whole-code backtracking. @internal */
export function otpPattern(pattern: string): RegExp {
  if (typeof pattern !== "string" || pattern.length > 256)
    throw new RangeError(
      __DEV__
        ? "OneTimePasswordField pattern must be a string of at most 256 characters."
        : "PRIMITIVES_OTP_PATTERN_LIMIT",
    );
  try {
    const source = new RegExp(pattern, "u").source;
    return new RegExp(`^(?:${source})(?![\\s\\S])`, "u");
  } catch (cause) {
    throw new TypeError(
      __DEV__
        ? "OneTimePasswordField pattern must be a valid regular expression."
        : "PRIMITIVES_OTP_PATTERN_INVALID",
      {
        cause,
      },
    );
  }
}

/** Native input is already buffered; bound work and output before it enters a field's state. @internal */
export function filterOtp(
  text: string,
  type: OneTimePasswordType,
  pattern: OneTimePasswordCharacterFilter | undefined,
  length: number,
): string {
  if (pattern === undefined) return sanitize(text.slice(0, 4096), type).slice(0, length);
  return untrack(() => {
    let kept = "";
    const end = Math.min(text.length, 4096);
    for (let at = 0; at < end && kept.length < length; at += 1) {
      const char = text.charAt(at);
      const code = text.charCodeAt(at);
      if (code < 32 || code === 127 || (code >= 0xd800 && code <= 0xdfff)) continue;
      const normalized = char.replace(/[٠-٩۰-۹]/g, normalizeDigit);
      if (pattern(normalized)) kept += normalized;
    }
    return kept;
  });
}

/** Enforce the registry bound on both rendered slots and direct context registrations. @internal */
export function otpIndex(index: number, length: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= length)
    throw new RangeError(
      __DEV__
        ? "OneTimePasswordField index must be an integer inside the field length."
        : "PRIMITIVES_OTP_INDEX",
    );
}

/** Paste already filtered text without applying the default type's character rules a second time. @internal */
export function pasteOtp(
  value: string,
  length: number,
  index: number,
  chars: string,
): OneTimePasswordEdit {
  if (chars.length === 0) return { value, focus: Math.min(index, length - 1) };
  const at = Math.min(index, value.length);
  const end = at + chars.length;
  return {
    value: (value.slice(0, at) + chars + value.slice(end)).slice(0, length),
    focus: Math.min(end, length - 1),
  };
}

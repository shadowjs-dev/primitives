import { onCleanup, onMount, splitProps, untrack, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  LAYER_BRANCH_ATTRIBUTE,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { toastProviderContext, toastViewportContext } from "./context";

/**
 * Own props of {@link ToastViewport}. The region is a `div` with `role="region"`, `tabindex="-1"` and an `aria-label` of `"{label} ({hotkey})"`. It sets `data-primitives-layer-branch` (value `""`), so using a toast never dismisses an open dialog or menu. The hotkey moves focus to the region.
 * @since 1.0.0
 * @see {@link ToastViewport}
 */
export interface ToastViewportOwnProps {
  /**
   * The keys that focus the viewport, matched against `event.code`; all of them must be down at once. `"altKey"`, `"ctrlKey"`, `"metaKey"` and `"shiftKey"` match the modifier of that name. An empty list never matches.
   * @default ["F8"]
   */
  readonly hotkey?: readonly string[] | undefined;
  /**
   * Overrides the provider's `label` for this region. The region is named `"{label} ({hotkey})"`.
   * @default none (the provider's label)
   */
  readonly label?: string | undefined;
}

/**
 * Props of {@link ToastViewport}: the attributes of the list element (an `ol` unless `as` says otherwise), plus {@link ToastViewportOwnProps}. Attributes go to the list, not to the region `div`.
 * @since 1.0.0
 * @see {@link ToastViewport}
 */
export type ToastViewportProps<T extends PolymorphicTarget = "ol"> = PolymorphicProps<
  "ol",
  ToastViewportOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const DEFAULT_HOTKEY: readonly string[] = ["F8"];
const MODIFIERS = ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const;
type Modifier = (typeof MODIFIERS)[number];

function isModifier(name: string): name is Modifier {
  return (MODIFIERS as readonly string[]).includes(name);
}

/**
 * Whether `event` is the hotkey: every modifier the hotkey names is down, no other modifier is, and
 * every other key of the hotkey is the event's `code`. An empty hotkey never matches.
 */
function matchesHotkey(event: KeyboardEvent, hotkey: readonly string[]): boolean {
  if (hotkey.length === 0) return false;
  const named = new Set(hotkey.filter(isModifier));
  for (const modifier of MODIFIERS) {
    if (event[modifier] !== named.has(modifier)) return false;
  }
  return hotkey.every((name) => isModifier(name) || event.code === name);
}

/**
 * Whether `target` takes typed text: a field, a textarea, a select, or an element inside a
 * contenteditable region. Keys typed there belong to the field, so the hotkey ignores them.
 */
function takesTypedText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return (
    target.isContentEditable ||
    target.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}

/**
 * The region toasts appear in: a `div` with `role="region"`, named "{label} ({hotkey})" (for example "Notification (F8)"), that holds the list the toasts are rendered into. Keyboard: the hotkey (F8 by default) moves focus to the region, from where Tab walks through the toasts in DOM order; the region itself is not in the tab order. The hotkey needs exactly its own modifiers (Shift+F8 does not match F8), and it is ignored while a key is typed into a field, a textarea, a select or a contenteditable element, and during IME composition. ARIA: the region has `role="region"`, the `aria-label` and `tabindex="-1"`. While the pointer is over the region, focus is inside it, the window lost focus or the page is hidden, every toast stops its countdown and resumes with the time it had left.
 *
 * Toasts rendered inside the viewport are placed in it directly; toasts rendered elsewhere inside the provider are moved into it. The region gets `pointer-events: none` while it holds no toast, so it does not block the page below.
 *
 * @param props See {@link ToastViewportProps}.
 * @returns The region element.
 * @throws Error when rendered outside a `Toast.Provider`, with the message `[primitives] <Toast.Viewport> must be used within <Toast.Provider>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function Notifications() {
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport class="fixed bottom-0 right-0 flex flex-col gap-2 p-4" />
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastViewportProps}
 * @see {@link ToastProvider}
 * @since 1.0.0
 */
export function ToastViewport<T extends PolymorphicTarget = "ol">(
  props: ToastViewportProps<T>,
): JsxChild {
  const provider = toastProviderContext.use("Toast.Viewport");
  const [own, rest] = splitProps(partProps<Loose & ToastViewportOwnProps>(props), [
    "as",
    "hotkey",
    "label",
  ]);
  const hotkey = (): readonly string[] => own.hotkey ?? DEFAULT_HOTKEY;
  const hotkeyLabel = (): string => hotkey().join("+").replace(/Key/g, "").replace(/Digit/g, "");
  const regionLabel = (): string => `${own.label ?? provider.label()} (${hotkeyLabel()})`;

  // The hotkey, the window and the page are not part of the viewport's element tree, so they are
  // bound by hand and unbound with the owner.
  onMount(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // A key of an IME composition is not a shortcut, and typed text is not either.
      if (event.isComposing || takesTypedText(event.target)) return;
      if (matchesHotkey(event, untrack(hotkey)))
        untrack(provider.region)?.focus({ preventScroll: true });
    };
    const onBlur = (): void => provider.setPauseReason("blur", true);
    const onFocus = (): void => provider.setPauseReason("blur", false);
    const onVisibility = (): void =>
      provider.setPauseReason("hidden", document.visibilityState === "hidden");
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      provider.setPauseReason("blur", false);
      provider.setPauseReason("hidden", false);
    };
  });

  // `pointerenter` and `pointerleave` do not bubble and are not delegated; `pointermove` catches a
  // toast appearing under a pointer that is already resting on the viewport.
  useEffect(() => {
    const region = provider.region();
    if (region === undefined) return;
    const pause = (): void => provider.setPauseReason("pointer", true);
    const resume = (): void => provider.setPauseReason("pointer", false);
    region.addEventListener("pointerenter", pause);
    region.addEventListener("pointermove", pause);
    region.addEventListener("pointerleave", resume);
    onCleanup(() => {
      region.removeEventListener("pointerenter", pause);
      region.removeEventListener("pointermove", pause);
      region.removeEventListener("pointerleave", resume);
      provider.setPauseReason("pointer", false);
    });
  });

  const regionProps = mergeElementProps({
    role: "region",
    // Toasts are meant to be used while a dialog or menu is open: that must not dismiss it.
    [LAYER_BRANCH_ATTRIBUTE]: "",
    get "aria-label"() {
      return regionLabel();
    },
    tabindex: -1,
    // An empty viewport must not swallow clicks meant for the page below it.
    get style() {
      return provider.toastCount() > 0 ? {} : { "pointer-events": "none" };
    },
    ref: composeRefs<HTMLElement>((element) => provider.setRegion(element)),
    onFocusIn: () => provider.setPauseReason("focus", true),
    onFocusOut: (event: FocusEvent) => {
      const region = untrack(provider.region);
      const next = event.relatedTarget;
      if (region !== undefined && next instanceof Node && region.contains(next)) return;
      provider.setPauseReason("focus", false);
    },
  });

  const listProps = mergeElementProps(rest, {
    ref: composeRefs<HTMLElement>((element) => provider.setList(element)),
  });

  return (
    <div {...regionProps}>
      <toastViewportContext.Provider value={true}>
        <Polymorphic as={own.as ?? "ol"} {...listProps} />
      </toastViewportContext.Provider>
    </div>
  );
}

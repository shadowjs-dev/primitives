import { onCleanup, splitProps, useEffect, useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperArrow, type PopperArrowProps } from "../popper/index";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  usePartRegistration,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { selectContentContext, selectContext, selectGroupContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link SelectGroup}.
 * @see {@link SelectGroup}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link SelectLabel}.
 * @see {@link SelectLabel}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectLabelProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link SelectSeparator}.
 * @see {@link SelectSeparator}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectSeparatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link SelectArrow}.
 * @see {@link SelectArrow}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectArrowProps = PopperArrowProps;

/**
 * Props of the scroll buttons.
 * @see {@link SelectScrollUpButton}
 * @see {@link SelectScrollDownButton}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectScrollButtonProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * A group of items: `role="group"`, named by `aria-labelledby` pointing at the `Select.Label` inside
 * it while that label is mounted.
 *
 * @param props See {@link SelectGroupProps}.
 * @returns The rendered group.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Group><Select.Label>Fruits</Select.Label><Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item></Select.Group>;
 * @see {@link SelectLabel}
 * @since 1.0.0
 */
export function SelectGroup<T extends PolymorphicTarget = "div">(
  props: SelectGroupProps<T>,
): JsxChild {
  const context = selectContext.use("Select.Group");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const id = context.generateId("group");
  const label = usePartRegistration();
  const merged = mergeElementProps(
    {
      role: "group",
      get "aria-labelledby"() {
        return label.present() ? partId(id, "label") : undefined;
      },
    },
    rest,
  );
  return (
    <selectGroupContext.Provider value={{ labelId: () => partId(id, "label"), label }}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </selectGroupContext.Provider>
  );
}

/**
 * The visible name of a group. Not an option: it cannot be focused or selected. Keyboard: none; the
 * label handles no keys. ARIA: it sets no role or ARIA attribute; its `id` is what the group's
 * `aria-labelledby` points at (`Select.Group`).
 *
 * @param props See {@link SelectLabelProps}.
 * @returns The rendered label.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Label>Fruits</Select.Label>;
 * @see {@link SelectGroup}
 * @since 1.0.0
 */
export function SelectLabel<T extends PolymorphicTarget = "div">(
  props: SelectLabelProps<T>,
): JsxChild {
  selectContext.use("Select.Label");
  const group = selectGroupContext.useOptional();
  group?.label.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return group?.labelId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * A visual divider between items. Hidden from assistive technology (`aria-hidden`).
 *
 * @param props See {@link SelectSeparatorProps}.
 * @returns The rendered divider.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Separator class="my-1 h-px bg-border" />;
 * @see {@link SelectGroup}
 * @since 1.0.0
 */
export function SelectSeparator<T extends PolymorphicTarget = "div">(
  props: SelectSeparatorProps<T>,
): JsxChild {
  selectContext.use("Select.Separator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps({ "aria-hidden": true }, rest);
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * An arrow pointing at the trigger; renders an `svg` (see `PopperArrow`). Style it with `fill`.
 * Renders nothing in the closed listbox's off-screen registry. Keyboard: none. ARIA: the `svg` is
 * `aria-hidden="true"`.
 *
 * @param props See {@link SelectArrowProps}.
 * @returns The arrow while the listbox is open, otherwise nothing.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Arrow class="fill-white" />;
 * @see {@link SelectContent}
 * @since 1.0.0
 */
export function SelectArrow(props: SelectArrowProps): JsxChild {
  selectContext.use("Select.Arrow");
  const content = selectContentContext.useOptional();
  if (content === undefined) return null;
  return <PopperArrow {...props} />;
}

/** How often the pressed scroll button scrolls, in milliseconds. */
const AUTO_SCROLL_INTERVAL = 50;

/** One of the two scroll buttons; `direction` is the way it scrolls. */
function ScrollButton(props: {
  readonly direction: 1 | -1;
  readonly part: string;
  readonly rest: object;
  readonly as: PolymorphicTarget | undefined;
}): JsxChild {
  selectContext.use(props.part);
  const content = selectContentContext.useOptional();
  const context = selectContext.use(props.part);
  const [visible, setVisible] = useSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  // Shown only when the viewport can scroll further in this direction.
  useEffect(() => {
    const viewport = content?.viewport();
    if (viewport === undefined) return;
    // Items arriving or changing text can change the scroll range.
    context.collection.items();
    const update = (): void => {
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      setVisible(props.direction === -1 ? viewport.scrollTop > 0 : viewport.scrollTop < maxScroll);
    };
    update();
    viewport.addEventListener("scroll", update);
    onCleanup(() => viewport.removeEventListener("scroll", update));
  });

  const stop = (): void => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  onCleanup(stop);
  const scrollOnce = (): void => {
    const viewport = content?.viewport();
    if (viewport === undefined) return;
    const item = viewport.querySelector<HTMLElement>('[role="option"]');
    viewport.scrollTop += props.direction * (item?.offsetHeight || 32);
  };
  const start = (): void => {
    if (timer === undefined) timer = setInterval(scrollOnce, AUTO_SCROLL_INTERVAL);
  };

  const merged = mergeElementProps(
    {
      "aria-hidden": true,
      style: { "flex-shrink": 0 },
      onPointerDown: start,
      onPointerMove: () => {
        content?.onItemLeave();
        start();
      },
      onPointerLeave: stop,
      // A mouse that is still over the button keeps scrolling; a finger that lifts, or a pointer the browser
      // took over, is done.
      onPointerUp: (event: PointerEvent) => {
        if (event.pointerType !== "mouse") stop();
      },
      onPointerCancel: stop,
    },
    props.rest,
  );
  return (
    <Show when={visible()}>
      <Polymorphic as={props.as ?? "div"} {...merged} />
    </Show>
  );
}

/**
 * A button shown at the top of the listbox while it can scroll up; pressing or hovering it scrolls
 * the viewport (a mouse keeps scrolling while it stays over the button; a finger stops when it lifts or
 * the pointer is canceled). Hidden from assistive technology (`aria-hidden`; keyboard users scroll with the arrow
 * keys). Renders nothing in the closed listbox's off-screen registry.
 *
 * @param props See {@link SelectScrollButtonProps}.
 * @returns The button while the viewport can scroll up, otherwise nothing.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.ScrollUpButton>▲</Select.ScrollUpButton>;
 * @see {@link SelectScrollDownButton}
 * @since 1.0.0
 */
export function SelectScrollUpButton<T extends PolymorphicTarget = "div">(
  props: SelectScrollButtonProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  return <ScrollButton direction={-1} part="Select.ScrollUpButton" rest={rest} as={own.as} />;
}

/**
 * A button shown at the bottom of the listbox while it can scroll down; pressing or hovering it
 * scrolls the viewport (a mouse keeps scrolling while it stays over the button; a finger stops when
 * it lifts or the pointer is canceled). Hidden from assistive technology (`aria-hidden`). Renders
 * nothing in the closed listbox's off-screen registry.
 *
 * @param props See {@link SelectScrollButtonProps}.
 * @returns The button while the viewport can scroll down, otherwise nothing.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.ScrollDownButton>▼</Select.ScrollDownButton>;
 * @see {@link SelectScrollUpButton}
 * @since 1.0.0
 */
export function SelectScrollDownButton<T extends PolymorphicTarget = "div">(
  props: SelectScrollButtonProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  return <ScrollButton direction={1} part="Select.ScrollDownButton" rest={rest} as={own.as} />;
}

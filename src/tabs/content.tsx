import { onCleanup, splitProps, useEffect } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { useAnimationGuard } from "../collapsible/mount-animation";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { tabsContext } from "./context";

/**
 * Own props of {@link TabsContent}, on top of the attributes of the chosen element (a `div` by
 * default).
 *
 * Accessibility: the panel is a `role="tabpanel"` with `tabindex="0"`, so keyboard users can reach its
 * content, and `aria-labelledby` names its tab. The panel handles no keys of its own.
 *
 * Data attributes: `data-state` (`"active"` or `"inactive"`) and `data-orientation` (`"horizontal"` or
 * `"vertical"`), both always set. An inactive panel that is force-mounted also has the `hidden`
 * attribute.
 * @since 1.0.0
 * @see {@link TabsContent}
 */
export interface TabsContentOwnProps {
  /**
   * The value of the tab that shows this panel.
   * @default none (required)
   */
  readonly value: string;
  /**
   * Keep the panel mounted while its tab is not selected (to keep its state or to animate it with a
   * library). An inactive force-mounted panel carries the `hidden` attribute; pass `hidden={false}` to
   * take over.
   * @default `false`
   */
  readonly forceMount?: boolean | undefined;
}

/**
 * Props of {@link TabsContent}: the own props and the attributes of the chosen element (a `div` by
 * default).
 * @since 1.0.0
 * @see {@link TabsContentOwnProps}
 */
export type TabsContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  TabsContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

type Own = Loose & TabsContentOwnProps;

/**
 * The panel of one tab: `role="tabpanel"`, labeled by its tab, focusable (`tabindex="0"`) so keyboard
 * users can reach its content, with `data-state="active" | "inactive"` and `data-orientation`. Only the
 * selected panel is mounted, and it stays until its exit animation ends, unless `forceMount` is set.
 * Keyboard and ARIA: the panel handles no keys. The tab that selects it points at it with `aria-controls`.
 *
 * @param props See {@link TabsContentProps}.
 * @returns The panel while it is mounted, else nothing.
 * @throws Error when rendered outside {@link Tabs}, with the message `[primitives] <Tabs.Content> must be used within <Tabs>.`
 * @example
 * import { Tabs } from "@shadow-js/primitives";
 *
 * export function ProfileTabs() {
 *   return (
 *     <Tabs defaultValue="profile">
 *       <Tabs.List aria-label="Account">
 *         <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="profile">Profile settings</Tabs.Content>
 *     </Tabs>
 *   );
 * }
 * @since 1.0.0
 * @see {@link Tabs}
 * @see {@link TabsContentOwnProps}
 */
export function TabsContent<T extends PolymorphicTarget = "div">(
  props: TabsContentProps<T>,
): JsxChild {
  const context = tabsContext.use("Tabs.Content");
  const [own, rest] = splitProps(partProps<Own>(props), ["as", "value", "forceMount", "children"]);
  const selected = (): boolean => context.value() === own.value;
  const presence = usePresence(() => selected() || own.forceMount === true);
  return (
    <Show when={presence.mounted()}>
      <PanelLayer own={own} rest={rest} presenceRef={presence.ref} />
    </Show>
  );
}

interface PanelLayerProps {
  readonly own: Own;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The mounted part of a panel: everything here lives exactly as long as the element. */
function PanelLayer(layer: PanelLayerProps): JsxChild {
  const context = tabsContext.use("Tabs.Content");
  const { own } = layer;
  const selected = (): boolean => context.value() === own.value;
  const idProp = (): string | undefined => (layer.rest as { id?: string }).id;
  const contentId = (): string => idProp() ?? context.defaultContentId(own.value);
  // A panel that is selected from the first render (server markup, defaultValue) must not animate in.
  const prevented = useAnimationGuard(!context.ready() && selected());

  useEffect(() => {
    onCleanup(context.contents.register(own.value, contentId()));
  });

  const merged = mergeElementProps(
    {
      role: "tabpanel",
      tabindex: 0,
      get id() {
        return contentId();
      },
      get "aria-labelledby"() {
        return context.triggerIdFor(own.value);
      },
      get "data-state"() {
        return selected() ? "active" : "inactive";
      },
      get "data-orientation"() {
        return context.orientation();
      },
      get hidden() {
        return !selected() && own.forceMount === true ? true : undefined;
      },
      get style() {
        return { "animation-duration": prevented() ? "0s" : undefined };
      },
    },
    layer.rest,
    { ref: layer.presenceRef },
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {own["children"] as JsxChild}
    </Polymorphic>
  );
}

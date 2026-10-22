import { MessageScrollerButton } from "./button";
import { MessageScrollerContent } from "./content";
import { MessageScrollerItem } from "./item";
import { MessageScrollerProvider } from "./provider";
import { MessageScrollerRoot } from "./root";
import { MessageScrollerViewport } from "./viewport";

export type { MessageScrollerButtonOwnProps, MessageScrollerButtonProps } from "./button";
export type { MessageScrollerContentOwnProps, MessageScrollerContentProps } from "./content";
export type {
  ItemRecord,
  MessageScrollerContextValue,
  MessageScrollerStateProps,
  MessageScrollPosition,
  MessageScrollToOptions,
} from "./context";
export { createMessageScrollerContext, messageScrollerContext } from "./context";
export type {
  MessageAlign,
  MessageBox,
  MessageScrollEdges,
  MessageScrollMetrics,
} from "./geometry";
export {
  alignPosition,
  anchorPosition,
  clampPosition,
  edgesOf,
  prependCorrection,
  spacerHeight,
  visibilityOf,
} from "./geometry";
export type { MessageScrollerCommands } from "./hooks";
export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "./hooks";
export type { MessageScrollerItemOwnProps, MessageScrollerItemProps } from "./item";
export type { MessageScrollerProviderProps } from "./provider";
export type { MessageScrollerRootProps } from "./root";
export type {
  MessageScrollerViewportOwnProps,
  MessageScrollerViewportProps,
} from "./viewport";
export {
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerRoot,
  MessageScrollerViewport,
};

/**
 * The message scroller primitive: `MessageScroller.Provider`, `.Root`, `.Viewport`, `.Content`, `.Item` and `.Button`, plus the hooks
 * `useMessageScroller`, `useMessageScrollerScrollable` and `useMessageScrollerVisibility`. Each part is also exported by name. It keeps a streaming
 * conversation where the reader left it: a new turn goes near the top with room below it, the newest text is followed while the reader stays at the bottom,
 * older rows added above do not move what is on screen, and the transcript opens where you say. It handles scroll state and rows only: messages, AI state and
 * storage stay in your code. Keyboard: the viewport is a tab stop and scrolls with the browser's own keys; the button is a native button. ARIA: the viewport is a
 * labeled region and the content is a polite `log` that announces each new row once.
 *
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Chat(props: { readonly turns: readonly { readonly id: string; readonly mine: boolean }[] }) {
 *   return (
 *     <MessageScroller.Provider autoScroll>
 *       <MessageScroller.Root class="relative h-96">
 *         <MessageScroller.Viewport class="h-full overflow-y-auto">
 *           <MessageScroller.Content>
 *             {props.turns.map((turn) => (
 *               <MessageScroller.Item messageId={turn.id} scrollAnchor={turn.mine}>
 *                 {turn.id}
 *               </MessageScroller.Item>
 *             ))}
 *           </MessageScroller.Content>
 *         </MessageScroller.Viewport>
 *         <MessageScroller.Button aria-label="Latest" />
 *       </MessageScroller.Root>
 *     </MessageScroller.Provider>
 *   );
 * }
 * @since 1.0.0
 * @see {@link MessageScrollerProvider}
 */
export const MessageScroller: {
  readonly Provider: typeof MessageScrollerProvider;
  readonly Root: typeof MessageScrollerRoot;
  readonly Viewport: typeof MessageScrollerViewport;
  readonly Content: typeof MessageScrollerContent;
  readonly Item: typeof MessageScrollerItem;
  readonly Button: typeof MessageScrollerButton;
} = {
  Provider: MessageScrollerProvider,
  Root: MessageScrollerRoot,
  Viewport: MessageScrollerViewport,
  Content: MessageScrollerContent,
  Item: MessageScrollerItem,
  Button: MessageScrollerButton,
};

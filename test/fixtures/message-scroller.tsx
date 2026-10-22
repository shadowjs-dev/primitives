import type { Accessor } from "@shadow-js/core";
import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  MessageScroller,
  type MessageScrollerProviderProps,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "../../src/index";

export interface Row {
  readonly id: string;
  readonly anchor?: boolean;
}

interface DemoProps extends MessageScrollerProviderProps {
  rows: Accessor<readonly Row[]>;
  preserveScrollOnPrepend?: boolean;
  busy?: boolean;
}

/** A full scroller: the rows, the viewport and a button that scrolls to the end. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <MessageScroller.Provider
      autoScroll={props.autoScroll}
      defaultScrollPosition={props.defaultScrollPosition}
      scrollEdgeThreshold={props.scrollEdgeThreshold}
      scrollMargin={props.scrollMargin}
      scrollPreviousItemPeek={props.scrollPreviousItemPeek}
    >
      <MessageScroller.Root data-testid="root">
        <MessageScroller.Viewport data-testid="viewport" preserveScrollOnPrepend={props.preserveScrollOnPrepend}>
          <MessageScroller.Content data-testid="content" aria-busy={props.busy} spacerClassName="spacer">
            <For each={props.rows()}>
              {(row) => (
                <MessageScroller.Item messageId={row.id} scrollAnchor={row.anchor} data-testid={`row-${row.id}`}>
                  {row.id}
                </MessageScroller.Item>
              )}
            </For>
          </MessageScroller.Content>
        </MessageScroller.Viewport>
        <MessageScroller.Button behavior="auto" data-testid="end-button" aria-label="Latest" />
        <MessageScroller.Button behavior="auto" direction="start" data-testid="start-button" aria-label="First" />
        <MessageScroller.Button data-testid="smooth-button" aria-label="Smooth" />
      </MessageScroller.Root>
    </MessageScroller.Provider>
  );
}

/** Reads the hooks and shows them. */
export function Hooked(props: { rows: Accessor<readonly Row[]>; onCommands?: ((commands: ReturnType<typeof useMessageScroller>) => void) | undefined }): JsxChild {
  return (
    <MessageScroller.Provider>
      <Probe onCommands={props.onCommands} />
      <MessageScroller.Viewport data-testid="viewport">
        <MessageScroller.Content>
          <For each={props.rows()}>
            {(row) => (
              <MessageScroller.Item messageId={row.id} scrollAnchor={row.anchor} data-testid={`row-${row.id}`}>
                {row.id}
              </MessageScroller.Item>
            )}
          </For>
        </MessageScroller.Content>
      </MessageScroller.Viewport>
    </MessageScroller.Provider>
  );
}

function Probe(props: { onCommands?: ((commands: ReturnType<typeof useMessageScroller>) => void) | undefined }): JsxChild {
  const commands = useMessageScroller();
  props.onCommands?.(commands);
  const { start, end } = useMessageScrollerScrollable();
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  return (
    <p data-testid="probe">
      <span data-testid="start">{String(start())}</span>
      <span data-testid="end">{String(end())}</span>
      <span data-testid="anchor">{currentAnchorId() ?? "none"}</span>
      <span data-testid="visible">{visibleMessageIds().join(",")}</span>
    </p>
  );
}

/** A part used without its provider. */
export function Orphan(): JsxChild {
  return <MessageScroller.Viewport>orphan</MessageScroller.Viewport>;
}

/** The hook used without its provider. */
export function OrphanHook(): JsxChild {
  useMessageScroller();
  return <span />;
}

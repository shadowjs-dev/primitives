import { useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Dialog, MessageScroller, Questionnaire, useMessageScroller } from "../../src/index";

/** A dialog whose `modal` flag the test flips while it is open. */
export function ModalToggle(props: { setModal: (set: (modal: boolean) => void) => void }): JsxChild {
  const [modal, setModal] = useSignal(true);
  props.setModal((next) => setModal(next));
  return (
    <Dialog defaultOpen modal={modal()}>
      <Dialog.Content data-testid="content">
        <Dialog.Title>Title</Dialog.Title>
        <button type="button" data-testid="inside">
          Inside
        </button>
      </Dialog.Content>
    </Dialog>
  );
}

/** A multiple-choice question whose middle choice is disabled. */
export function DisabledCheckbox(): JsxChild {
  return (
    <Questionnaire data-testid="form">
      <Questionnaire.Item name="many" multiple>
        <Questionnaire.Title>Pick any</Questionnaire.Title>
        <Questionnaire.Choices>
          <Questionnaire.Choice value="a">
            <Questionnaire.ChoiceInput data-testid="input-a" />
            <Questionnaire.ChoiceLabel>A</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
          <Questionnaire.Choice value="b" disabled>
            <Questionnaire.ChoiceInput data-testid="input-b" />
            <Questionnaire.ChoiceLabel>B</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
          <Questionnaire.Choice value="c">
            <Questionnaire.ChoiceInput data-testid="input-c" />
            <Questionnaire.ChoiceLabel>C</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
        </Questionnaire.Choices>
      </Questionnaire.Item>
    </Questionnaire>
  );
}

/** Three optional questions; the middle one appears after the first render. */
export function LateMiddle(props: { setShown: (set: (shown: boolean) => void) => void }): JsxChild {
  const [shown, setShown] = useSignal(false);
  props.setShown((next) => setShown(next));
  return (
    <Questionnaire data-testid="form">
      <Questionnaire.Item name="first" data-testid="first">
        <Questionnaire.Title>First</Questionnaire.Title>
      </Questionnaire.Item>
      <Show when={shown()}>
        <Questionnaire.Item name="middle" data-testid="middle">
          <Questionnaire.Title>Middle</Questionnaire.Title>
        </Questionnaire.Item>
      </Show>
      <Questionnaire.Item name="last" data-testid="last">
        <Questionnaire.Title>Last</Questionnaire.Title>
      </Questionnaire.Item>
      <Questionnaire.Skip data-testid="skip">Skip</Questionnaire.Skip>
    </Questionnaire>
  );
}

/** Three choices with letter shortcuts; the middle one appears after the first render. */
export function LateChoice(props: { setShown: (set: (shown: boolean) => void) => void }): JsxChild {
  const [shown, setShown] = useSignal(false);
  props.setShown((next) => setShown(next));
  return (
    <Questionnaire shortcuts="letters" data-testid="form">
      <Questionnaire.Item name="pick">
        <Questionnaire.Title>Pick</Questionnaire.Title>
        <Questionnaire.Choices>
          <Questionnaire.Choice value="one" data-testid="one">
            <Questionnaire.ChoiceInput />
          </Questionnaire.Choice>
          <Show when={shown()}>
            <Questionnaire.Choice value="two" data-testid="two">
              <Questionnaire.ChoiceInput />
            </Questionnaire.Choice>
          </Show>
          <Questionnaire.Choice value="three" data-testid="three">
            <Questionnaire.ChoiceInput />
          </Questionnaire.Choice>
        </Questionnaire.Choices>
      </Questionnaire.Item>
    </Questionnaire>
  );
}

/** Reads the scroller commands for the test. */
function Commands(props: {
  onCommands: (commands: ReturnType<typeof useMessageScroller>) => void;
}): JsxChild {
  props.onCommands(useMessageScroller());
  return null;
}

/** Rows "a" and "b", then a third whose id changes while its element stays (a temporary id replaced by the server's). */
export function RenamedMessage(props: {
  setId: (set: (id: string) => void) => void;
  onCommands: (commands: ReturnType<typeof useMessageScroller>) => void;
}): JsxChild {
  const [id, setId] = useSignal("tmp");
  props.setId((next) => setId(next));
  return (
    <MessageScroller.Provider defaultScrollPosition="start">
      <Commands onCommands={props.onCommands} />
      <MessageScroller.Viewport data-testid="viewport">
        <MessageScroller.Content>
          <MessageScroller.Item messageId="a">a</MessageScroller.Item>
          <MessageScroller.Item messageId="b">b</MessageScroller.Item>
          <MessageScroller.Item messageId={id()}>c</MessageScroller.Item>
        </MessageScroller.Content>
      </MessageScroller.Viewport>
    </MessageScroller.Provider>
  );
}

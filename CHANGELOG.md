# Changelog

## 1.0.4

### Changed

- Released at 1.0.4 with the other packages, which share one version. No change to this package.

## 1.0.3

### Changed

- Released at 1.0.3 with the other packages, which share one version. No change to this package.

## 1.0.2

### Fixed

- Dialog: `aria-modal` now follows the `modal` prop while the dialog is open.
- Questionnaire: Arrow Up/Down on a multiple-choice question no longer gets stuck when a choice is disabled; it wraps among the enabled boxes.
- Questionnaire: a question or choice that appears between two others is ordered by its place on the page (next/previous, progress, letter and number shortcuts), not by when it mounted.
- Toast: `toaster.promise` with a source function that throws before returning a promise now ends as a failed toast and a rejected `result`, instead of leaving a loading toast that never closes.
- MessageScroller: `scrollToMessage` finds a message by its current id when the id of a mounted row changes.
- Slider: a `step` that is zero, negative or not a number is read as 1 (it used to make the keyboard do nothing); a development warning (`SLIDER_INVALID_STEP`) names it. A `NaN` in a controlled value reads as the minimum instead of reaching `aria-valuenow` and the thumb's style.
- ScrollArea: dragging a thumb listens on the window of the thumb's own document, so a thumb inside an iframe follows the frame's pointer.
- Toast: `createToaster` takes `maxWaiting` (default 100); toasts waiting for a free slot past it are dropped, oldest first.

## 1.0.1

### Changed

- Released at 1.0.1 with the other packages, which share one version. No change to this package.

## 1.0.0

### Added

- `MessageScroller` (provider, root, viewport, content, item, button, and the `useMessageScroller`, `useMessageScrollerScrollable` and `useMessageScrollerVisibility` hooks): a conversation scroller that follows new text while the reader is at the bottom, anchors a new turn to the top of the window, opens a saved thread at a chosen position, keeps the reader's place when older messages are added, and jumps to the latest. The viewport is a named region and the content is a `role="log"`.
- `Questionnaire` (root, progress, item, title, description, choices, choice, input, error, previous, skip, next, submit): a multi-step form with native form values, validation, skippable questions, letter or number shortcuts, arrow-key navigation that follows the reading direction, and a named progress bar.
- Select scroll buttons stop when a finger lifts or the pointer is canceled; a mouse over a button keeps scrolling.
- Composable headless UI parts with keyboard, focus, ARIA, positioning and presence utilities.
- Reading-direction support and locale-aware number input.
- Progress label and visible value parts share the root's accessible name and value formatting.
- One-time code input normalizes Arabic-Indic and Persian digits for typing, paste, autofill and form submission.
- OTP character filters and an opt-in pattern factory support custom codes with bounded input work; slot validation, cleanup, disabled submission and form reset are covered.

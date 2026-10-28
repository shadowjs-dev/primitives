# Changelog

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

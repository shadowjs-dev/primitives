<p align="center"><img src="https://raw.githubusercontent.com/shadowjs-dev/primitives/main/.github/banner.png" alt="ShadowJS" width="100%"></p>

# @shadow-js/primitives

[![npm](https://img.shields.io/npm/v/@shadow-js/primitives.svg)](https://www.npmjs.com/package/@shadow-js/primitives)
[![CI](https://github.com/shadowjs-dev/primitives/actions/workflows/ci.yml/badge.svg)](https://github.com/shadowjs-dev/primitives/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://github.com/shadowjs-dev/primitives/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

Headless, accessible, unstyled UI primitives for ShadowJS 1.0.0: the layer a shadcn-style kit with
Tailwind sits on (the Radix / Kobalte / Ark equivalent). Every primitive is a set of composable
parts, follows the WAI-ARIA Authoring Practices for keyboard and focus, renders on the server and
hydrates, and ships no CSS.

## Install

```sh
npm install @shadow-js/primitives @shadow-js/core @shadow-js/web
```

ShadowJS 1.0.0 is not on npm yet. Until it is published, install it from this repository.
`@shadow-js/core` and `@shadow-js/web` are peer dependencies, so install them next to it.

## Quick start

Import a primitive from the root entry and compose its parts. The example is a dialog; the classes
are placeholders for your own styles.

```tsx
import { Dialog } from "@shadow-js/primitives";

<Dialog>
  <Dialog.Trigger class="btn">Edit profile</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 data-[state=open]:animate-in" />
    <Dialog.Content class="fixed left-1/2 top-1/2 ...">
      <Dialog.Title>Edit profile</Dialog.Title>
      <Dialog.Description>Make changes to your profile here.</Dialog.Description>
      <Dialog.Close>Done</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog>
```

## Conventions shared by every primitive
- **Controlled and uncontrolled**: `open` / `defaultOpen` / `onOpenChange`, `value` / `defaultValue` /
  `onValueChange`. A prop that is `undefined` means uncontrolled.
- **Polymorphism**: every part takes a typed `as` (a tag name from `POLYMORPHIC_TAGS`, or a component
  that spreads its props on one element). `<Dialog.Trigger as="a" href="/x" />` is checked against the
  anchor's attributes; `href` on the default button is a compile error.
- **Props forwarding**: handlers compose (yours runs first and can `preventDefault()` to veto the
  built-in behavior), `class` and `style` merge, `ref` is forwarded.
- **Styling hooks**: `data-state`, `data-disabled`, `data-orientation`, `data-side`, `data-align`,
  `data-highlighted`, `data-placeholder`, plus CSS variables such as `--primitives-available-height`,
  `--primitives-anchor-width`, `--primitives-collapsible-content-height`.
- **Animation**: parts that appear and disappear stay mounted until their exit animation or
  transition has ended; `forceMount` hands mounting to an animation library.
- **Direction**: `dir="rtl"` (or `DirectionProvider`) flips horizontal keys and placement.
- **Server rendering**: ids come from the hydration scope, so the markup the server sends is what the
  client hydrates. A portal that is open at render time is server-rendered too: its markup goes to
  the end of `<body>` and hydration adopts it. Other portals mount on the client.
- **No layout shift**: scroll locking compensates the scrollbar width, positioned content never
  moves the page.

## Components
| Primitive | Parts | Pattern |
|---|---|---|
| Dialog, AlertDialog | Trigger, Portal, Overlay, Content, Title, Description, Close (Cancel, Action) | modal / alert dialog |
| Popover | Trigger, Anchor, Portal, Content, Arrow, Title, Description, Close | non-modal dialog |
| Tooltip (Provider) | Trigger, Portal, Content, Arrow | tooltip with delay group and hover intent |
| HoverCard | Trigger, Portal, Content, Arrow | preview on hover and focus |
| DropdownMenu, ContextMenu, Menubar | Item, CheckboxItem, RadioGroup, RadioItem, Sub, SubTrigger, SubContent, Label, Separator... | menu / menubar |
| Select | Trigger, Value, Content, Viewport, Item, Group, Label... | select-only combobox |
| Combobox | Input, Trigger, Content, Item, Chips, Empty, Loading... | editable combobox, list autocomplete |
| Tabs | List, Trigger, Content | tabs |
| Accordion, Collapsible | Item, Header, Trigger, Content | accordion, disclosure |
| Switch, Checkbox, RadioGroup, Toggle, ToggleGroup | Thumb, Indicator, Item | switch, tri-state checkbox, radio group |
| Slider, NumberField | Track, Range, Thumb / Input, Increment, Decrement | slider (multi-thumb), spinbutton |
| Progress, Separator, Label | Indicator, Label, Value (Progress) | progressbar, separator, label |
| Toast | Provider, Viewport, Title, Description, Action, Close + `createToaster` | alert / status live region |
| Pagination | List, Item, Previous, Next, Ellipsis + `getPaginationRange` | navigation landmark |
| MessageScroller | Provider, Root, Viewport, Content, Item, Button + `useMessageScroller`, `useMessageScrollerScrollable`, `useMessageScrollerVisibility` | conversation log that follows new text and keeps the reader's place |
| Questionnaire | Progress, Item (Title, Description, Choices, Choice, Input, Error), Previous, Skip, Next, Submit | multi-step form, one question at a time |
| OneTimePasswordField | Input + `createOneTimePasswordPattern` | one-time code slots with custom character filtering, paste and autofill |

Numeric one-time code slots accept Western, Arabic-Indic and Persian digits. Initial and controlled
values, keyboard input, paste and autofill normalize to Western digits; callbacks and form submissions
receive the normalized code. Direction controls arrow navigation independently of digit input.
For custom codes, pass a `filter` predicate or compile one with
`createOneTimePasswordPattern("^[A-F0-9]+$")`. Predicates run untracked. A reactive source should
be compiled in `useMemo`; the basic primitive does not import the regex compiler. Patterns match
one normalized UTF-16 character at a time. ASCII controls and surrogate pairs are refused.
Lengths are integers from 1 to 64 and remain fixed after mount; edits examine at most 4,096 input
units. Disabled fields do not submit a hidden value; form reset restores normalized defaults.

Development errors describe OTP misuse. Production codes are `PRIMITIVES_OTP_LENGTH` (invalid
slot count), `PRIMITIVES_OTP_INDEX` (out-of-range index), `PRIMITIVES_OTP_DUPLICATE` (duplicate
mounted index), `PRIMITIVES_OTP_PATTERN_LIMIT` (non-string or overlong pattern source) and
`PRIMITIVES_OTP_PATTERN_INVALID` (invalid regex syntax). Pattern sources are limited to 256 characters.

Other production codes: `PRIMITIVES_CONTEXT` (a part used outside its root), `PRIMITIVES_HANDLERS` (several
merged event handlers threw) and `PRIMITIVES_LAYERS` (several layer handlers threw).

## Build the same things yourself
`@shadow-js/primitives/utils` exports the infrastructure the primitives are made from: `Polymorphic`,
`mergeElementProps`, `useControllableState`, `createPartContext`, `useBaseId`, `usePresence`,
`useFocusScope`, `getTabbables`, `DismissableLayer` / `registerLayer` (the per-document layer stack),
`lockScroll`, `hideOthers`, `computePosition` / `usePosition`, `createTypeahead`,
`createCollection`, `useRovingFocus`, `announce`, `VisuallyHidden`, `HiddenInput`, `useDirection`.

## Build
Sources are TSX and are compiled with `@shadow-js/compiler` (`tsdown.config.mjs`): the `dom` target
for the browser builds and the `ssr` target for the `dist/server` builds, which the `node`, `worker`,
`deno` and `bun` export conditions resolve to.

## Dependencies

- Runtime: none.
- Peers: `@shadow-js/core` and `@shadow-js/web` `^1.0.0`: state and rendering for the headless components.

## Types

- Names from the root: `createCollection`, `createTypeahead`, `useControllableState`, `Polymorphic`.
- Type tests in `test-types/` run with `npm run typecheck`.

## Support

- Node.js `>=22.12.0`. ESM only: use `import`; `require` is not supported.
- Browsers: current evergreen releases.
- Versioning: every `@shadow-js/*` package releases together at one version. Upgrade them as one set.
- Documentation: [ShadowJS documentation](https://shadowjs.net).

## Using, changing and contributing

- **Use the package** (a person or a coding agent that builds with it): this README, and [SKILL.md](SKILL.md), the short page an agent reads first.
- **Change the package** (fix a bug, add a feature): [AGENTS.md](AGENTS.md) says how the repository is laid out, how to implement and test a change, and how a pull request is reviewed. It is written for people and coding agents alike.
- **Take part**: [CONTRIBUTING.md](CONTRIBUTING.md) is the short guide; [SECURITY.md](SECURITY.md) is for vulnerabilities.

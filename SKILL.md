---
name: shadowjs-primitives
description: "Work with @shadow-js/primitives. Unstyled, accessible building blocks such as dialog, popover, menu, select and tabs. Use when a project imports it, or when asked to add, configure or debug it."
---

# @shadow-js/primitives

Version 1.0.2. Unstyled, accessible building blocks such as dialog, popover, menu, select and tabs.

## Where to read more

- @shadow-js/primitives: https://primitives.shadowjs.net
- Source and issues: https://github.com/shadowjs-dev/primitives
- The package README is the full reference for options and behavior; read it before changing a configuration.

## Install

```sh
npm install @shadow-js/primitives @shadow-js/core @shadow-js/web
```

## Peer dependencies

| Package | Range | Required |
| --- | --- | --- |
| `@shadow-js/core` | `^1.0.2` | yes |
| `@shadow-js/web` | `^1.0.2` | yes |

## Import paths

Import only from these paths. Never from `dist` or `src`: files that are not listed here are private and change without notice.

- `@shadow-js/primitives`
- `@shadow-js/primitives/accordion`
- `@shadow-js/primitives/alert-dialog`
- `@shadow-js/primitives/calendar`
- `@shadow-js/primitives/checkbox`
- `@shadow-js/primitives/collapsible`
- `@shadow-js/primitives/combobox`
- `@shadow-js/primitives/context-menu`
- `@shadow-js/primitives/dialog`
- `@shadow-js/primitives/dropdown-menu`
- `@shadow-js/primitives/hover-card`
- `@shadow-js/primitives/label`
- `@shadow-js/primitives/menu`
- `@shadow-js/primitives/menubar`
- `@shadow-js/primitives/navigation-menu`
- `@shadow-js/primitives/number-field`
- `@shadow-js/primitives/one-time-password`
- `@shadow-js/primitives/pagination`
- `@shadow-js/primitives/password-toggle-field`
- `@shadow-js/primitives/popover`
- `@shadow-js/primitives/popper`
- `@shadow-js/primitives/progress`
- `@shadow-js/primitives/radio-group`
- `@shadow-js/primitives/scroll-area`
- `@shadow-js/primitives/select`
- `@shadow-js/primitives/separator`
- `@shadow-js/primitives/slider`
- `@shadow-js/primitives/switch`
- `@shadow-js/primitives/tabs`
- `@shadow-js/primitives/toast`
- `@shadow-js/primitives/toggle`
- `@shadow-js/primitives/toggle-group`
- `@shadow-js/primitives/toolbar`
- `@shadow-js/primitives/tooltip`
- `@shadow-js/primitives/utils`

## Quick start

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

## Working rules

- Run `npm run check` before proposing a change; it lints, builds, type-checks and tests.
- Keep a public change documented: TSDoc on every exported symbol, and a CHANGELOG entry.
- To change this repository rather than use the package, read AGENTS.md: the layout, the commands, the rules and how a pull request is reviewed.

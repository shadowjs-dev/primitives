# AGENTS.md: working on primitives

This file is for anyone who changes this repository, people and coding agents alike. It says how the repository is laid out, how to implement
and test a change, and how a pull request is reviewed. To **use** the released package, read [README.md](README.md) and [SKILL.md](SKILL.md)
instead; to take part in the project, read [CONTRIBUTING.md](CONTRIBUTING.md).

Unstyled, accessible UI primitives with left-to-right and right-to-left support.

## What is in this repository

| Package | Folder | What it is | Documentation |
| --- | --- | --- | --- |
| `@shadow-js/primitives` | `.` | Unstyled, accessible building blocks such as dialog, popover, menu, select and tabs | https://primitives.shadowjs.net |

The repository is the package: `@shadow-js/primitives`. Source and issues:
https://github.com/shadowjs-dev/primitives. Every package of the project has the same version number.

## Set up

You need Node.js 22.12 or newer and npm (pnpm and Yarn are not used).

```sh
npm install
npm run check   # lint, build, type check and every test
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run lint` | Biome: lint and format check (`npx biome check --write <path>` fixes what it can) |
| `npm run build` | builds the package with tsdown |
| `npm run typecheck` | TypeScript 7 in strict mode, tests included |
| `npm test` | unit, DOM and server tests (Vitest) |
| `npx vitest run <path>` | one test file |
| `npm run test:gc` | memory and leak tests |
| `npm run test:perf` | wall-clock budgets; run alone, never in parallel with other work |
| `npm run check` | all of the above; a change is ready when it passes |

## Layout

- `.github/`: workflows, issue and pull request templates, code owners.
- `build/`: the shared tsdown preset every package build uses.
- `scripts/`: build and release scripts; `release.mjs` is run by the workflows.
- `src/`: the source of the package; one folder per concern, `index.ts` re-exports the public API. Folders: `accordion/`, `alert-dialog/`, `calendar/`, `checkbox/`, `collapsible/`, `combobox/`, `context-menu/`, `dialog/`, `dropdown-menu/`, `hover-card/`, `internal/`, `label/`, `menu/`, `menubar/`, `message-scroller/`, `navigation-menu/`, `number-field/`, `one-time-password/`, `pagination/`, `password-toggle-field/`, `popover/`, `popper/`, `progress/`, `questionnaire/`, `radio-group/`, `scroll-area/`, `select/`, `separator/`, `slider/`, `switch/`, `tabs/`, `toast/`, `toggle/`, `toggle-group/`, `toolbar/`, `tooltip/`, `utils/`.
- `test/`: the tests; one file per behavior, each test named by an invariant id such as `[ROUTER-12]`.
- `test-types/`: type-level tests: what the package promises to the compiler of its users.
- `types/`: ambient declarations shared with the build.
- `CHANGELOG.md`: what each release changed.
- `biome.json`: lint and format rules.
- `package.json`: the manifest; `version` is changed only by a release.
- `tsconfig.json`: type check of the source.
- `tsdown.config.mjs`: the build.
- `vitest.config.ts`: the test projects (unit, DOM, server, gc, perf).
- `vitest.setup.ts`: test setup: an unasserted `console.warn` or `console.error` fails a test.

## How to implement a change

1. **Find where the behavior lives.** Search `test/` and `src/` for the name of the behavior or its invariant id, then read the source the tests exercise. The invariants below say what must stay true.
2. **Write the failing test first.** A bug fix reproduces the bug; a feature states the behavior it promises. Name the test with an invariant id in square brackets, the way the neighboring tests do, then the behavior in words. The test asserts what the code does and is never skipped, marked as todo or marked as an expected failure.
3. **Make it pass with the smallest change** that keeps the invariants. Match the code around it.
4. **Keep the surface honest.** A public symbol has TSDoc (summary, parameters, return value, an example and `@since`). An error says what happened and how to fix it. User-visible behavior gets a documentation update and a line under `## Unreleased` in CHANGELOG.md.
5. **Run `npm run check`** and read its output; do not report a change as done without it passing.

### Rules every change keeps

- No `any`, `@ts-ignore` or non-null assertion. Use `unknown` and narrow.
- Compare indices, lengths and counts explicitly (`=== undefined`, `=== -1`, `> 0`), never by truthiness.
- No empty `catch`: every catch rethrows, passes the error to the owner's handler, or reports it. Every "set the current X" register is restored in `finally`.
- User callbacks run untracked unless the API says otherwise. No stack parsing, no `fn.name` sniffing, no flags stamped on user functions.
- Traversals whose depth the user controls are iterative. Caches, queues and recursion are bounded, and a test hits the bound.
- Code meant for development only sits behind `__DEV__`. No import-time side effects and no module-level mutable state beyond the registers the core owns (bounded caches and `WeakMap`s excepted).
- No sleeps in tests (flush the scheduler); a `console.warn` or `console.error` that a test does not assert fails the test. Property tests use `fast-check` with a fixed seed.
- Files are kebab-case, tests are `*.test.ts`, internals live in `src/internal/`. American English in code, comments and documentation. Comments explain why, not what.
- The reactive core and the DOM renderer have no runtime dependencies.

## Pull requests

1. **Open an issue first** for anything that adds or changes public API, behavior, supported platforms or dependencies. A small fix needs no issue.
2. **Fork, then branch from `main`** (`fix/<topic>`, `feat/<topic>`, `docs/<topic>`). One concern per pull request.
3. **Commit in small steps** with a message that says what changed and why: a short type prefix (`fix:`, `feat:`, `docs:`, `test:`, `chore:`), then the subject. Commit under your own identity; do not add trailers or notes about tools.
4. **Open the pull request against `main`** and fill in the template: what changes, why, and the checks you ran. The CI workflow (`.github/workflows/ci.yml`) runs lint, build, type check and all tests; it must be green.
5. **Review.** A maintainer (see `.github/CODEOWNERS`) reviews every pull request. Expect questions about the test, the public surface and the error messages. Push fixes to the same branch; the pull request is squash-merged.
6. **Releases are not part of a pull request.** Do not change `version`, `.github/workflows/release.yml` or `scripts/release.mjs`, and do not create tags or publish. A maintainer releases by renaming `## Unreleased` in the changelog to the version and pushing a version that is not yet on npm to `main`; the workflow publishes it with provenance.

Security problems never go in a public issue or pull request: follow [SECURITY.md](SECURITY.md).

## Architecture and invariants

What each package keeps true. A change that breaks one of these is a bug in the change.

This package is the headless, accessible, unstyled layer a
shadcn-style kit is built on (the Radix / Kobalte / Ark equivalent). Everything here follows the
WAI-ARIA Authoring Practices keyboard and focus model.

### Layout
```
src/utils/        infrastructure, exported publicly via `@shadow-js/primitives/utils` (src/utils.ts)
src/<component>/  one folder per primitive, `index.ts` barrel + one file per part (kebab-case)
src/index.ts      public barrel (components + `export * from "./utils/index"`)
test/             `*.dom.test.ts` (happy-dom), `*.test.ts` (node, pure math / property tests)
test/fixtures/    `.tsx` apps that use the primitives; compiled for BOTH targets by the test harness
test/support/     compile.ts (compiler pipeline), dom.ts (key/pointer/press/trackListeners/ssrAndHydrate)
test-types/       type tests (`@ts-expect-error` proves misuse is rejected)
```
Source is TSX and is compiled with `@shadow-js/compiler` (build: `tsdown.config.mjs`; tests:
`test/support/compile.ts`; both use `autoReactive: false` for library code, so write accessors
explicitly: `props.open`, `useMemo(...)`, `() => ...`). A fixture in `test/fixtures` is compiled the
way an application is (forgiving reactivity on) for `dom` and `ssr`; load it with
`loadFixture("dom" | "ssr", "<name>")`.

### Imports
`src` imports only `@shadow-js/core`, `@shadow-js/core/extend`, `@shadow-js/web`,
`@shadow-js/web/extend` and `@shadow-js/web/jsx-runtime` (types). Never a deep path, never another
workspace package. Tests may import `../../testing/src/dom` (`render`, `fireEvent`, `cleanup`).

### Component conventions (all parts)
- A primitive is a set of composable parts built on context: `Dialog`, `Dialog.Trigger`,
  `Dialog.Content`... Export `const Dialog: typeof DialogRoot & { Trigger: typeof DialogTrigger; ... }
  = Object.assign(DialogRoot, {...})` (explicit type: isolatedDeclarations) and ALSO each part by
  name (`DialogTrigger`) for tree shaking.
- Optional props are declared `readonly name?: T | undefined` (the repo compiles with `exactOptionalPropertyTypes`,
  so forwarding a possibly-undefined value must be legal).
- Controlled AND uncontrolled: `open` / `defaultOpen` / `onOpenChange`; `value` / `defaultValue` /
  `onValueChange` through `useControllableState`. Controlled means `props.value !== undefined`.
- Polymorphism: every part that renders an element takes `as` (typed with `PolymorphicProps`) and
  renders through `Polymorphic`. Props are `splitProps`-ed, never destructured (reactivity).
- Props reach the element through `mergeElementProps(internalProps, rest)`: application handlers run
  first and may `preventDefault()` to veto the built-in behavior, `class`/`style`/`ref` merge.
- Styling hooks: `data-state` (`open`/`closed`, `checked`/`unchecked`/`indeterminate`, `active`/`inactive`,
  `on`/`off`), `data-disabled` (present, value `""`), `data-orientation`, `data-side`, `data-align`,
  `data-highlighted`, `data-placeholder`. Never ship CSS.
- ids: ONE `useId()` call in the root part, derived ids (`${base}-trigger`) shared through context.
  The same ids must come out on the server and the client. An `id` prop on a part overrides its id.
- ARIA: relationships (`aria-controls`, `aria-labelledby`, `aria-describedby`) point at ids that exist;
  use `usePartRegistration` so a label/description reference is only emitted while that part is
  mounted.
- Presence: content that can animate out is wrapped with `usePresence`; `forceMount` keeps it mounted.
- Direction: read it with `useDirection(props.dir)` (RTL flips horizontal arrow keys and alignment).
- Every part must render with `renderToString` and hydrate onto the same nodes (no comment nodes,
  no DOM access outside effects/handlers/`onMount`; guard `document`/`window` use with effects or
  event handlers, never at render time).
- Cleanup: every listener/observer/timer registered is removed on disposal (`onCleanup`).
  Tests prove it with `trackListeners()`.
- A part used outside its root throws `Error("<Dialog.Trigger> must be used within <Dialog>")` (use
  `createPartContext`).
- Dev warnings go through `console.warn` behind `__DEV__` with a `[primitives CODE]` prefix; tests
  that expect them assert on `console.warn.mock.calls` and `mockClear()`.

### Tests
- Test first; ids `[DLG-07]` (prefix per component); `*.dom.test.ts` for DOM, `*.test.ts` for pure
  logic. No sleeps, no `.skip`/`.only`, `flushSync()` (the helpers in `test/support/dom.ts` flush).
  Un-asserted `console.warn/error` fails a test. Do not call `vi.restoreAllMocks()` (it breaks the
  console guard); restore only the spies you created.
- Behavior, not snapshots: keyboard sequences, focus movement, ARIA attributes/relationships,
  controlled vs uncontrolled, SSR + hydration parity (same elements kept, ids equal), unmount cleanup
  (`trackListeners`), property tests (`fast-check`, fixed seed `{ seed: 42 }`) for pure math.
- happy-dom has no layout: stub `getBoundingClientRect`, `offsetWidth`, etc. explicitly in the test.
- Module identity: fixtures run the COMPILED copy of `src` (`test/.generated/<target>/src`). A test that imports
  `../src/...` directly gets a different module instance than the fixtures, so any state kept in a module
  (WeakMap stacks, registries) must be read through `loadSource("dom", "utils/layer-stack")`, never through a
  direct `../src` import, when the same test also renders fixtures.

## Where to look next

- [README.md](README.md): what the package does and every option.
- [SKILL.md](SKILL.md): how to use the released package (install, import paths, a quick start).
- [CONTRIBUTING.md](CONTRIBUTING.md): the short guide to taking part.
- [CHANGELOG.md](CHANGELOG.md): what each release changed.
- [ShadowJS hub](https://github.com/shadowjs-dev/shadow): every repository of the project.

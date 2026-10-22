import { ToolbarButton, ToolbarLink, ToolbarSeparator, ToolbarToggleItem } from "./items";
import { ToolbarRoot } from "./root";

export type { ToolbarContextValue } from "./context";
export { toolbarContext } from "./context";
export type {
  ToolbarButtonProps,
  ToolbarItemOwnProps,
  ToolbarLinkProps,
  ToolbarSeparatorProps,
  ToolbarToggleItemProps,
} from "./items";
export type { ToolbarOwnProps, ToolbarProps } from "./root";
export { ToolbarButton, ToolbarLink, ToolbarRoot, ToolbarSeparator, ToolbarToggleItem };

/**
 * The toolbar primitive (WAI-ARIA toolbar): `Toolbar` (a `div` with `role="toolbar"`),
 * `Toolbar.Button`, `Toolbar.Link`, `Toolbar.ToggleItem` and `Toolbar.Separator`. Each part is
 * also exported by name.
 *
 * Keyboard and ARIA: the toolbar is one tab stop. Arrow keys move between the enabled items (Left and
 * Right, or Up and Down on a vertical toolbar), Home and End jump to the first and last enabled items,
 * and Tab leaves the toolbar. See {@link ToolbarRoot} for the details.
 *
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function FormattingBar() {
 *   return (
 *     <Toolbar aria-label="Formatting">
 *       <Toolbar.Button>Bold</Toolbar.Button>
 *       <Toolbar.Separator />
 *       <Toolbar.ToggleItem>Italic</Toolbar.ToggleItem>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarRoot}
 * @see {@link ToolbarButton}
 * @since 1.0.0
 */
export const Toolbar: typeof ToolbarRoot & {
  readonly Button: typeof ToolbarButton;
  readonly Link: typeof ToolbarLink;
  readonly ToggleItem: typeof ToolbarToggleItem;
  readonly Separator: typeof ToolbarSeparator;
} = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  Link: ToolbarLink,
  ToggleItem: ToolbarToggleItem,
  Separator: ToolbarSeparator,
});

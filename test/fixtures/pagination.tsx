import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Pagination } from "../../src/pagination/index";

type Props = Record<string, unknown>;

interface DemoProps {
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageCount?: number;
  siblingCount?: number;
  boundaryCount?: number;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
  getItemLabel?: (page: number, current: boolean) => string;
  getHref?: (page: number) => string;
  rootProps?: Props;
  previousProps?: Props;
  nextProps?: Props;
}

/** The whole bar through `Pagination.Items`. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Pagination
      data-testid="root"
      page={props.page}
      defaultPage={props.defaultPage}
      onPageChange={props.onPageChange}
      pageCount={props.pageCount}
      siblingCount={props.siblingCount}
      boundaryCount={props.boundaryCount}
      disabled={props.disabled}
      dir={props.dir}
      getItemLabel={props.getItemLabel}
      getHref={props.getHref}
      {...props.rootProps}
    >
      <Pagination.List data-testid="list">
        <Pagination.Previous data-testid="previous" {...props.previousProps}>
          Previous
        </Pagination.Previous>
        <Pagination.Items />
        <Pagination.Next data-testid="next" {...props.nextProps}>
          Next
        </Pagination.Next>
      </Pagination.List>
    </Pagination>
  );
}

/** The bar drawn by a render function. */
export function Custom(props: DemoProps): JsxChild {
  return (
    <Pagination
      data-testid="root"
      pageCount={props.pageCount}
      defaultPage={props.defaultPage}
      siblingCount={props.siblingCount}
    >
      <Pagination.List data-testid="list">
        <Pagination.Items>
          {(item: number | "ellipsis-start" | "ellipsis-end") =>
            typeof item === "number" ? (
              <Pagination.Item
                page={item}
                data-testid={`page-${item}`}
                itemProps={{ "data-testid": `item-${item}`, class: "item" }}
                class="link"
              >
                {`p${item}`}
              </Pagination.Item>
            ) : (
              <Pagination.Ellipsis data-testid={item} itemProps={{ class: "gap" }}>
                ...
              </Pagination.Ellipsis>
            )
          }
        </Pagination.Items>
      </Pagination.List>
    </Pagination>
  );
}

/** Hand-written items, no `Items`. */
export function Manual(props: DemoProps): JsxChild {
  return (
    <Pagination as="div" data-testid="root" pageCount={3} defaultPage={props.defaultPage}>
      <Pagination.List as="ol" data-testid="list">
        <Pagination.Item page={1} as="a" href="#one" data-testid="one">
          1
        </Pagination.Item>
        <Pagination.Item page={2} as="span" data-testid="two">
          2
        </Pagination.Item>
        <Pagination.Ellipsis as="b" data-testid="gap" />
        <Pagination.Next as="button" data-testid="next">
          Next
        </Pagination.Next>
      </Pagination.List>
    </Pagination>
  );
}

/** A part outside its root. */
export function Orphan(): JsxChild {
  return <Pagination.Next>Next</Pagination.Next>;
}

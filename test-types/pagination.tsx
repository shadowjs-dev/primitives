// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { getPaginationRange, Pagination, type PaginationRangeItem } from "../src/pagination/index";

export const full: JsxChild = (
  <Pagination
    page={2}
    onPageChange={(page: number) => page + 1}
    pageCount={10}
    siblingCount={2}
    boundaryCount={2}
    disabled
    dir="rtl"
    getItemLabel={(page: number, current: boolean) => (current ? `Page ${page}` : `Go ${page}`)}
    getHref={(page: number) => `/p/${page}`}
    class="nav"
  >
    <Pagination.List class="list">
      <Pagination.Previous itemProps={{ class: "li" }} class="btn">
        Previous
      </Pagination.Previous>
      <Pagination.Items>
        {(item: PaginationRangeItem) =>
          typeof item === "number" ? (
            <Pagination.Item page={item} href="/x" class="btn">
              {item}
            </Pagination.Item>
          ) : (
            <Pagination.Ellipsis itemProps={{ class: "gap" }} />
          )
        }
      </Pagination.Items>
      <Pagination.Next>Next</Pagination.Next>
    </Pagination.List>
  </Pagination>
);

export const uncontrolled: JsxChild = <Pagination defaultPage={3} pageCount={5} />;
export const polymorphic: JsxChild = <Pagination as="div" />;

export const range: PaginationRangeItem[] = getPaginationRange({
  page: 3,
  pageCount: 20,
  siblingCount: 1,
  boundaryCount: 1,
});

// @ts-expect-error every item needs a page
export const itemWithoutPage: JsxChild = <Pagination.Item />;

// @ts-expect-error the page is a number
export const itemWithStringPage: JsxChild = <Pagination.Item page="2" />;

// @ts-expect-error onPageChange receives a number
export const badHandler: JsxChild = <Pagination onPageChange={(page: string) => page} />;

// @ts-expect-error pageCount is a number
export const badCount: JsxChild = <Pagination pageCount="10" />;

// @ts-expect-error getHref returns a string
export const badHref: JsxChild = <Pagination getHref={(page: number) => page} />;

// @ts-expect-error dir is ltr or rtl
export const badDir: JsxChild = <Pagination dir="up" />;

const renderBoolean = (item: boolean): string => String(item);

// @ts-expect-error the render function receives a slot, not a boolean
export const badItems: JsxChild = <Pagination.Items>{renderBoolean}</Pagination.Items>;

// @ts-expect-error the range needs a page count
export const noCount: PaginationRangeItem[] = getPaginationRange({ page: 1 });

// biome-ignore-all lint/a11y: the table renders the caller's props on a bare tag; alt text, label association and roles are the caller's to supply
/**
 * The server renderer of {@link Polymorphic} (the build's resolve rule picks it for the `ssr` target, see
 * `tsdown.config.mjs`): a closed table of JSX templates, compiled for the server, so a tag renders its
 * markup without the DOM runtime. The client renderer is `polymorphic-tags.tsx`.
 * @internal
 */
import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTag } from "./polymorphic";

/** Props handed to the element a tag renders. */
type Rest = Record<string, unknown>;

/** The children of a props object, typed for an element. */
function kids(props: Rest): JsxChild {
  return props["children"] as JsxChild;
}

/** The children of a props object as text, for elements whose content is text only. */
function text(props: Rest): string | number | null | undefined {
  return props["children"] as string | number | null | undefined;
}

/** The props of a void element: it never has children. */
function bare(props: Rest): Rest {
  return splitProps(props, ["children"])[1];
}

/** Renders one tag from a props object. */
type TagRenderer = (props: Rest) => JsxChild;

const TAGS: Record<PolymorphicTag, TagRenderer> = {
  a: (p: Rest): JsxChild => <a {...p}>{kids(p)}</a>,
  abbr: (p: Rest): JsxChild => <abbr {...p}>{kids(p)}</abbr>,
  article: (p: Rest): JsxChild => <article {...p}>{kids(p)}</article>,
  aside: (p: Rest): JsxChild => <aside {...p}>{kids(p)}</aside>,
  b: (p: Rest): JsxChild => <b {...p}>{kids(p)}</b>,
  button: (p: Rest): JsxChild => <button {...p}>{kids(p)}</button>,
  code: (p: Rest): JsxChild => <code {...p}>{kids(p)}</code>,
  dd: (p: Rest): JsxChild => <dd {...p}>{kids(p)}</dd>,
  details: (p: Rest): JsxChild => <details {...p}>{kids(p)}</details>,
  div: (p: Rest): JsxChild => <div {...p}>{kids(p)}</div>,
  dl: (p: Rest): JsxChild => <dl {...p}>{kids(p)}</dl>,
  dt: (p: Rest): JsxChild => <dt {...p}>{kids(p)}</dt>,
  em: (p: Rest): JsxChild => <em {...p}>{kids(p)}</em>,
  fieldset: (p: Rest): JsxChild => <fieldset {...p}>{kids(p)}</fieldset>,
  figure: (p: Rest): JsxChild => <figure {...p}>{kids(p)}</figure>,
  footer: (p: Rest): JsxChild => <footer {...p}>{kids(p)}</footer>,
  form: (p: Rest): JsxChild => <form {...p}>{kids(p)}</form>,
  h1: (p: Rest): JsxChild => <h1 {...p}>{kids(p)}</h1>,
  h2: (p: Rest): JsxChild => <h2 {...p}>{kids(p)}</h2>,
  h3: (p: Rest): JsxChild => <h3 {...p}>{kids(p)}</h3>,
  h4: (p: Rest): JsxChild => <h4 {...p}>{kids(p)}</h4>,
  h5: (p: Rest): JsxChild => <h5 {...p}>{kids(p)}</h5>,
  h6: (p: Rest): JsxChild => <h6 {...p}>{kids(p)}</h6>,
  header: (p: Rest): JsxChild => <header {...p}>{kids(p)}</header>,
  hr: (p: Rest): JsxChild => <hr {...bare(p)} />,
  i: (p: Rest): JsxChild => <i {...p}>{kids(p)}</i>,
  img: (p: Rest): JsxChild => <img {...bare(p)} />,
  input: (p: Rest): JsxChild => <input {...bare(p)} />,
  kbd: (p: Rest): JsxChild => <kbd {...p}>{kids(p)}</kbd>,
  label: (p: Rest): JsxChild => <label {...p}>{kids(p)}</label>,
  legend: (p: Rest): JsxChild => <legend {...p}>{kids(p)}</legend>,
  li: (p: Rest): JsxChild => <li {...p}>{kids(p)}</li>,
  main: (p: Rest): JsxChild => <main {...p}>{kids(p)}</main>,
  mark: (p: Rest): JsxChild => <mark {...p}>{kids(p)}</mark>,
  menu: (p: Rest): JsxChild => <menu {...p}>{kids(p)}</menu>,
  nav: (p: Rest): JsxChild => <nav {...p}>{kids(p)}</nav>,
  ol: (p: Rest): JsxChild => <ol {...p}>{kids(p)}</ol>,
  output: (p: Rest): JsxChild => <output {...p}>{kids(p)}</output>,
  p: (p: Rest): JsxChild => <p {...p}>{kids(p)}</p>,
  section: (p: Rest): JsxChild => <section {...p}>{kids(p)}</section>,
  small: (p: Rest): JsxChild => <small {...p}>{kids(p)}</small>,
  span: (p: Rest): JsxChild => <span {...p}>{kids(p)}</span>,
  strong: (p: Rest): JsxChild => <strong {...p}>{kids(p)}</strong>,
  summary: (p: Rest): JsxChild => <summary {...p}>{kids(p)}</summary>,
  table: (p: Rest): JsxChild => <table {...p}>{kids(p)}</table>,
  tbody: (p: Rest): JsxChild => <tbody {...p}>{kids(p)}</tbody>,
  td: (p: Rest): JsxChild => <td {...p}>{kids(p)}</td>,
  textarea: (p: Rest): JsxChild => <textarea {...p}>{text(p)}</textarea>,
  tfoot: (p: Rest): JsxChild => <tfoot {...p}>{kids(p)}</tfoot>,
  th: (p: Rest): JsxChild => <th {...p}>{kids(p)}</th>,
  thead: (p: Rest): JsxChild => <thead {...p}>{kids(p)}</thead>,
  time: (p: Rest): JsxChild => <time {...p}>{kids(p)}</time>,
  tr: (p: Rest): JsxChild => <tr {...p}>{kids(p)}</tr>,
  ul: (p: Rest): JsxChild => <ul {...p}>{kids(p)}</ul>,
};

/**
 * Renders one tag from its props on the server.
 * @param tag A tag name from {@link PolymorphicTag}.
 * @param props The props of the element.
 * @internal
 */
export function renderTag(tag: PolymorphicTag, props: Rest): JsxChild {
  return TAGS[tag](props);
}

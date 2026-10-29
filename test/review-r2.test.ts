import { describe, expect, it } from "vitest";
import { createToaster } from "../src/toast/queue";

describe("the waiting toast queue", () => {
  it("[PRIM-R2-15] holds at most maxWaiting toasts, dropping the oldest waiting ones first", () => {
    const toaster = createToaster({ limit: 1, maxWaiting: 5 });
    for (let at = 1; at <= 20; at += 1) toaster.add({ title: `t${at}` });
    expect(toaster.toasts().map((item) => item.title)).toEqual(["t1"]);
    expect(toaster.pending().map((item) => item.title)).toEqual([
      "t16",
      "t17",
      "t18",
      "t19",
      "t20",
    ]);
  });

  it("[PRIM-R2-15] the default bound is 100, and a freed slot shows the oldest toast that was kept", () => {
    const toaster = createToaster({ limit: 1 });
    for (let at = 1; at <= 500; at += 1) toaster.add({ title: `t${at}` });
    expect(toaster.pending()).toHaveLength(100);
    const first = toaster.toasts()[0];
    expect(first?.title).toBe("t1");
    toaster.remove(first?.id ?? "");
    expect(toaster.toasts().map((item) => item.title)).toEqual(["t401"]);
    expect(toaster.pending()).toHaveLength(99);
  });

  it("[PRIM-R2-15] a toast that updates a waiting one in place is not a new entry", () => {
    const toaster = createToaster({ limit: 1, maxWaiting: 2 });
    toaster.add({ title: "shown" });
    toaster.add({ title: "a", key: "k" });
    toaster.add({ title: "a again", key: "k" });
    toaster.add({ title: "b" });
    expect(toaster.pending().map((item) => item.title)).toEqual(["a again", "b"]);
  });

  it("[PRIM-R2-15] maxWaiting of 0 keeps no waiting toast; NaN means the default", () => {
    const none = createToaster({ limit: 1, maxWaiting: 0 });
    none.add({ title: "shown" });
    none.add({ title: "lost" });
    expect(none.pending()).toEqual([]);
    const unsure = createToaster({ limit: 1, maxWaiting: Number.NaN });
    for (let at = 0; at < 150; at += 1) unsure.add({ title: String(at) });
    expect(unsure.pending()).toHaveLength(100);
  });
});

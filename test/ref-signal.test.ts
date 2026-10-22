import { createRoot, flushSync, useEffect, useMemo } from "@shadow-js/core";
import { describe, expect, it } from "vitest";
import { useRefSignal } from "../src/utils/ref-signal";

describe("useRefSignal", () => {
  it("[REF-01] holds undefined first, then the written value, reactively", () => {
    createRoot((dispose) => {
      const [read, write] = useRefSignal<string>();
      const seen: Array<string | undefined> = [];
      useEffect(() => {
        seen.push(read());
      });
      flushSync();
      write("a");
      flushSync();
      write("a");
      flushSync();
      write(undefined);
      flushSync();
      expect(seen).toEqual([undefined, "a", undefined]);
      dispose();
    });
  });

  it("[REF-02] can be written while a memo computes (a ref callback inside a branch)", () => {
    createRoot((dispose) => {
      const [read, write] = useRefSignal<number>();
      const memo = useMemo(() => {
        write(1);
        return "built";
      });
      expect(memo()).toBe("built");
      expect(read()).toBe(1);
      dispose();
    });
  });
});

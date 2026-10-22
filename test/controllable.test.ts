import { createRoot, flushSync, useSignal } from "@shadow-js/core";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "../src/utils/controllable";

describe("useControllableState", () => {
  it("[CTL-01] uncontrolled: starts at the default, stores writes and reports each change", () => {
    createRoot((dispose) => {
      const changes: boolean[] = [];
      const [value, set] = useControllableState<boolean>({
        value: () => undefined,
        defaultValue: () => true,
        onChange: () => (next) => changes.push(next),
      });
      expect(value()).toBe(true);
      set(false);
      expect(value()).toBe(false);
      set(false);
      expect(changes).toEqual([false]);
      dispose();
    });
  });

  it("[CTL-02] controlled: the value follows the prop and a write only reports", () => {
    createRoot((dispose) => {
      const [controlled, setControlled] = useSignal<string | undefined>("a");
      const changes: string[] = [];
      const [value, set] = useControllableState<string>({
        value: controlled,
        defaultValue: () => "default",
        onChange: () => (next) => changes.push(next),
      });
      expect(value()).toBe("a");
      set("b");
      expect(value()).toBe("a");
      expect(changes).toEqual(["b"]);
      setControlled("b");
      expect(value()).toBe("b");
      dispose();
    });
  });

  it("[CTL-03] the updater form receives the current value", () => {
    createRoot((dispose) => {
      const [value, set] = useControllableState<number>({
        value: () => undefined,
        defaultValue: () => 1,
      });
      set((previous) => previous + 1);
      set((previous) => previous * 10);
      expect(value()).toBe(20);
      dispose();
    });
  });

  it("[CTL-04] a custom equality decides what a change is", () => {
    createRoot((dispose) => {
      const changes: number[][] = [];
      const [, set] = useControllableState<number[]>({
        value: () => undefined,
        defaultValue: () => [1, 2],
        onChange: () => (next) => changes.push(next),
        equals: (a, b) => a.length === b.length && a.every((item, index) => item === b[index]),
      });
      set([1, 2]);
      set([1, 3]);
      expect(changes).toEqual([[1, 3]]);
      dispose();
    });
  });

  it("[CTL-05] the default is read once, and onChange is read at the time of the change", () => {
    createRoot((dispose) => {
      let reads = 0;
      let listener: ((next: number) => void) | undefined;
      const [value, set] = useControllableState<number>({
        value: () => undefined,
        defaultValue: () => {
          reads += 1;
          return 5;
        },
        onChange: () => listener,
      });
      expect(value()).toBe(5);
      expect(reads).toBe(1);
      const seen: number[] = [];
      listener = (next) => seen.push(next);
      set(6);
      expect(seen).toEqual([6]);
      dispose();
    });
  });

  it("[CTL-06] switching between controlled and uncontrolled warns once per switch", () => {
    createRoot((dispose) => {
      const [controlled, setControlled] = useSignal<boolean | undefined>(undefined);
      useControllableState<boolean>({
        value: controlled,
        defaultValue: () => false,
        name: "Thing open",
      });
      flushSync();
      setControlled(true);
      flushSync();
      const warn = vi.mocked(console.warn);
      expect(warn.mock.calls).toHaveLength(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain(
        "[primitives CONTROLLED_CHANGE] Thing open",
      );
      expect(String(warn.mock.calls[0]?.[0])).toContain("uncontrolled to controlled");
      warn.mockClear();
      dispose();
    });
  });

  it("[CTL-07] a handler that writes back synchronously does not loop", () => {
    createRoot((dispose) => {
      const [controlled, setControlled] = useSignal<number | undefined>(0);
      const [value, set] = useControllableState<number>({
        value: controlled,
        defaultValue: () => 0,
        onChange: () => (next) => setControlled(next),
      });
      set(1);
      expect(value()).toBe(1);
      dispose();
    });
  });
});

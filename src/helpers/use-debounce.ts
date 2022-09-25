import { debounce } from "lodash-es";
import { memo, useCallback, useEffect } from "react";

export function useDebounce<T extends unknown[], R>(
  func: (...arg: T) => R,
  wait: number,
  deps: ReadonlyArray<unknown> = []
): (...arg: T) => R | undefined {
  const memoized = useCallback(debounce(func, wait), [func, wait, ...deps]);
  useEffect(() => {
    return () => {
      memoized.flush();
      memoized.cancel();
    };
  }, [memoized]);
  return memoized;
}

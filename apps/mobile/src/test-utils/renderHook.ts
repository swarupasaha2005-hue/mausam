import { createElement } from 'react';
import { act, create } from 'react-test-renderer';

/**
 * Minimal renderHook built on react-test-renderer (the RN/jest-expo native
 * test renderer), used instead of @testing-library/react-native's
 * renderHook — that one depends on a second, incompatible React 19
 * concurrent renderer that conflicts with jest-expo's setup.
 */
export function renderHook<T>(callback: () => T): { result: { current: T } } {
  const result = {} as { current: T };

  function TestComponent() {
    result.current = callback();
    return null;
  }

  act(() => {
    create(createElement(TestComponent));
  });

  return { result };
}

export { act };

/** Flushes pending microtasks (e.g. an effect's unresolved promise chain). */
export async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

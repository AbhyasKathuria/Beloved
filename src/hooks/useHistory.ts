import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const set = useCallback(
    (newState: T | ((curr: T) => T)) => {
      setHistory((prev) => {
        const nextHistory = prev.slice(0, index + 1);
        const resolvedState = typeof newState === 'function' 
          ? (newState as (curr: T) => T)(nextHistory[nextHistory.length - 1])
          : newState;
        return [...nextHistory, resolvedState];
      });
      setIndex((prev) => prev + 1);
    },
    [index]
  );

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex((prev) => prev + 1);
    }
  }, [index, history.length]);

  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  return {
    state: history[index],
    set,
    undo,
    redo,
    reset,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
}

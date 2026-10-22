import { useCallback, useRef, useState } from 'react';

const historyLimit = 80;
const groupWindow = 600;

interface HistoryState<T> {
  present: T;
  past: T[];
  future: T[];
}

export interface History<T> {
  present: T;
  canUndo: boolean;
  canRedo: boolean;
  commit: (recipe: (current: T) => T, groupKey?: string) => void;
  stage: (recipe: (current: T) => T) => void;
  endStage: () => void;
  undo: () => void;
  redo: () => void;
}

/**
 * Lightweight undo/redo around a single present value.
 * `commit` records a history entry; consecutive commits sharing a `groupKey`
 * (typing in one inspector field, repeated arrow nudges) collapse into one entry.
 * `stage` records a single entry for a whole gesture (drag, resize) and updates
 * the present value in place until `endStage` is called.
 */
export function useHistory<T>(create: () => T): History<T> {
  const [state, setState] = useState<HistoryState<T>>(() => ({ present: create(), past: [], future: [] }));
  const staging = useRef(false);
  const group = useRef<{ key: string | null; at: number }>({ key: null, at: 0 });

  const stage = useCallback((recipe: (current: T) => T) => {
    if (!staging.current) {
      staging.current = true;
      setState((current) => ({
        present: recipe(current.present),
        past: [...current.past, current.present].slice(-historyLimit),
        future: [],
      }));
      return;
    }
    setState((current) => ({ ...current, present: recipe(current.present) }));
  }, []);

  const endStage = useCallback(() => {
    staging.current = false;
    group.current = { key: null, at: 0 };
  }, []);

  const commit = useCallback((recipe: (current: T) => T, groupKey?: string) => {
    staging.current = false;
    const now = Date.now();
    const grouped =
      groupKey !== undefined && group.current.key === groupKey && now - group.current.at < groupWindow;
    group.current = { key: groupKey ?? null, at: now };
    setState((current) => {
      const present = recipe(current.present);
      if (present === current.present) return current;
      if (grouped) return { ...current, present };
      return { present, past: [...current.past, current.present].slice(-historyLimit), future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    staging.current = false;
    group.current = { key: null, at: 0 };
    setState((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) return current;
      return {
        present: previous,
        past: current.past.slice(0, -1),
        future: [current.present, ...current.future].slice(0, historyLimit),
      };
    });
  }, []);

  const redo = useCallback(() => {
    staging.current = false;
    group.current = { key: null, at: 0 };
    setState((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        present: next,
        past: [...current.past, current.present].slice(-historyLimit),
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit,
    stage,
    endStage,
    undo,
    redo,
  };
}

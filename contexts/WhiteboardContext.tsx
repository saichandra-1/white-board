'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { WhiteboardElement, Tool, CanvasState, UndoRedoState, WhiteboardPersistenceSnapshot } from '@/types/whiteboard';

interface WhiteboardContextType {
  elements: WhiteboardElement[];
  canvasState: CanvasState;
  undoRedoState: UndoRedoState;
  currentTool: Tool;
  boardTitle: string;
  hasHydrated: boolean;
  shouldSeedSampleData: boolean;
  
  // Actions
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  deleteElement: (id: string) => void;
  selectElements: (ids: string[]) => void;
  setTool: (tool: Tool) => void;
  undo: () => void;
  redo: () => void;
  updateCanvasState: (updates: Partial<CanvasState>) => void;
  setBoardTitle: (title: string) => void;
  clearBoard: (options?: { keepSampleSeed?: boolean }) => void;
  loadSnapshot: (snapshot: WhiteboardPersistenceSnapshot) => void;
  markSampleSeeded: () => void;
  createSnapshot: () => WhiteboardPersistenceSnapshot;
}

type WhiteboardAction =
  | { type: 'ADD_ELEMENT'; element: WhiteboardElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<WhiteboardElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENTS'; ids: string[] }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'UPDATE_CANVAS_STATE'; updates: Partial<CanvasState> }
  | { type: 'SET_ELEMENTS'; elements: WhiteboardElement[] }
  | { type: 'SET_BOARD_TITLE'; title: string }
  | { type: 'RESET_BOARD'; payload?: { keepSampleSeed?: boolean } }
  | { type: 'HYDRATE_STATE'; payload: { snapshot?: WhiteboardPersistenceSnapshot | null; shouldSeedSample: boolean } }
  | { type: 'MARK_SAMPLE_SEEDED' };

interface WhiteboardState {
  currentTool: Tool;
  canvasState: CanvasState;
  undoRedoState: UndoRedoState;
  boardTitle: string;
  hasHydrated: boolean;
  shouldSeedSample: boolean;
}

const LOCAL_STORAGE_KEY = 'whiteboard/persistence/v1';

const initialCanvasState: CanvasState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  selectedElementIds: [],
  clipboard: [],
};

const initialUndoRedoState: UndoRedoState = {
  past: [],
  present: [],
  future: [],
};

const initialState: WhiteboardState = {
  currentTool: 'select',
  canvasState: initialCanvasState,
  undoRedoState: initialUndoRedoState,
  boardTitle: 'Untitled Board',
  hasHydrated: false,
  shouldSeedSample: true,
};

function whiteboardReducer(state: WhiteboardState, action: WhiteboardAction): WhiteboardState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const newPresent = [...state.undoRedoState.present, action.element];
      return {
        ...state,
        undoRedoState: {
          past: [...state.undoRedoState.past, state.undoRedoState.present],
          present: newPresent,
          future: [],
        },
      };
    }

    case 'UPDATE_ELEMENT': {
      const newPresent = state.undoRedoState.present.map(el =>
        el.id === action.id ? { ...el, ...action.updates } as WhiteboardElement : el
      );
      
      // Only add to history if there's a meaningful change and it's not the same as the last state
      const element = state.undoRedoState.present.find(el => el.id === action.id);
      if (!element) return state;
      
      const hasSignificantChange = Object.keys(action.updates).some(key => {
        const oldValue = (element as any)[key];
        const newValue = (action.updates as any)[key];
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      });
      
      // Check if this would create the same state as the last past state
      const lastPastState = state.undoRedoState.past[state.undoRedoState.past.length - 1];
      const wouldCreateDuplicate = lastPastState && 
        JSON.stringify(newPresent) === JSON.stringify(lastPastState);
      
      if (!hasSignificantChange || wouldCreateDuplicate) {
        return {
          ...state,
          undoRedoState: {
            ...state.undoRedoState,
            present: newPresent,
          },
        };
      }
      
      return {
        ...state,
        undoRedoState: {
          past: [...state.undoRedoState.past.slice(-19), state.undoRedoState.present], // Limit to 20 states
          present: newPresent,
          future: [],
        },
      };
    }

    case 'DELETE_ELEMENT': {
      const newPresent = state.undoRedoState.present.filter(el => el.id !== action.id);
      return {
        ...state,
        undoRedoState: {
          past: [...state.undoRedoState.past, state.undoRedoState.present],
          present: newPresent,
          future: [],
        },
        canvasState: {
          ...state.canvasState,
          selectedElementIds: state.canvasState.selectedElementIds.filter(id => id !== action.id),
        },
      };
    }

    case 'SELECT_ELEMENTS':
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: action.ids,
        },
      };

    case 'SET_TOOL':
      return {
        ...state,
        currentTool: action.tool,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: [], // Clear selection when changing tools
        },
      };

    case 'UNDO': {
      const { past, present } = state.undoRedoState;
      if (past.length === 0) return state;
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      return {
        ...state,
        undoRedoState: {
          past: newPast,
          present: previous,
          future: [present, ...state.undoRedoState.future.slice(0, 49)], // Limit history size
        },
      };
    }

    case 'REDO': {
      const { future, present } = state.undoRedoState;
      if (future.length === 0) return state;
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      return {
        ...state,
        undoRedoState: {
          past: [...state.undoRedoState.past.slice(-49), present], // Limit history size
          present: next,
          future: newFuture,
        },
      };
    }

    case 'UPDATE_CANVAS_STATE':
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          ...action.updates,
        },
      };

    case 'SET_ELEMENTS':
      return {
        ...state,
        undoRedoState: {
          past: [],
          present: action.elements,
          future: [],
        },
      };

    case 'SET_BOARD_TITLE':
      return {
        ...state,
        boardTitle: action.title,
      };

    case 'RESET_BOARD':
      return {
        ...state,
        currentTool: 'select',
        canvasState: initialCanvasState,
        undoRedoState: initialUndoRedoState,
        shouldSeedSample: action.payload?.keepSampleSeed ? state.shouldSeedSample : false,
      };

    case 'HYDRATE_STATE': {
      const snapshot = action.payload.snapshot;
      if (!snapshot) {
        return {
          ...state,
          hasHydrated: true,
          shouldSeedSample: action.payload.shouldSeedSample,
        };
      }

      return {
        ...state,
        currentTool: snapshot.currentTool ?? state.currentTool,
        canvasState: {
          ...state.canvasState,
          ...snapshot.canvasState,
        },
        undoRedoState: {
          past: [],
          present: snapshot.elements ?? [],
          future: [],
        },
        boardTitle: snapshot.boardTitle ?? state.boardTitle,
        hasHydrated: true,
        shouldSeedSample: action.payload.shouldSeedSample,
      };
    }

    case 'MARK_SAMPLE_SEEDED':
      return {
        ...state,
        shouldSeedSample: false,
      };

    default:
      return state;
  }
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

export function WhiteboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(whiteboardReducer, initialState);

  const createSnapshot = useCallback((): WhiteboardPersistenceSnapshot => {
    const clone = <T,>(value: T): T => {
      try {
        if (typeof structuredClone === 'function') {
          return structuredClone(value);
        }
      } catch {
        // ignore and fall back to JSON clone
      }
      return JSON.parse(JSON.stringify(value)) as T;
    };

    return {
      version: 1,
      elements: clone(state.undoRedoState.present),
      canvasState: clone(state.canvasState),
      currentTool: state.currentTool,
      boardTitle: state.boardTitle,
      updatedAt: new Date().toISOString(),
    };
  }, [state.boardTitle, state.canvasState, state.currentTool, state.undoRedoState.present]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        dispatch({ type: 'HYDRATE_STATE', payload: { snapshot: null, shouldSeedSample: true } });
        return;
      }

      const parsed = JSON.parse(raw) as WhiteboardPersistenceSnapshot;
      if (!parsed || parsed.version !== 1) {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        dispatch({ type: 'HYDRATE_STATE', payload: { snapshot: null, shouldSeedSample: true } });
        return;
      }

      const hasElements = Array.isArray(parsed.elements) && parsed.elements.length > 0;
      dispatch({
        type: 'HYDRATE_STATE',
        payload: {
          snapshot: parsed,
          shouldSeedSample: !hasElements,
        },
      });
    } catch (error) {
      console.error('Failed to hydrate whiteboard state:', error);
      dispatch({ type: 'HYDRATE_STATE', payload: { snapshot: null, shouldSeedSample: true } });
    }
  }, []);

  useEffect(() => {
    if (!state.hasHydrated || typeof window === 'undefined') {
      return;
    }

    try {
      const snapshot = createSnapshot();
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to persist whiteboard state:', error);
    }
  }, [createSnapshot, state.hasHydrated]);

  const addElement = useCallback((element: WhiteboardElement) => {
    dispatch({ type: 'ADD_ELEMENT', element });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<WhiteboardElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', id, updates });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ELEMENT', id });
  }, []);

  const selectElements = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_ELEMENTS', ids });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    dispatch({ type: 'SET_TOOL', tool });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    dispatch({ type: 'UPDATE_CANVAS_STATE', updates });
  }, []);

  const setBoardTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_BOARD_TITLE', title });
  }, []);

  const clearBoard = useCallback((options?: { keepSampleSeed?: boolean }) => {
    dispatch({ type: 'RESET_BOARD', payload: { keepSampleSeed: options?.keepSampleSeed ?? false } });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear persisted whiteboard state:', error);
      }
    }
  }, []);

  const markSampleSeeded = useCallback(() => {
    dispatch({ type: 'MARK_SAMPLE_SEEDED' });
  }, []);

  const loadSnapshot = useCallback((snapshot: WhiteboardPersistenceSnapshot) => {
    dispatch({
      type: 'HYDRATE_STATE',
      payload: {
        snapshot,
        shouldSeedSample: false,
      },
    });
  }, []);

  const contextValue: WhiteboardContextType = {
    elements: state.undoRedoState.present,
    canvasState: state.canvasState,
    undoRedoState: state.undoRedoState,
    currentTool: state.currentTool,
    boardTitle: state.boardTitle,
    hasHydrated: state.hasHydrated,
    shouldSeedSampleData: state.shouldSeedSample,
    addElement,
    updateElement,
    deleteElement,
    selectElements,
    setTool,
    undo,
    redo,
    updateCanvasState,
    setBoardTitle,
    clearBoard,
    loadSnapshot,
    markSampleSeeded,
    createSnapshot,
  };

  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
}

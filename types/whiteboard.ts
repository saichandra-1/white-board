export type ElementType = 'stickyNote' | 'shape' | 'textbox' | 'drawing';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'arrow';
export type Tool = 'select' | 'note' | 'draw' | 'text' | 'rectangle' | 'circle' | 'triangle' | 'arrow';
export type Theme = 'light' | 'dark';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface StickyNoteElement extends BaseElement {
  type: 'stickyNote';
  data: {
    content: string;
    color: string;
    fontSize: number;
  };
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  data: {
    shapeType: ShapeType;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    points?: Point[];
  };
}

export interface TextBoxElement extends BaseElement {
  type: 'textbox';
  data: {
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  data: {
    paths: DrawingPath[];
  };
}

export type WhiteboardElement = StickyNoteElement | ShapeElement | TextBoxElement | DrawingElement;

export interface Board {
  id: string;
  title: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    theme: Theme;
    snapToGrid: boolean;
    gridSize: number;
    canvasSize: {
      width: number;
      height: number;
    };
  };
  elements: WhiteboardElement[];
}

export interface CanvasState {
  zoom: number;
  pan: Point;
  selectedElementIds: string[];
  clipboard: WhiteboardElement[];
}

export interface UndoRedoState {
  past: WhiteboardElement[][];
  present: WhiteboardElement[];
  future: WhiteboardElement[][];
}

export interface WhiteboardPersistenceSnapshot {
  version: 1;
  elements: WhiteboardElement[];
  canvasState: CanvasState;
  currentTool: Tool;
  boardTitle: string;
  updatedAt?: string;
}

export interface WhiteboardExportFile {
  type: 'designboard-export';
  version: 1;
  snapshot: WhiteboardPersistenceSnapshot;
  theme: Theme;
  savedAt: string;
}

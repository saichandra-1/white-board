'use client';

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { StickyNoteElement, ShapeElement, TextBoxElement, Point, DrawingElement } from '@/types/whiteboard';
import { StickyNote } from './StickyNote';
import { Shape } from './Shape';
import { TextBox } from './TextBox';
import { Drawing } from './Drawing';
import { useTheme } from '@/contexts/ThemeContext';
import { generateId } from '@/lib/utils';
import { buildSmoothPath, dedupePoints, calculateCurveBounds } from '@/lib/geometry';

interface CanvasProps {
  className?: string;
}

export function Canvas({ className = '' }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const activeDrawingIdRef = useRef<string | null>(null);
  const lastDrawUpdateRef = useRef<number>(0);
  const [arrowDraft, setArrowDraft] = useState<{
    id: string;
    committed: Point[];
    preview: Point;
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
  } | null>(null);
  const arrowPreviewThrottleRef = useRef<number>(0);

  const {
    elements,
    canvasState,
    currentTool,
    addElement,
    updateElement,
    selectElements,
    updateCanvasState,
  } = useWhiteboard();
  const { theme } = useTheme();

  const toBoardCoordinates = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: (clientX - rect.left - canvasState.pan.x) / canvasState.zoom,
      y: (clientY - rect.top - canvasState.pan.y) / canvasState.zoom,
    };
  }, [canvasState.pan.x, canvasState.pan.y, canvasState.zoom]);

  const normalizeArrowPoints = useCallback((points: Point[]) => {
    // Use the more accurate curve bounds calculation
    const curveBounds = calculateCurveBounds(points);

    // Add padding for stroke width and any remaining overshoot
    const padding = 10; // Reduced padding since we're now calculating accurate bounds
    const paddedMinX = curveBounds.minX - padding;
    const paddedMinY = curveBounds.minY - padding;
    const paddedMaxX = curveBounds.maxX + padding;
    const paddedMaxY = curveBounds.maxY + padding;

    const width = Math.max(1, paddedMaxX - paddedMinX);
    const height = Math.max(1, paddedMaxY - paddedMinY);

    const relativePoints = points.map(point => ({
      x: point.x - paddedMinX,
      y: point.y - paddedMinY,
    }));

    return {
      bounds: {
        x: paddedMinX,
        y: paddedMinY,
        width,
        height,
      },
      relativePoints,
    };
  }, []);

  const getPointsFromDraft = useCallback((draft: typeof arrowDraft | null) => {
    if (!draft) return [];
    const points = [...draft.committed];
    if (
      points.length === 0 ||
      points[points.length - 1].x !== draft.preview.x ||
      points[points.length - 1].y !== draft.preview.y
    ) {
      points.push(draft.preview);
    }
    return dedupePoints(points);
  }, []);

  const finalizeArrow = useCallback((draftOverride?: typeof arrowDraft | null) => {
    const draft = draftOverride ?? arrowDraft;
    if (!draft) {
      return;
    }

    const points = getPointsFromDraft(draft);
    if (points.length < 2) {
      setArrowDraft(null);
      return;
    }

    const { bounds, relativePoints } = normalizeArrowPoints(points);

    const newElement: ShapeElement = {
      id: draft.id,
      type: 'shape',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      zIndex: elements.length + 1,
      data: {
        shapeType: 'arrow',
        fillColor: draft.fillColor,
        strokeColor: draft.strokeColor,
        strokeWidth: draft.strokeWidth,
        points: relativePoints,
      },
    };

    addElement(newElement);
    selectElements([newElement.id]);
    setArrowDraft(null);
  }, [addElement, arrowDraft, elements.length, getPointsFromDraft, normalizeArrowPoints, selectElements]);

  const arrowPreview = useMemo(() => {
    if (!arrowDraft) {
      return null;
    }

    const points = getPointsFromDraft(arrowDraft);
    if (points.length < 2) {
      return null;
    }

    const { bounds, relativePoints } = normalizeArrowPoints(points);
    const rawPath = buildSmoothPath(relativePoints);
    const path = rawPath || `M ${relativePoints[0].x} ${relativePoints[0].y} L ${relativePoints[relativePoints.length - 1].x} ${relativePoints[relativePoints.length - 1].y}`;

    return {
      bounds,
      relativePoints,
      path,
      strokeColor: arrowDraft.strokeColor,
      strokeWidth: arrowDraft.strokeWidth,
      id: arrowDraft.id,
    };
  }, [arrowDraft, getPointsFromDraft, normalizeArrowPoints]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'draw') return; // handled by mousedown/move
    const boardPoint = toBoardCoordinates(e.clientX, e.clientY);
    if (!boardPoint) return;

    // Clear selection if clicking empty space
    if (e.target === canvasRef.current) {
      selectElements([]);
    }

    if (currentTool === 'note') {
      const newNote: StickyNoteElement = {
        id: generateId(),
        type: 'stickyNote',
        x: boardPoint.x - 100,
        y: boardPoint.y - 75,
        width: 200,
        height: 150,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          content: 'New note',
          color: '#fef3c7',
          fontSize: 14,
        },
      };
      addElement(newNote);
      return;
    }

    if (['rectangle', 'circle', 'triangle'].includes(currentTool)) {
      const isCircle = currentTool === 'circle';
      const newShape: ShapeElement = {
        id: generateId(),
        type: 'shape',
        x: boardPoint.x - (isCircle ? 60 : 75),
        y: boardPoint.y - (isCircle ? 60 : 50),
        width: isCircle ? 120 : 150,
        height: isCircle ? 120 : 100,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          shapeType: currentTool as 'rectangle' | 'circle' | 'triangle',
          fillColor: currentTool === 'rectangle' ? '#dbeafe' : currentTool === 'circle' ? '#fecaca' : '#dcfce7',
          strokeColor: currentTool === 'rectangle' ? '#3b82f6' : currentTool === 'circle' ? '#ef4444' : '#22c55e',
          strokeWidth: 2,
        },
      };
      addElement(newShape);
      return;
    }

    if (currentTool === 'arrow') {
      e.preventDefault();
      const strokeColor = '#8b5cf6';
      const fillColor = '#f3e8ff';
      const strokeWidth = 2;

      if (!arrowDraft) {
        const id = generateId();
        const draft = {
          id,
          committed: [boardPoint],
          preview: boardPoint,
          strokeColor,
          strokeWidth,
          fillColor,
        };
        setArrowDraft(draft);
      } else {
        const draft = {
          ...arrowDraft,
          committed: [...arrowDraft.committed, boardPoint],
          preview: boardPoint,
        };
        setArrowDraft(draft);
      }
      return;
    }

    if (currentTool === 'text') {
      const newTextBox: TextBoxElement = {
        id: generateId(),
        type: 'textbox',
        x: boardPoint.x - 100,
        y: boardPoint.y - 25,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          content: 'New Text',
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          color: theme === 'dark' ? '#FFFFFF' : '#111827',
          textAlign: 'center',
        },
      };
      addElement(newTextBox);
    }
  }, [addElement, arrowDraft, currentTool, elements.length, selectElements, theme, toBoardCoordinates]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const x = (rawX - canvasState.pan.x) / canvasState.zoom;
    const y = (rawY - canvasState.pan.y) / canvasState.zoom;

    setDragStart({ x: rawX, y: rawY });

    if (currentTool === 'draw') {
      const id = generateId();
      const newDrawing: DrawingElement = {
        id,
        type: 'drawing',
        x: Math.round(x),
        y: Math.round(y),
        width: 1,
        height: 1,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          paths: [
            {
              points: [{ x: 0, y: 0 }],
              strokeColor: theme === 'dark' ? '#fca5a5' : '#ef4444',
              strokeWidth: 3,
            },
          ],
        },
      };
      addElement(newDrawing);
      activeDrawingIdRef.current = id;
      lastDrawUpdateRef.current = performance.now();
      setIsDrawing(true);
      return;
    }

    // Enable panning when:
    // 1. Space key is held down, OR
    // 2. Clicking on canvas background (not on elements) for most tools
    // Exclude tools that need direct canvas interaction: draw, arrow, note, text, shapes
    const toolsWithDirectInteraction = ['draw', 'arrow', 'note', 'text', 'rectangle', 'circle', 'triangle'];
    
    // Check if click is on canvas background or grid, not on interactive elements
    const target = e.target as HTMLElement;
    const isClickingOnElements = target.closest('[data-canvas-elements-container]') && 
                                target.closest('[data-canvas-elements-container]') !== target;
    const isClickingEmptyCanvas = !isClickingOnElements;
    
    const shouldPan = isPanning || 
                     (isClickingEmptyCanvas && !toolsWithDirectInteraction.includes(currentTool)) ||
                     (isClickingEmptyCanvas && currentTool === 'select');
    
    if (shouldPan) {
      setIsPanning(true);
      setIsDragging(true);
    }
  }, [currentTool, isPanning, canvasState.pan, canvasState.zoom, addElement, elements.length, theme]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    if (currentTool === 'arrow' && arrowDraft) {
      const now = performance.now();
      if (now - arrowPreviewThrottleRef.current > 16) {
        arrowPreviewThrottleRef.current = now;
        const boardPoint = {
          x: (rawX - canvasState.pan.x) / canvasState.zoom,
          y: (rawY - canvasState.pan.y) / canvasState.zoom,
        };
        setArrowDraft(prev => (prev ? { ...prev, preview: boardPoint } : prev));
      }
    }

    if (isDrawing && activeDrawingIdRef.current) {
      const now = performance.now();
      if (now - lastDrawUpdateRef.current < 32) return; // throttle ~30fps
      lastDrawUpdateRef.current = now;

      const boardX = (rawX - canvasState.pan.x) / canvasState.zoom;
      const boardY = (rawY - canvasState.pan.y) / canvasState.zoom;

      const drawing = elements.find(el => el.id === activeDrawingIdRef.current);
      if (!drawing || drawing.type !== 'drawing') return;

      // Convert to local coords and expand bounding box as needed
      let newX = drawing.x;
      let newY = drawing.y;
      let newWidth = drawing.width;
      let newHeight = drawing.height;

      let localX = boardX - drawing.x;
      let localY = boardY - drawing.y;

      // If outside current bounds, expand and shift points
      const path = drawing.data.paths[0];
      const points = [...path.points];

      let shiftX = 0;
      let shiftY = 0;
      if (localX < 0) {
        shiftX = Math.abs(localX);
        newX = drawing.x - shiftX;
        newWidth = drawing.width + shiftX;
        localX = 0;
      } else if (localX > drawing.width) {
        newWidth = localX;
      }

      if (localY < 0) {
        shiftY = Math.abs(localY);
        newY = drawing.y - shiftY;
        newHeight = drawing.height + shiftY;
        localY = 0;
      } else if (localY > drawing.height) {
        newHeight = localY;
      }

      if (shiftX !== 0 || shiftY !== 0) {
        for (let i = 0; i < points.length; i++) {
          points[i] = { x: points[i].x + shiftX, y: points[i].y + shiftY };
        }
      }

      points.push({ x: localX, y: localY });

      updateElement(drawing.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.max(1, Math.round(newWidth)),
        height: Math.max(1, Math.round(newHeight)),
        data: {
          paths: [
            {
              ...path,
              points,
            },
          ],
        },
      });

      return;
    }

    if (!isDragging) return;

    if (isPanning) {
      const deltaX = rawX - dragStart.x;
      const deltaY = rawY - dragStart.y;
      
      updateCanvasState({
        pan: {
          x: canvasState.pan.x + deltaX,
          y: canvasState.pan.y + deltaY,
        },
      });

      setDragStart({ x: rawX, y: rawY });
    }
  }, [arrowDraft, canvasState.pan, canvasState.zoom, currentTool, dragStart, elements, isDragging, isDrawing, isPanning, setArrowDraft, updateCanvasState, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
    if (isDrawing) {
      setIsDrawing(false);
      activeDrawingIdRef.current = null;
    }
  }, [isDrawing]);

  const handleCanvasDoubleClick = useCallback(() => {
    if (currentTool !== 'arrow' || !arrowDraft) {
      return;
    }
    finalizeArrow(arrowDraft);
  }, [arrowDraft, currentTool, finalizeArrow]);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * delta));

    // Zoom towards mouse position
    const zoomRatio = newZoom / canvasState.zoom;
    const newPanX = mouseX - (mouseX - canvasState.pan.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - canvasState.pan.y) * zoomRatio;

    updateCanvasState({
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY },
    });
  }, [canvasState.zoom, canvasState.pan, updateCanvasState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanning(true);
      }

      if (e.key === 'Escape' && arrowDraft) {
        setArrowDraft(null);
      }

      if (e.key === 'Enter' && arrowDraft) {
        e.preventDefault();
        finalizeArrow(arrowDraft);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [arrowDraft, finalizeArrow]);

  useEffect(() => {
    if (currentTool !== 'arrow' && arrowDraft) {
      finalizeArrow(arrowDraft);
    }
  }, [arrowDraft, currentTool, finalizeArrow]);

  const getCursorClass = () => {
    // If actively dragging and panning
    if (isDragging && isPanning) {
      return 'cursor-grabbing';
    }

    // If space key is held (always allows panning)
    if (isPanning) {
      return 'cursor-grab';
    }

    // Tool-specific cursors
    switch (currentTool) {
      case 'draw':
        return 'cursor-crosshair';
      case 'arrow':
        return 'cursor-crosshair';
      case 'select':
        return 'cursor-grab'; // Select tool can always grab
      case 'note':
      case 'text':
      case 'rectangle':
      case 'circle':
      case 'triangle':
        return 'cursor-crosshair';
      default:
        // For any other tools, show grab cursor (can pan on empty canvas)
        return 'cursor-grab';
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full overflow-hidden bg-white dark:bg-gray-900 ${getCursorClass()} ${className}`}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
          backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
        }}
      />

      {/* Elements */}
      <div
        className="absolute"
        style={{
          transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
          transformOrigin: '0 0',
        }}
        data-canvas-elements-container
      >
        {elements.map((element) => {
          switch (element.type) {
            case 'stickyNote':
              return (
                <StickyNote
                  key={element.id}
                  element={element}
                  isSelected={canvasState.selectedElementIds.includes(element.id)}
                  onUpdate={(updates: Partial<StickyNoteElement>) => updateElement(element.id, updates)}
                  onSelect={() => selectElements([element.id])}
                  zoom={canvasState.zoom}
                />
              );
            case 'shape':
              return (
                <Shape
                  key={element.id}
                  element={element as ShapeElement}
                  isSelected={canvasState.selectedElementIds.includes(element.id)}
                  onUpdate={(updates: Partial<ShapeElement>) => updateElement(element.id, updates)}
                  onSelect={() => selectElements([element.id])}
                  zoom={canvasState.zoom}
                />
              );
            case 'textbox':
              return (
                <TextBox
                  key={element.id}
                  element={element as TextBoxElement}
                  isSelected={canvasState.selectedElementIds.includes(element.id)}
                  onUpdate={(updates: Partial<TextBoxElement>) => updateElement(element.id, updates)}
                  onSelect={() => selectElements([element.id])}
                  zoom={canvasState.zoom}
                />
              );
            case 'drawing':
              return (
                <Drawing
                  key={element.id}
                  element={element as DrawingElement}
                  isSelected={canvasState.selectedElementIds.includes(element.id)}
                  onUpdate={(updates: Partial<DrawingElement>) => updateElement(element.id, updates)}
                  onSelect={() => selectElements([element.id])}
                  zoom={canvasState.zoom}
                />
              );
            default:
              return null;
          }
        })}
        {arrowPreview && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: arrowPreview.bounds.x,
              top: arrowPreview.bounds.y,
              width: arrowPreview.bounds.width,
              height: arrowPreview.bounds.height,
            }}
          >
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${Math.max(1, arrowPreview.bounds.width)} ${Math.max(1, arrowPreview.bounds.height)}`}
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id={`arrow-preview-head-${arrowPreview.id}`}
                  markerWidth={10}
                  markerHeight={7}
                  refX={9}
                  refY={3.5}
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={arrowPreview.strokeColor} />
                </marker>
              </defs>
              <path
                d={arrowPreview.path}
                fill="none"
                stroke={arrowPreview.strokeColor}
                strokeWidth={arrowPreview.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arrow-preview-head-${arrowPreview.id})`}
                vectorEffect="non-scaling-stroke"
              />
              {arrowPreview.relativePoints.map((point, index) => (
                <circle
                  key={`preview-handle-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={Math.max(3, 6 / canvasState.zoom)}
                  fill="#ffffff"
                  stroke={arrowPreview.strokeColor}
                  strokeWidth={1}
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Canvas info */}
      <div className="absolute bottom-4 right-4 bg-black/10 dark:bg-white/10 rounded px-2 py-1 text-xs font-mono">
        Zoom: {Math.round(canvasState.zoom * 100)}%
      </div>
    </div>
  );
}

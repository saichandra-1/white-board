'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface RotatableElementProps {
  element: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
  };
  isSelected: boolean;
  onUpdate: (updates: Partial<{ x: number; y: number; width: number; height: number; rotation: number }>) => void;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  zoom: number;
  lockAspectRatio?: boolean | number;
}

type AxisSign = -1 | 0 | 1;

interface ResizeState {
  handle: string;
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
  startCenterX: number;
  startCenterY: number;
  rotation: number;
  signs: { x: AxisSign; y: AxisSign };
}

const MIN_SIZE = 30;

export function RotatableElement({
  element,
  isSelected,
  onUpdate,
  onSelect,
  children,
  className = '',
  zoom,
  lockAspectRatio = false,
}: RotatableElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotationState, setRotationState] = useState({
    initialAngle: 0,
    elementRotation: 0,
  });
  const [rotationPreview, setRotationPreview] = useState<number | null>(null);
  const [resizeData, setResizeData] = useState<ResizeState>({
    handle: '',
    startClientX: 0,
    startClientY: 0,
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0,
    startCenterX: 0,
    startCenterY: 0,
    rotation: 0,
    signs: { x: 0, y: 0 },
  });
  const [resizePreview, setResizePreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect();

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [onSelect],
  );

  const handleRotateMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect();

      setIsRotating(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

      setRotationState({
        initialAngle,
        elementRotation: element.rotation,
      });
    },
    [element.rotation, onSelect],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect();

      const signs: { x: AxisSign; y: AxisSign } = {
        x: handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0,
        y: handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0,
      };

      setIsResizing(true);
      setResizeData({
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startWidth: element.width,
        startHeight: element.height,
        startX: element.x,
        startY: element.y,
        startCenterX: element.x + element.width / 2,
        startCenterY: element.y + element.height / 2,
        rotation: element.rotation,
        signs,
      });
    },
    [element.height, element.rotation, element.width, element.x, element.y, onSelect],
  );

  const commitDrag = useCallback(() => {
    if (dragOffset.x !== 0 || dragOffset.y !== 0) {
      onUpdate({
        x: Math.round(element.x + dragOffset.x),
        y: Math.round(element.y + dragOffset.y),
      });
      setDragOffset({ x: 0, y: 0 });
    }
  }, [dragOffset.x, dragOffset.y, element.x, element.y, onUpdate]);

  const commitRotation = useCallback(() => {
    if (rotationPreview !== null) {
      onUpdate({ rotation: Math.round(rotationPreview) });
      setRotationPreview(null);
    }
  }, [onUpdate, rotationPreview]);

  const commitResize = useCallback(() => {
    if (resizePreview) {
      onUpdate({
        x: Math.round(resizePreview.x),
        y: Math.round(resizePreview.y),
        width: Math.max(MIN_SIZE, Math.round(resizePreview.width)),
        height: Math.max(MIN_SIZE, Math.round(resizePreview.height)),
      });
      setResizePreview(null);
    }
  }, [onUpdate, resizePreview]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const dxClient = e.clientX - dragStart.x;
        const dyClient = e.clientY - dragStart.y;
        setDragOffset({ x: dxClient / zoom, y: dyClient / zoom });
        return;
      }

      if (isRotating) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

        let newRotation = rotationState.elementRotation + (currentAngle - rotationState.initialAngle);
        newRotation = ((newRotation % 360) + 360) % 360;

        setRotationPreview(newRotation);
        return;
      }

      if (isResizing) {
        const deltaClientX = (e.clientX - resizeData.startClientX) / zoom;
        const deltaClientY = (e.clientY - resizeData.startClientY) / zoom;

        const angleRad = (resizeData.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const localDx = deltaClientX * cos + deltaClientY * sin;
        const localDy = -deltaClientX * sin + deltaClientY * cos;

        let newWidth = resizeData.startWidth;
        let newHeight = resizeData.startHeight;

        if (resizeData.signs.x !== 0) {
          newWidth = resizeData.startWidth + localDx * resizeData.signs.x;
        }
        if (resizeData.signs.y !== 0) {
          newHeight = resizeData.startHeight + localDy * resizeData.signs.y;
        }

        if (lockAspectRatio) {
          const baseWidth = Math.max(1, resizeData.startWidth);
          const baseHeight = Math.max(1, resizeData.startHeight);

          let scale = 1;
          if (resizeData.signs.x !== 0 && resizeData.signs.y !== 0) {
            const scaleFromWidth = newWidth / baseWidth;
            const scaleFromHeight = newHeight / baseHeight;
            scale = Math.abs(scaleFromWidth - 1) >= Math.abs(scaleFromHeight - 1) ? scaleFromWidth : scaleFromHeight;
          } else if (resizeData.signs.x !== 0) {
            scale = newWidth / baseWidth;
          } else if (resizeData.signs.y !== 0) {
            scale = newHeight / baseHeight;
          }

          if (!Number.isFinite(scale) || scale <= 0) {
            scale = 1;
          }

          const minScale = Math.max(MIN_SIZE / baseWidth, MIN_SIZE / baseHeight);
          if (scale < minScale) {
            scale = minScale;
          }

          newWidth = baseWidth * scale;
          newHeight = baseHeight * scale;
        } else {
          newWidth = Math.max(MIN_SIZE, newWidth);
          newHeight = Math.max(MIN_SIZE, newHeight);
        }

        const widthChange = newWidth - resizeData.startWidth;
        const heightChange = newHeight - resizeData.startHeight;

        const centerShiftLocalX = (resizeData.signs.x * widthChange) / 2;
        const centerShiftLocalY = (resizeData.signs.y * heightChange) / 2;

        const centerShiftGlobalX = centerShiftLocalX * cos - centerShiftLocalY * sin;
        const centerShiftGlobalY = centerShiftLocalX * sin + centerShiftLocalY * cos;

        const newCenterX = resizeData.startCenterX + centerShiftGlobalX;
        const newCenterY = resizeData.startCenterY + centerShiftGlobalY;

        const newX = newCenterX - newWidth / 2;
        const newY = newCenterY - newHeight / 2;

        setResizePreview({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [dragStart.x, dragStart.y, isDragging, isResizing, isRotating, lockAspectRatio, resizeData, rotationState.elementRotation, rotationState.initialAngle, zoom],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      commitDrag();
    }
    if (isRotating) {
      commitRotation();
    }
    if (isResizing) {
      commitResize();
    }

    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
    setResizeData(prev => ({ ...prev, handle: '' }));
  }, [commitDrag, commitResize, commitRotation, isDragging, isResizing, isRotating]);

  useEffect(() => {
    if (isDragging || isRotating || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp, isDragging, isResizing, isRotating]);

  useEffect(() => {
    if (!isResizing) {
      setResizePreview(null);
    }
  }, [element.height, element.width, element.x, element.y, isResizing]);

  useEffect(() => {
    if (!isRotating) {
      setRotationPreview(null);
    }
  }, [element.rotation, isRotating]);

  const renderedX = (resizePreview ? resizePreview.x : element.x) + dragOffset.x;
  const renderedY = (resizePreview ? resizePreview.y : element.y) + dragOffset.y;
  const renderedWidth = resizePreview ? resizePreview.width : element.width;
  const renderedHeight = resizePreview ? resizePreview.height : element.height;
  const renderedRotation = rotationPreview !== null ? rotationPreview : element.rotation;

  return (
    <div
      ref={containerRef}
      className={`absolute select-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${className}`}
      style={{
        left: renderedX,
        top: renderedY,
        width: renderedWidth,
        height: renderedHeight,
        transform: `rotate(${renderedRotation}deg)`,
        transformOrigin: 'center center',
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : isRotating ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {isSelected && (
        <>
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 cursor-grab hover:cursor-grabbing"
            style={{
              transform: `translateX(-50%) rotate(${-renderedRotation}deg)`,
              transformOrigin: 'center bottom',
            }}
            onMouseDown={handleRotateMouseDown}
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </div>
            <div className="w-0.5 h-4 bg-blue-500 mx-auto" />
          </div>

          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-n-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `translateX(-50%) rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-s-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `translateX(-50%) rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-w-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `translateY(-50%) rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-e-resize hover:bg-blue-100 transition-colors"
            style={{ transform: `translateY(-50%) rotate(${-renderedRotation}deg)` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </>
      )}

      {children}
    </div>
  );
}

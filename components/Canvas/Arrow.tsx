'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShapeElement } from '@/types/whiteboard';

interface ArrowProps {
  element: ShapeElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ShapeElement>) => void;
  onSelect: () => void;
}

export function Arrow({ element, isSelected, onUpdate, onSelect }: ArrowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeData, setResizeData] = useState({ handle: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
  }, [element.x, element.y, onSelect]);

  // Throttled update function for smoother performance
  const throttledUpdate = useCallback((updates: Partial<ShapeElement>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(updates);
    }, 32); // ~30fps to reduce undo history entries
  }, [onUpdate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      throttledUpdate({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;
      
      let newWidth = resizeData.startWidth;
      let newHeight = resizeData.startHeight;
      let newX = element.x;
      let newY = element.y;
      
      switch (resizeData.handle) {
        case 'se': // bottom-right
          newWidth = Math.max(50, resizeData.startWidth + deltaX);
          newHeight = Math.max(50, resizeData.startHeight + deltaY);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(50, resizeData.startWidth - deltaX);
          newHeight = Math.max(50, resizeData.startHeight + deltaY);
          newX = element.x + (resizeData.startWidth - newWidth);
          break;
        case 'ne': // top-right
          newWidth = Math.max(50, resizeData.startWidth + deltaX);
          newHeight = Math.max(50, resizeData.startHeight - deltaY);
          newY = element.y + (resizeData.startHeight - newHeight);
          break;
        case 'nw': // top-left
          newWidth = Math.max(50, resizeData.startWidth - deltaX);
          newHeight = Math.max(50, resizeData.startHeight - deltaY);
          newX = element.x + (resizeData.startWidth - newWidth);
          newY = element.y + (resizeData.startHeight - newHeight);
          break;
      }
      
      throttledUpdate({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, isResizing, dragStart, resizeData, throttledUpdate, element.x, element.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    
    setIsResizing(true);
    setResizeData({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
    });
  }, [onSelect, element.width, element.height]);

  // Global mouse events for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`absolute select-none cursor-move transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Resize handles */}
      {isSelected && (
        <>
          <div 
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize hover:bg-blue-600 transition-colors" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-ne-resize hover:bg-blue-600 transition-colors" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div 
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize hover:bg-blue-600 transition-colors" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize hover:bg-blue-600 transition-colors" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}

      {/* Arrow Content */}
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={element.data.fillColor}
            />
          </marker>
        </defs>
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke={element.data.strokeColor}
          strokeWidth={element.data.strokeWidth}
          markerEnd="url(#arrowhead)"
        />
      </svg>
    </div>
  );
}

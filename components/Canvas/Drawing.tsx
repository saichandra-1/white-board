'use client';

import React from 'react';
import { DrawingElement } from '@/types/whiteboard';
import { RotatableElement } from './RotatableElement';

interface DrawingProps {
  element: DrawingElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<DrawingElement>) => void;
  onSelect: () => void;
  zoom: number;
}

function pointsToPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y}` + rest.map(p => ` L ${p.x} ${p.y}`).join('');
}

export function Drawing({ element, isSelected, onUpdate, onSelect, zoom }: DrawingProps) {
  const path = pointsToPath(element.data.paths[0]?.points || []);
  const strokeColor = element.data.paths[0]?.strokeColor || '#ef4444';
  const strokeWidth = element.data.paths[0]?.strokeWidth || 3;

  return (
    <RotatableElement
      element={element}
      isSelected={isSelected}
      onUpdate={onUpdate}
      onSelect={onSelect}
      zoom={zoom}
    >
      <svg className="w-full h-full" viewBox={`0 0 ${element.width} ${element.height}`}>
        <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </RotatableElement>
  );
}

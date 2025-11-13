'use client';

import React from 'react';
import { ShapeElement } from '@/types/whiteboard';
import { RotatableElement } from './RotatableElement';
import { buildSmoothPath, dedupePoints } from '@/lib/geometry';

interface ShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ShapeElement>) => void;
  onSelect: () => void;
  zoom: number;
}

export function Shape({ element, isSelected, onUpdate, onSelect, zoom }: ShapeProps) {

  const renderShape = () => {
    const { shapeType, fillColor, strokeColor, strokeWidth } = element.data;
    
    switch (shapeType) {
      case 'rectangle':
        return (
          <div
            className="w-full h-full border-2 rounded"
            style={{
              backgroundColor: fillColor,
              borderColor: strokeColor,
              borderWidth: strokeWidth,
            }}
          />
        );
      case 'circle':
        return (
          <div
            className="w-full h-full border-2 rounded-full"
            style={{
              backgroundColor: fillColor,
              borderColor: strokeColor,
              borderWidth: strokeWidth,
            }}
          />
        );
      case 'triangle':
        return (
          <div className="w-full h-full flex items-end justify-center">
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${element.width / 2}px solid transparent`,
                borderRight: `${element.width / 2}px solid transparent`,
                borderBottom: `${element.height}px solid ${fillColor}`,
                filter: `drop-shadow(0 0 0 ${strokeWidth}px ${strokeColor})`,
              }}
            />
          </div>
        );
      case 'arrow': {
        const rawPoints = element.data.points && element.data.points.length >= 2
          ? element.data.points
          : [
              { x: 0, y: element.height / 2 },
              { x: element.width, y: element.height / 2 },
            ];
        const pointData = dedupePoints(rawPoints);
        const markerId = `arrowhead-${element.id}`;
        const width = Math.max(1, element.width);
        const height = Math.max(1, element.height);
        const rawPath = buildSmoothPath(pointData);
        const pathD = rawPath || `M ${pointData[0].x} ${pointData[0].y} L ${pointData[pointData.length - 1].x} ${pointData[pointData.length - 1].y}`;
        const handleRadius = Math.max(3, 6 / zoom);

        return (
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id={markerId}
                markerWidth={10}
                markerHeight={7}
                refX={9}
                refY={3.5}
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
              </marker>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${markerId})`}
              vectorEffect="non-scaling-stroke"
            />
            {isSelected && pointData.map((point, index) => (
              <circle
                key={`${element.id}-handle-${index}`}
                cx={point.x}
                cy={point.y}
                r={handleRadius}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={1}
              />
            ))}
          </svg>
        );
      }
      default:
        return null;
    }
  };

  return (
    <RotatableElement
      element={element}
      isSelected={isSelected}
      onUpdate={onUpdate}
      onSelect={onSelect}
      zoom={zoom}
      lockAspectRatio={element.data.shapeType === 'circle' ? 1 : false}
    >
      {renderShape()}
    </RotatableElement>
  );
}

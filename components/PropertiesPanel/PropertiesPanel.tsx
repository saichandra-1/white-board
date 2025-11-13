'use client';

import React from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { COLORS } from '@/lib/utils';
import { Palette, AlignLeft, AlignCenter, AlignRight } from '@/components/Icons';
import { ShapeElement, DrawingElement } from '@/types/whiteboard';

export function PropertiesPanel() {
  const { elements, canvasState, updateElement } = useWhiteboard();
  
  const selectedElements = elements.filter(el => 
    canvasState.selectedElementIds.includes(el.id)
  );

  if (selectedElements.length === 0) {
    return (
      <div className="w-80 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const selectedElement = selectedElements[0]; // For now, handle single selection

  return (
    <div className="w-80 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedElements.length} element{selectedElements.length > 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Properties */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        
        {/* Position & Size */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Position & Size</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Sticky Note Properties */}
        {selectedElement.type === 'stickyNote' && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Sticky Note</h3>
            
            {/* Colors */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.stickyNote.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedElement.id, {
                      data: { ...selectedElement.data, color }
                    })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedElement.data.color === color 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={selectedElement.data.fontSize}
                onChange={(e) => updateElement(selectedElement.id, {
                  data: { ...selectedElement.data, fontSize: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {selectedElement.data.fontSize}px
              </div>
            </div>
          </div>
        )}

        {/* Text Box Properties */}
        {selectedElement.type === 'textbox' && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Text</h3>
            
            {/* Text Alignment */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Alignment</label>
              <div className="flex space-x-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateElement(selectedElement.id, {
                      data: { ...selectedElement.data, textAlign: value as 'left' | 'center' | 'right' }
                    })}
                    className={`p-2 rounded ${
                      selectedElement.data.textAlign === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font Size</label>
              <input
                type="range"
                min="10"
                max="72"
                value={selectedElement.data.fontSize}
                onChange={(e) => updateElement(selectedElement.id, {
                  data: { ...selectedElement.data, fontSize: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {selectedElement.data.fontSize}px
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.shape.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedElement.id, {
                      data: { ...selectedElement.data, color }
                    })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedElement.data.color === color 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {selectedElement.type === 'shape' && (() => {
          const shape = selectedElement as ShapeElement;
          return (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Shape</h3>
              {/* Fill Color */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Fill</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.shape.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateElement(shape.id, {
                        data: { ...shape.data, fillColor: color }
                      })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        shape.data.fillColor === color 
                          ? 'border-blue-500 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Stroke Color */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Stroke</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.shape.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateElement(shape.id, {
                        data: { ...shape.data, strokeColor: color }
                      })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        shape.data.strokeColor === color 
                          ? 'border-blue-500 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Stroke Width */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stroke Width</label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={shape.data.strokeWidth}
                  onChange={(e) => updateElement(shape.id, {
                    data: { ...shape.data, strokeWidth: Number(e.target.value) }
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {shape.data.strokeWidth}px
                </div>
              </div>
            </div>
          );
        })()}

        {/* Drawing Properties */}
        {selectedElement.type === 'drawing' && (() => {
          const drawing = selectedElement as DrawingElement;
          const firstPath = drawing.data.paths[0];
          return (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Drawing</h3>
              {/* Stroke Color */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Stroke</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.shape.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateElement(drawing.id, {
                        data: { paths: [{ ...firstPath, strokeColor: color }] }
                      })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        firstPath.strokeColor === color 
                          ? 'border-blue-500 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Stroke Width */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stroke Width</label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={firstPath.strokeWidth}
                  onChange={(e) => updateElement(drawing.id, {
                    data: { paths: [{ ...firstPath, strokeWidth: Number(e.target.value) }] }
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {firstPath.strokeWidth}px
                </div>
              </div>
            </div>
          );
        })()}

        {/* Layer Controls */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Layer</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateElement(selectedElement.id, { zIndex: selectedElement.zIndex + 1 })}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Bring Forward
            </button>
            <button
              onClick={() => updateElement(selectedElement.id, { zIndex: Math.max(1, selectedElement.zIndex - 1) })}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Send Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

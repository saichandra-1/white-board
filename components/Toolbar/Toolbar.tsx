'use client';

import React, { useState } from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { Tool } from '@/types/whiteboard';
import { 
  MousePointer2, 
  StickyNote, 
  Pencil, 
  Type, 
  Square, 
  Circle, 
  Triangle,
  ArrowRight,
  Undo,
  Redo,
  Trash,
  Timer,
} from '@/components/Icons';

interface ToolButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ isActive, onClick, icon, label, shortcut }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
        ${isActive 
          ? 'bg-blue-500 text-white shadow-md' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <div className="w-5 h-5 flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs opacity-60 font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );
}

export function Toolbar() {
  const { currentTool, setTool, undo, redo, undoRedoState, clearBoard } = useWhiteboard();
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);

  const tools: Array<{ tool: Tool; icon: React.ReactNode; label: string; shortcut: string }> = [
    { tool: 'select', icon: <MousePointer2 />, label: 'Select', shortcut: 'V' },
    { tool: 'note', icon: <StickyNote />, label: 'Sticky Note', shortcut: 'N' },
    { tool: 'draw', icon: <Pencil />, label: 'Draw', shortcut: 'D' },
    { tool: 'text', icon: <Type />, label: 'Text', shortcut: 'T' },
    { tool: 'arrow', icon: <ArrowRight />, label: 'Arrow', shortcut: 'A' },
    { tool: 'timer', icon: <Timer />, label: 'Timer', shortcut: '' },
  ];

  const shapeTools: Array<{ tool: Tool; icon: React.ReactNode; label: string; shortcut: string }> = [
    { tool: 'rectangle', icon: <Square />, label: 'Rectangle', shortcut: 'R' },
    { tool: 'circle', icon: <Circle />, label: 'Circle', shortcut: 'C' },
    { tool: 'triangle', icon: <Triangle />, label: 'Triangle', shortcut: '3' },
  ];

  const isShapeToolActive = ['rectangle', 'circle', 'triangle'].includes(currentTool);

  return (
    <div className="relative flex">
      <div className="w-80 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tools</h2>
        </div>

        {/* Tools */}
        <div className="flex-1 p-4 space-y-2">
          {tools.map((toolConfig) => (
            <ToolButton
              key={toolConfig.tool}
              isActive={currentTool === toolConfig.tool}
              onClick={() => setTool(toolConfig.tool)}
              icon={toolConfig.icon}
              label={toolConfig.label}
              shortcut={toolConfig.shortcut}
            />
          ))}

          {/* Shapes Button */}
          <button
            onClick={() => setShapesMenuOpen(!shapesMenuOpen)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
              ${isShapeToolActive || shapesMenuOpen
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
            title="Shapes"
          >
            <div className="w-5 h-5 flex-shrink-0">
              <Square />
            </div>
            <span className="text-sm font-medium">Shapes</span>
            <span className="ml-auto text-xs">{shapesMenuOpen ? '◀' : '▶'}</span>
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

          {/* Undo/Redo */}
          <div className="space-y-2">
            <button
              onClick={undo}
              disabled={undoRedoState.past.length === 0}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-5 h-5" />
              <span className="text-sm font-medium">Undo</span>
              <span className="ml-auto text-xs opacity-60 font-mono">Ctrl+Z</span>
            </button>

            <button
              onClick={redo}
              disabled={undoRedoState.future.length === 0}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-5 h-5" />
              <span className="text-sm font-medium">Redo</span>
              <span className="ml-auto text-xs opacity-60 font-mono">Ctrl+Y</span>
            </button>
            <button
              onClick={() => {
                const confirmed = window.confirm('Are you sure you want to clear the canvas? This will remove all elements.');
                if (confirmed) {
                  clearBoard();
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
              title="Clear canvas"
            >
              <Trash className="w-5 h-5" />
              <span className="text-sm font-medium">Clear Canvas</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Click to select tool</p>
            <p>Use keyboard shortcuts for quick access</p>
          </div>
        </div>
      </div>

      {/* Shapes Submenu */}
      {shapesMenuOpen && (
        <div className="absolute left-80 top-16 w-64 max-h-[60vh] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg z-20 rounded-r-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shapes</h3>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto">
            {shapeTools.map((toolConfig) => (
              <ToolButton
                key={toolConfig.tool}
                isActive={currentTool === toolConfig.tool}
                onClick={() => {
                  setTool(toolConfig.tool);
                  // Keep the shapes menu open so user can add multiple shapes easily
                  // setShapesMenuOpen(false);
                }}
                icon={toolConfig.icon}
                label={toolConfig.label}
                shortcut={toolConfig.shortcut}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

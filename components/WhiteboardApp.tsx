'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WhiteboardProvider, useWhiteboard } from '@/contexts/WhiteboardContext';
import { PanelProvider, usePanel } from '@/contexts/PanelContext';
import { Canvas } from '@/components/Canvas/Canvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { TopBar } from '@/components/TopBar/TopBar';
import { PropertiesPanel } from '@/components/PropertiesPanel/PropertiesPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StickyNoteElement } from '@/types/whiteboard';
import { generateId } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from '@/components/Icons';

// Sample data for initial board state
const SAMPLE_DATA: StickyNoteElement[] = [
  {
    id: generateId(),
    type: 'stickyNote',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    zIndex: 1,
    data: {
      content: 'Welcome to the whiteboard! 🎉\n\nDouble-click to edit notes.',
      color: '#fef3c7',
      fontSize: 14,
    },
  },
  {
    id: generateId(),
    type: 'stickyNote',
    x: 350,
    y: 150,
    width: 200,
    height: 150,
    rotation: -2,
    zIndex: 2,
    data: {
      content: 'Use keyboard shortcuts:\n• N - New note\n• V - Select tool\n• D - Draw tool',
      color: '#dbeafe',
      fontSize: 14,
    },
  },
  {
    id: generateId(),
    type: 'stickyNote',
    x: 200,
    y: 320,
    width: 200,
    height: 150,
    rotation: 1,
    zIndex: 3,
    data: {
      content: 'Drag notes around\nResize with corner handles\nUndo/Redo with Ctrl+Z/Y',
      color: '#dcfce7',
      fontSize: 14,
    },
  },
];

function WhiteboardContent() {
  const { addElement, elements, setTool, undo, redo, canvasState, deleteElement } = useWhiteboard();
  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = usePanel();

  // Load sample data on first render
  useEffect(() => {
    if (elements.length === 0) {
      SAMPLE_DATA.forEach(note => {
        addElement(note);
      });
    }
  }, [addElement, elements.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea or contenteditable
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Handle Ctrl/Cmd + shortcuts first
      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            // Select all elements - will implement later
            break;
          case 's':
            e.preventDefault();
            // Save - will implement later
            break;
        }
        return;
      }

      // Handle Delete/Backspace for selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvasState.selectedElementIds.length > 0) {
        e.preventDefault();
        canvasState.selectedElementIds.forEach(id => deleteElement(id));
        return;
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          setTool('select');
          break;
        case 'n':
          e.preventDefault();
          setTool('note');
          break;
        case 'd':
          e.preventDefault();
          setTool('draw');
          break;
        case 't':
          e.preventDefault();
          setTool('text');
          break;
        case 'r':
          e.preventDefault();
          setTool('rectangle');
          break;
        case 'c':
          e.preventDefault();
          setTool('circle');
          break;
        case '3':
          e.preventDefault();
          setTool('triangle');
          break;
        case 'a':
          if (!isCtrlOrCmd) {
            e.preventDefault();
            setTool('arrow');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTool, undo, redo, canvasState.selectedElementIds, deleteElement]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className={`relative transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-0'}`}>
          <div className={`${leftPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
            <Toolbar />
          </div>
        </div>

        {/* Left Panel Toggle */}
        <div className="relative">
          <button
            onClick={toggleLeftPanel}
            className="absolute left-2 top-4 z-10 flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            title={`${leftPanelOpen ? 'Hide' : 'Show'} toolbar`}
          >
            {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <Canvas />
        </div>

        {/* Right Panel Toggle */}
        <div className="relative">
          <button
            onClick={toggleRightPanel}
            className="absolute right-2 top-4 z-10 flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            title={`${rightPanelOpen ? 'Hide' : 'Show'} properties`}
          >
            {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Properties Panel */}
        <div className={`relative transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'}`}>
          <div className={`${rightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
            <PropertiesPanel />
          </div>
        </div>
      </div>
      
      {/* Theme Toggle in Bottom Left */}
      <ThemeToggle />
    </div>
  );
}

export function WhiteboardApp() {
  return (
    <ThemeProvider>
      <PanelProvider>
        <WhiteboardProvider>
          <WhiteboardContent />
        </WhiteboardProvider>
      </PanelProvider>
    </ThemeProvider>
  );
}

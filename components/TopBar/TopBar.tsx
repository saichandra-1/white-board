'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { Share2, Download, Save } from '@/components/Icons';
import { WhiteboardPersistenceSnapshot, WhiteboardExportFile } from '@/types/whiteboard';

function WhitepaperLogo() {
  return (
    <div className="w-9 h-9 rounded-xl shadow-md bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center">
      <svg
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Whiteboard background */}
        <rect
          x="2"
          y="3"
          width="20"
          height="14"
          rx="2"
          fill="currentColor"
          fillOpacity="0.9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        
        {/* Drawing elements on the board */}
        <g stroke="rgba(30, 41, 59, 0.8)" strokeWidth="1.5" fill="none">
          {/* Sticky note */}
          <rect x="4" y="5" width="4" height="3" rx="0.5" fill="rgba(251, 191, 36, 0.7)" stroke="none" />
          
          {/* Circle */}
          <circle cx="11" cy="7" r="1.5" />
          
          {/* Arrow */}
          <path d="M15 6l3 2-3 2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="15" y1="8" x2="18" y2="8" strokeLinecap="round" />
          
          {/* Text lines */}
          <line x1="5" y1="11" x2="10" y2="11" strokeWidth="1" strokeLinecap="round" />
          <line x1="5" y1="13" x2="8" y2="13" strokeWidth="1" strokeLinecap="round" />
          
          {/* Pen/marker indicator */}
          <circle cx="16" cy="12" r="0.8" fill="rgba(239, 68, 68, 0.7)" stroke="none" />
        </g>
        
        {/* Frame border highlight */}
        <rect
          x="2"
          y="3"
          width="20"
          height="14"
          rx="2"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

export function TopBar() {
  const { theme, setTheme: applyTheme } = useTheme();
  const { boardTitle, setBoardTitle, loadSnapshot, createSnapshot } = useWhiteboard();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleExport = async () => {
    // TODO: Implement export functionality
    console.log('Export board as PNG/SVG');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share board');
  };

  const handleSave = () => {
    try {
      const snapshot = createSnapshot();
      const exportFile: WhiteboardExportFile = {
        type: 'designboard-export',
        version: 1,
        snapshot,
        theme,
        savedAt: snapshot.updatedAt ?? new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportFile, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `${(snapshot.boardTitle || 'whiteboard')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.designboard.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export board:', error);
      alert('Unable to save the board. Please try again.');
    }
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        let snapshot: WhiteboardPersistenceSnapshot | null = null;
        let fileTheme: string | undefined;

        if (parsed && parsed.type === 'designboard-export' && parsed.version === 1 && parsed.snapshot) {
          const exportFile = parsed as WhiteboardExportFile;
          snapshot = exportFile.snapshot;
          fileTheme = exportFile.theme;
        } else if (parsed && parsed.version === 1 && parsed.elements) {
          const legacy = parsed as WhiteboardPersistenceSnapshot & { theme?: string };
          snapshot = {
            version: 1,
            elements: legacy.elements ?? [],
            canvasState: legacy.canvasState ?? {
              zoom: 1,
              pan: { x: 0, y: 0 },
              selectedElementIds: [],
              clipboard: [],
            },
            currentTool: legacy.currentTool ?? 'select',
            boardTitle: legacy.boardTitle ?? 'Loaded Board',
            updatedAt: legacy.updatedAt ?? new Date().toISOString(),
          };
          fileTheme = legacy.theme;
        }

        if (!snapshot) {
          throw new Error('Unsupported file format');
        }

        loadSnapshot(snapshot);

        if (snapshot.boardTitle) {
          setBoardTitle(snapshot.boardTitle);
        }
        if (fileTheme === 'light' || fileTheme === 'dark') {
          applyTheme(fileTheme);
        }

        alert(`Board "${snapshot.boardTitle ?? 'Untitled'}" loaded successfully!`);
      } catch (error) {
        console.error('Error loading board:', error);
        alert("Error loading board file. Please make sure it's a valid DesignBoard export (.designboard.json).");
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left: Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <WhitepaperLogo />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Whiteboard Pro
          </span>
        </div>

        {/* Board Title */}
        <div className="ml-8">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit}>
              <input
                type="text"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-lg font-medium bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white px-2 py-1"
                autoFocus
              />
            </form>
          ) : (
            <button
              onClick={handleTitleClick}
              className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 px-2 py-1 rounded transition-colors"
            >
              {boardTitle}
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        {/* Load Button */}
        <button
          onClick={handleLoad}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Load board file"
        >
          <Download className="w-4 h-4" />
          <span>Load</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Save board as file"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Share board"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Export as PNG/SVG"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        style={{ display: 'none' }}
      />
    </header>
  );
}

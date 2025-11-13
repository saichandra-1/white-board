'use client';

import React, { useState, useRef, useCallback } from 'react';
import { StickyNoteElement } from '@/types/whiteboard';
import { RotatableElement } from './RotatableElement';

interface StickyNoteProps {
  element: StickyNoteElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<StickyNoteElement>) => void;
  onSelect: () => void;
  zoom: number;
}

export function StickyNote({ element, isSelected, onUpdate, onSelect, zoom }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(element.data.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  }, []);

  const handleContentBlur = useCallback(() => {
    setIsEditing(false);
    onUpdate({
      data: {
        ...element.data,
        content: localContent,
      },
    });
  }, [element.data, localContent, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalContent(element.data.content); // Reset to original content
    }
  }, [element.data.content, handleContentBlur]);

  return (
    <RotatableElement
      element={element}
      isSelected={isSelected}
      onUpdate={onUpdate}
      onSelect={onSelect}
      zoom={zoom}
    >
      <div
        className="w-full h-full rounded-lg shadow-md"
        onDoubleClick={handleDoubleClick}
        style={{ backgroundColor: element.data.color }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            onBlur={handleContentBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-3 bg-transparent border-none resize-none outline-none font-sans text-gray-900"
            style={{ fontSize: `${element.data.fontSize}px` }}
            placeholder="Type your note here..."
          />
        ) : (
          <div
            className="w-full h-full p-3 whitespace-pre-wrap break-words overflow-hidden font-sans text-gray-900"
            style={{ fontSize: `${element.data.fontSize}px` }}
          >
            {element.data.content || 'Empty note...'}
          </div>
        )}
      </div>
    </RotatableElement>
  );
}

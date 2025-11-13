'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextBoxElement } from '@/types/whiteboard';
import { RotatableElement } from './RotatableElement';

interface TextBoxProps {
  element: TextBoxElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<TextBoxElement>) => void;
  onSelect: () => void;
  zoom: number;
}

export function TextBox({ element, isSelected, onUpdate, onSelect, zoom }: TextBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(element.data.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  }, []);

  const handleContentBlur = useCallback(() => {
    setIsEditing(false);
    if (localContent !== element.data.content) {
      onUpdate({
        data: {
          ...element.data,
          content: localContent,
        },
      });
    }
  }, [localContent, element.data, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalContent(element.data.content);
    }
    // Allow Enter for new lines in text
    e.stopPropagation();
  }, [element.data.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalContent(element.data.content);
  }, [element.data.content]);

  return (
    <RotatableElement
      element={element}
      isSelected={isSelected}
      onUpdate={onUpdate}
      onSelect={onSelect}
      zoom={zoom}
    >
      <div
        className="w-full h-full flex items-center justify-center p-2"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            onBlur={handleContentBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent border-none resize-none outline-none text-center"
            style={{
              fontSize: `${element.data.fontSize}px`,
              fontFamily: element.data.fontFamily,
              color: element.data.color,
              textAlign: element.data.textAlign,
            }}
            placeholder="Type text here..."
          />
        ) : (
          <div
            className="w-full h-full whitespace-pre-wrap break-words overflow-hidden text-center flex items-center justify-center"
            style={{
              fontSize: `${element.data.fontSize}px`,
              fontFamily: element.data.fontFamily,
              color: element.data.color,
              textAlign: element.data.textAlign,
            }}
          >
            {element.data.content || 'Double-click to edit'}
          </div>
        )}
      </div>
    </RotatableElement>
  );
}

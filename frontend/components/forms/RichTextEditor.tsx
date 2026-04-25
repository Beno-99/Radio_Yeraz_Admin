// src/components/forms/RichTextEditor.tsx - COMPLETELY FIXED
"use client";

import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Link,
  Image as ImageIcon,
  Type,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    if (editorRef.current) {
      if (!editorRef.current.innerHTML && value) {
        editorRef.current.innerHTML = value;
      }
      setIsEmpty(!editorRef.current.innerHTML.trim());
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setIsEmpty(!content.trim());
      onChange(content);
    }
  };

  const handleFocus = () => {
    if (isEmpty && editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const handleBlur = () => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      setIsEmpty(true);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand(
        "insertHTML",
        `<img src="${url}" alt="Image" class="max-w-full h-auto rounded-lg">`
      );
    }
  };

  const handleInsertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Heading"
        >
          <Heading className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={handleInsertLink}
          className="p-2 hover:bg-gray-200 rounded"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleInsertImage}
          className="p-2 hover:bg-gray-200 rounded"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative min-h-[200px]">
        {/* Placeholder (only shows when empty) */}
        {isEmpty && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            <div className="flex items-center">
              <Type className="h-4 w-4 mr-2" />
              {placeholder}
            </div>
          </div>
        )}

        {/* Editor - NO placeholder prop here! */}
        <div
          ref={editorRef}
          className="w-full min-h-[200px] p-4 focus:outline-none"
          contentEditable
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          dangerouslySetInnerHTML={{ __html: value }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}

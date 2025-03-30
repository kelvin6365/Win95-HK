import React, { useState } from "react";
import { useWin95Store } from "@/lib/store";

interface SaveDialogProps {
  windowId: string;
  onSave: () => void;
  onCancel: () => void;
}

export function SaveDialog({ windowId, onSave, onCancel }: SaveDialogProps) {
  const [filename, setFilename] = useState("untitled.png");
  const [selectedFolder] = useState("C:\\My Documents");
  const closeWindow = useWin95Store((state) => state.closeWindow);

  const handleSave = () => {
    onSave();
    closeWindow(windowId);
  };

  const handleCancel = () => {
    onCancel();
    closeWindow(windowId);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--win95-bg)] p-2 text-sm">
      {/* Location bar */}
      <div className="flex items-center mb-2">
        <span className="mr-2">Save in:</span>
        <div className="flex-1 bg-white border-2 border-[var(--win95-border-dark)] px-2 py-1">
          {selectedFolder}
        </div>
        <button className="ml-2 px-2 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]">
          ▲
        </button>
      </div>

      {/* File list area */}
      <div className="flex-1 bg-white border-2 border-[var(--win95-border-dark)] mb-2 overflow-auto">
        <div className="p-2">
          <div className="flex items-center p-1 hover:bg-[var(--win95-button-highlight)]">
            📁 My Documents
          </div>
          <div className="flex items-center p-1 hover:bg-[var(--win95-button-highlight)]">
            📁 Desktop
          </div>
          <div className="flex items-center p-1 hover:bg-[var(--win95-button-highlight)]">
            📁 My Pictures
          </div>
        </div>
      </div>

      {/* Filename input */}
      <div className="flex items-center mb-2">
        <span className="mr-2">File name:</span>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="flex-1 px-2 py-1 border-2 border-[var(--win95-border-dark)] focus:outline-none"
        />
      </div>

      {/* File type selector */}
      <div className="flex items-center mb-4">
        <span className="mr-2">Save as type:</span>
        <select className="flex-1 px-2 py-1 border-2 border-[var(--win95-border-dark)] bg-white">
          <option>PNG Image (*.png)</option>
          <option>JPEG Image (*.jpg)</option>
          <option>Bitmap Image (*.bmp)</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] min-w-[75px]"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] min-w-[75px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

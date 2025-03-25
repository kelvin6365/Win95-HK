"use client";

import { WindowType } from "@/lib/store";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  type: "desktop" | "desktop-icon" | "start-menu";
  itemId?: string;
  onClose: () => void;
  onStartMenuAction?: (action: string, itemId?: string) => void;
  createWindow?: (type: WindowType, title?: string) => string;
  show: boolean;
}

export function Win95ContextMenu({
  x,
  y,
  type,
  itemId,
  onClose,
  onStartMenuAction,
  createWindow,
  show,
}: ContextMenuProps) {
  // Simpler menu with direct DOM access
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Function to handle direct menu item click
  function handleMenuClick(action: string) {
    console.log(`Menu action ${action} clicked directly`);
    // Close menu first
    onClose();

    // Handle specific actions with a delay
    setTimeout(() => {
      if (action === "lineup") {
        console.log("Executing lineup action");
        onStartMenuAction?.("lineup", "");
      } else if (action === "arrange") {
        createWindow?.("explorer");
      } else if (action === "new-folder") {
        console.log("Creating new folder");
        onStartMenuAction?.("new-folder", "");
      }
    }, 50);
  }

  // Use an effect to position the menu and add click handlers when shown
  useEffect(() => {
    if (show && menuContainerRef.current) {
      const menuEl = menuContainerRef.current;

      // Position the menu properly
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // First render to get dimensions
      menuEl.style.left = `${x}px`;
      menuEl.style.top = `${y}px`;

      // Adjust if needed
      const rect = menuEl.getBoundingClientRect();
      if (x + rect.width > viewportWidth) {
        menuEl.style.left = `${viewportWidth - rect.width - 5}px`;
      }
      if (y + rect.height > viewportHeight) {
        menuEl.style.top = `${viewportHeight - rect.height - 5}px`;
      }
    }
  }, [show, x, y]);

  return (
    <div
      ref={menuContainerRef}
      className={cn(
        "fixed bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#5a5a5a] border-r-[#5a5a5a] shadow-md z-[9999]",
        !show && "hidden"
      )}
      style={{
        position: "fixed",
        width: "180px",
        padding: "2px",
        fontFamily: "Arial",
        fontSize: "12px",
      }}
    >
      {type === "desktop" && (
        <div>
          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            data-action="arrange"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMenuClick("arrange");
            }}
          >
            Arrange Icons
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            data-action="lineup"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Direct React click handler on Line up Icons");
              handleMenuClick("lineup");
            }}
          >
            Line up Icons
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => handleMenuClick("paste")}
          >
            Paste
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => handleMenuClick("paste-shortcut")}
          >
            Paste Shortcut
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => handleMenuClick("new-folder")}
          >
            New Folder
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => handleMenuClick("properties")}
          >
            Properties
          </div>
        </div>
      )}

      {type === "desktop-icon" && (
        <div>
          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              handleMenuClick("open");
              onStartMenuAction?.("open", itemId || "");
            }}
          >
            Open
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              handleMenuClick("explore");
              onStartMenuAction?.("explore", itemId || "");
            }}
          >
            Explore
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              handleMenuClick("cut");
              onStartMenuAction?.("cut", itemId || "");
            }}
          >
            Cut
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              handleMenuClick("copy");
              onStartMenuAction?.("copy", itemId || "");
            }}
          >
            Copy
          </div>
        </div>
      )}
    </div>
  );
}

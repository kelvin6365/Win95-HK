"use client";

import { useWin95Store } from "@/lib/store";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  type: "desktop" | "desktop-icon" | "start-menu";
  itemId?: string;
  onClose: () => void;
  onStartMenuAction?: (action: string, itemId?: string) => void;
  show: boolean;
}

export function Win95ContextMenu({
  x,
  y,
  type,
  itemId,
  onClose,
  onStartMenuAction,
  show,
}: ContextMenuProps) {
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const clipboard = useWin95Store((state) => state.clipboard);

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

  // Add a useEffect to handle the context menu closing when the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (show && !menuContainerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

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
              onClose();
              setTimeout(() => onStartMenuAction?.("arrange"), 50);
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
              onClose();
              setTimeout(() => onStartMenuAction?.("lineup"), 50);
            }}
          >
            Line up Icons
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className={cn(
              "px-4 py-1 hover:bg-[#000080] hover:text-white",
              clipboard.items.length > 0
                ? "cursor-pointer"
                : "text-[#808080] cursor-default"
            )}
            onMouseDown={() => {
              if (clipboard.items.length > 0) {
                onClose();
                setTimeout(() => onStartMenuAction?.("paste"), 50);
              }
            }}
          >
            Paste
          </div>

          <div
            className={cn(
              "px-4 py-1 hover:bg-[#000080] hover:text-white",
              clipboard.items.length > 0
                ? "cursor-pointer"
                : "text-[#808080] cursor-default"
            )}
            onMouseDown={() => {
              if (clipboard.items.length > 0) {
                onClose();
                setTimeout(() => onStartMenuAction?.("paste-shortcut"), 50);
              }
            }}
          >
            Paste Shortcut
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("new-folder"), 50);
            }}
          >
            New Folder
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("properties"), 50);
            }}
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
              onClose();
              setTimeout(() => onStartMenuAction?.("open", itemId), 50);
            }}
          >
            Open
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("explore", itemId), 50);
            }}
          >
            Explore
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("cut", itemId), 50);
            }}
          >
            Cut
          </div>

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("copy", itemId), 50);
            }}
          >
            Copy
          </div>

          {clipboard.items.length > 0 && (
            <>
              <div className="border-t border-[#5a5a5a] my-1" />
              <div
                className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
                onMouseDown={() => {
                  onClose();
                  setTimeout(
                    () => onStartMenuAction?.("paste-to-folder", itemId),
                    50
                  );
                }}
              >
                Paste
              </div>
            </>
          )}

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("rename", itemId), 50);
            }}
          >
            Rename
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("delete", itemId), 50);
            }}
          >
            Delete
          </div>

          <div className="border-t border-[#5a5a5a] my-1" />

          <div
            className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            onMouseDown={() => {
              onClose();
              setTimeout(() => onStartMenuAction?.("properties", itemId), 50);
            }}
          >
            Properties
          </div>
        </div>
      )}
    </div>
  );
}

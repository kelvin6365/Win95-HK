import { useEffect, useState, useCallback } from "react";
import { useWin95Store } from "@/lib/store";
import { TextFileIcon } from "../text-file-icon";
import { DesktopIcon } from "@/lib/store";

export interface FileManagerProps {
  windowId: string;
  folderId?: string; // Add folder ID to know which folder to display
}

// Create a simple event emitter to notify all file managers when files are moved
const fileManagerEvents = {
  listeners: new Set<
    (sourceFolderId?: string, targetFolderId?: string) => void
  >(),
  subscribe: (
    listener: (sourceFolderId?: string, targetFolderId?: string) => void
  ) => {
    fileManagerEvents.listeners.add(listener);
    return () => fileManagerEvents.listeners.delete(listener);
  },
  notify: (sourceFolderId?: string, targetFolderId?: string) => {
    fileManagerEvents.listeners.forEach((listener) =>
      listener(sourceFolderId, targetFolderId)
    );
  },
};

export function FileManager({ windowId, folderId }: FileManagerProps) {
  const {
    desktopIcons,
    getFolderContents,
    updateWindowTitle,
    moveItemToFolder,
    addWindow,
    setActiveWindow,
  } = useWin95Store();

  // Load initial folder state from localStorage if available
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    () => {
      if (folderId) return folderId;
      // Try to load saved folder state for this window
      if (typeof window !== "undefined") {
        const savedState = localStorage.getItem(
          `win95_folder_view_${windowId}`
        );
        return savedState || undefined;
      }
      return undefined;
    }
  );

  // Save folder state when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentFolderId) {
        localStorage.setItem(`win95_folder_view_${windowId}`, currentFolderId);
      } else {
        localStorage.removeItem(`win95_folder_view_${windowId}`);
      }
    }
  }, [currentFolderId, windowId]);

  // Clean up saved state when window is closed
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`win95_folder_view_${windowId}`);
      }
    };
  }, [windowId]);

  const [folderItems, setFolderItems] = useState<DesktopIcon[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Add a key to force re-render
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to force a refresh of the current view
  const forceRefresh = useCallback(() => {
    console.log("Force refreshing folder view for:", currentFolderId);
    setRefreshKey((prev) => prev + 1);

    // Get the latest contents
    if (currentFolderId) {
      const folderContents = getFolderContents(currentFolderId);
      console.log("Refreshed folder contents:", folderContents);
      setFolderItems(folderContents);
    } else {
      const desktopContents = Object.values(desktopIcons).filter(
        (icon) => !icon.parentFolderId
      );
      console.log("Refreshed desktop contents:", desktopContents);
      setFolderItems(desktopContents);
    }
  }, [currentFolderId, getFolderContents, desktopIcons]);

  // Subscribe to global file manager events
  useEffect(() => {
    // Subscribe to events from other file managers
    const handleFileManagerEvent = (
      sourceFolderId?: string,
      targetFolderId?: string
    ) => {
      console.log("File manager event received:", {
        sourceFolderId,
        targetFolderId,
        currentFolderId,
      });

      // Only refresh if we're viewing the source or target folder, or desktop
      if (
        !currentFolderId ||
        currentFolderId === sourceFolderId ||
        currentFolderId === targetFolderId
      ) {
        forceRefresh();
      }
    };

    const unsubscribe = fileManagerEvents.subscribe(handleFileManagerEvent);
    return () => {
      unsubscribe();
    };
  }, [currentFolderId, forceRefresh]);

  // Update folder contents when the current folder changes or when desktopIcons/folderContents change
  useEffect(() => {
    console.log("Folder contents effect triggered", {
      currentFolderId,
      refreshKey,
      folderItems: folderItems.map((item) => item.id),
    });

    if (currentFolderId) {
      const folderContents = getFolderContents(currentFolderId);
      setFolderItems(folderContents);

      // Update window title to reflect current folder
      const folderName = desktopIcons[currentFolderId]?.label || "Explorer";
      updateWindowTitle(windowId, folderName);
    } else {
      // If no folder is selected, show desktop items without parent folder
      const rootItems = Object.values(desktopIcons).filter(
        (icon) => !icon.parentFolderId
      );
      setFolderItems(rootItems);
      updateWindowTitle(windowId, "Desktop");
    }
  }, [
    currentFolderId,
    getFolderContents,
    desktopIcons,
    updateWindowTitle,
    windowId,
    refreshKey,
  ]);

  // Handle item selection
  const handleItemClick = (itemId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Add or remove from multi-selection
      setSelectedItems((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      // Single selection
      setSelectedItems([itemId]);
    }
  };

  // Handle double-click to open items
  const handleItemDoubleClick = (itemId: string) => {
    const item = desktopIcons[itemId];
    if (!item) return;

    if (item.type === "folder") {
      // Navigate into folder
      setCurrentFolderId(itemId);
      setSelectedItems([]);
    } else if (item.type === "text-file") {
      // Open text file in Notepad
      const fileTitle = item.label;
      const newWindowId = `window-${Date.now()}`;
      addWindow({
        id: newWindowId,
        type: "text-file",
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        title: fileTitle,
        filename: fileTitle,
      });
      setActiveWindow(newWindowId);
    }
  };

  // Handle drag and drop
  const handleItemDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("file-item", itemId);
    e.dataTransfer.effectAllowed = "move";

    // If item is not in current selection, select it
    if (!selectedItems.includes(itemId)) {
      setSelectedItems([itemId]);
    }
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Highlight the folder (we could add visual feedback here)
  };

  const handleDrop = (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();

    const itemId = e.dataTransfer.getData("file-item");
    const desktopIconId = e.dataTransfer.getData("desktop-icon");

    // Get source folder ID before moving
    const sourceItem = itemId
      ? desktopIcons[itemId]
      : desktopIconId
      ? desktopIcons[desktopIconId]
      : null;
    const sourceFolderId = sourceItem?.parentFolderId;

    console.log("DEBUG DROP:", {
      itemId,
      desktopIconId,
      sourceItem,
      sourceFolderId,
      targetFolderId,
      currentFolderId,
    });

    // Don't allow dropping into the same folder
    if (sourceFolderId === targetFolderId) {
      console.log("Same folder, aborting");
      return;
    }

    // Handle drop from file manager or desktop
    if (!itemId && !desktopIconId) {
      console.log("No item to move, aborting");
      return;
    }

    const itemToMove = itemId || desktopIconId || "";
    if (!itemToMove) return;

    try {
      console.log(
        "Moving item:",
        itemToMove,
        "from",
        sourceFolderId,
        "to",
        targetFolderId
      );

      // Move the dragged item
      moveItemToFolder(itemToMove, targetFolderId);

      // Also move any selected items if from file manager
      if (itemId && selectedItems.length > 0) {
        console.log("Moving selected items:", selectedItems);
        selectedItems.forEach((selectedId) => {
          if (selectedId !== itemToMove) {
            moveItemToFolder(selectedId, targetFolderId);
          }
        });
      }

      // Force refresh this view
      forceRefresh();

      // Notify all other file managers to refresh with source and target info
      fileManagerEvents.notify(sourceFolderId, targetFolderId);

      // Clear selection after successful move
      setSelectedItems([]);
    } catch (error) {
      console.error("Error moving items:", error);
    }
  };

  // Replace both drop handlers with the consolidated one
  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    handleDrop(e, targetFolderId);
  };

  // Handle navigation up to parent directory
  const handleNavigateUp = () => {
    if (!currentFolderId) return;

    const parentFolder = Object.values(desktopIcons).find(
      (icon) => icon.id === currentFolderId
    )?.parentFolderId;

    setCurrentFolderId(parentFolder);
    setSelectedItems([]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-1 text-xs">
        <div className="flex flex-row">
          <div
            className="mr-4 cursor-pointer hover:underline"
            onClick={() => setCurrentFolderId(undefined)}
          >
            Desktop
          </div>
          {currentFolderId && (
            <div
              className="mr-4 cursor-pointer hover:underline"
              onClick={handleNavigateUp}
            >
              Up
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 flex text-xs p-2 overflow-auto"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          if (currentFolderId) {
            handleDrop(e, currentFolderId);
          } else {
            // When dropping on desktop view, pass undefined as targetFolderId
            handleDrop(e, undefined);
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedItems([]);
          }
        }}
      >
        <div
          className="grid grid-cols-4 gap-4 w-full"
          onClick={(e) => {
            // Deselect when clicking on the grid background
            if (e.target === e.currentTarget) {
              setSelectedItems([]);
            }
          }}
        >
          {folderItems.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col h-fit items-center justify-center p-2 ${
                selectedItems.includes(item.id) ? "bg-[#000080] text-white" : ""
              }`}
              onClick={(e) => handleItemClick(item.id, e)}
              onDoubleClick={() => handleItemDoubleClick(item.id)}
              draggable
              onDragStart={(e) => handleItemDragStart(e, item.id)}
              onDragOver={(e) =>
                item.type === "folder" ? handleFolderDragOver(e) : undefined
              }
              onDrop={(e) =>
                item.type === "folder"
                  ? handleFolderDrop(e, item.id)
                  : undefined
              }
            >
              <div className="w-8 h-8 mb-1 flex items-center justify-center">
                {item.type === "folder" && (
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path
                      d="M2,5 L9,5 L11,7 L22,7 L22,20 L2,20 Z"
                      fill="#fceb74"
                      stroke="#000"
                      strokeWidth="1"
                    />
                    <path
                      d="M2,5 L2,20 L22,20 L22,7 L11,7 L9,5 Z"
                      fill="none"
                      stroke="#000"
                      strokeWidth="1"
                    />
                  </svg>
                )}
                {item.type === "text-file" && <TextFileIcon />}
                {item.type === "myComputer" && (
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="15"
                      fill="#fcf481"
                      stroke="#000"
                    />
                    <rect
                      x="5"
                      y="6"
                      width="14"
                      height="9"
                      fill="#fff"
                      stroke="#000"
                    />
                    <rect
                      x="9"
                      y="18"
                      width="6"
                      height="3"
                      fill="#c0c0c0"
                      stroke="#000"
                    />
                  </svg>
                )}
              </div>
              <div
                className="text-center truncate max-w-full"
                style={{ wordBreak: "break-word" }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--win95-bg)] border-t border-[var(--win95-border-dark)] p-1 text-xs">
        {selectedItems.length === 0
          ? `${folderItems.length} item(s)`
          : `${selectedItems.length} item(s) selected`}
      </div>
    </div>
  );
}

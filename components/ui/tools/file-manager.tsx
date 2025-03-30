import { DesktopIcon, useWin95Store, WindowType } from "@/lib/store";
import { useCallback, useEffect, useState } from "react";
import { TextFileIcon } from "../text-file-icon";

export interface FileManagerProps {
  windowId: string;
  folderId?: string; // Add folder ID to know which folder to display
}

export function FileManager({ windowId, folderId }: FileManagerProps) {
  const {
    desktopIcons,
    getFolderContents,
    updateWindowTitle,
    moveItemToFolder,
    addWindow,
    setActiveWindow,
    removeItemFromFolder,
    closeWindow,
    copyItem,
    addItemToFolder,
  } = useWin95Store();

  // Local state for the folder being viewed
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    folderId
  );
  const [folderItems, setFolderItems] = useState<DesktopIcon[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Add a key to force re-render
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to force a refresh of the current view
  const forceRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Create an event emitter for file manager updates
  const fileManagerEvents = {
    notify: (sourceFolderId?: string, targetFolderId?: string) => {
      window.dispatchEvent(
        new CustomEvent("folderContentsChanged", {
          detail: { sourceFolderId, targetFolderId },
        })
      );
    },
  };

  // Update folder contents when the current folder changes
  useEffect(() => {
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
    refreshKey, // Add refreshKey to dependencies to trigger refresh
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
        type: "text-file" as WindowType,
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        title: fileTitle,
        filename: fileTitle,
        minimized: false,
        maximized: false,
        isMaximized: false,
        component: "text-file",
      });
      setActiveWindow(newWindowId);
    } else if (item.type === "paint-file") {
      // Open paint file in Paint
      const fileTitle = item.label;
      const newWindowId = `window-${Date.now()}`;
      addWindow({
        id: newWindowId,
        type: "paint" as WindowType,
        position: { x: 100, y: 100 },
        size: { width: 600, height: 450 },
        title: `Paint - ${fileTitle}`,
        filename: fileTitle,
        iconId: itemId,
        minimized: false,
        maximized: false,
        isMaximized: false,
        component: "paint",
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
      // Check if a file with the same name exists in the target location
      const sourceIcon = desktopIcons[itemToMove];
      const targetItems = targetFolderId
        ? getFolderContents(targetFolderId)
        : Object.values(desktopIcons).filter((icon) => !icon.parentFolderId);

      const existingItem = targetItems.find(
        (item) => item.label === sourceIcon.label
      );

      if (existingItem) {
        // Create a window to show the conflict dialog
        const dialogId = `dialog-${Date.now()}`;
        addWindow({
          id: dialogId,
          type: "default" as WindowType,
          position: { x: 200, y: 150 },
          size: { width: 400, height: 150 },
          title: "File Already Exists",
          minimized: false,
          maximized: false,
          component: "default",
          content: {
            message: `A file named "${sourceIcon.label}" already exists in this location.\nDo you want to replace it or create a copy?`,
            buttons: [
              {
                label: "Replace",
                onClick: () => {
                  // Remove existing item first
                  if (targetFolderId) {
                    removeItemFromFolder(targetFolderId, existingItem.id);
                  }
                  // Move the new item
                  moveItemToFolder(itemToMove, targetFolderId);
                  // Close dialog
                  closeWindow(dialogId);
                },
              },
              {
                label: "Create Copy",
                onClick: () => {
                  // Generate a new name with (2), (3), etc.
                  let newName = sourceIcon.label;
                  let counter = 2;
                  const baseName = sourceIcon.label.replace(/\s*\(\d+\)$/, "");
                  const ext = baseName.includes(".")
                    ? baseName.substring(baseName.lastIndexOf("."))
                    : "";
                  const nameWithoutExt = baseName.replace(ext, "");

                  while (targetItems.some((item) => item.label === newName)) {
                    newName = `${nameWithoutExt} (${counter})${ext}`;
                    counter++;
                  }

                  // Create a copy with the new name
                  copyItem(itemToMove, targetFolderId, newName);
                  // Close dialog
                  closeWindow(dialogId);
                },
              },
              {
                label: "Cancel",
                onClick: () => {
                  closeWindow(dialogId);
                },
              },
            ],
          },
        });
        setActiveWindow(dialogId);
        return;
      }

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

      // If moving from one folder to another, remove from source folder first
      if (sourceFolderId) {
        removeItemFromFolder(sourceFolderId, itemToMove);
      }

      // If moving to a folder, add to target folder
      if (targetFolderId) {
        addItemToFolder(targetFolderId, itemToMove);
      }

      // Also move any selected items if from file manager
      if (itemId && selectedItems.length > 0) {
        console.log("Moving selected items:", selectedItems);
        selectedItems.forEach((selectedId) => {
          if (selectedId !== itemToMove) {
            moveItemToFolder(selectedId, targetFolderId);

            // Handle folder contents for selected items too
            if (sourceFolderId) {
              removeItemFromFolder(sourceFolderId, selectedId);
            }
            if (targetFolderId) {
              addItemToFolder(targetFolderId, selectedId);
            }
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

  // Add event listener for folder contents changes
  useEffect(() => {
    const handleFolderUpdate = (e: CustomEvent) => {
      const { sourceFolderId, targetFolderId } = e.detail;

      // Update contents if this FileManager is showing either the source or target folder
      if (
        currentFolderId === sourceFolderId ||
        currentFolderId === targetFolderId
      ) {
        if (currentFolderId) {
          setFolderItems(getFolderContents(currentFolderId));
        }
      }
    };

    window.addEventListener(
      "folderContentsChanged",
      handleFolderUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "folderContentsChanged",
        handleFolderUpdate as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

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
                {item.type === "paint-file" && (
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      fill="#fff"
                      stroke="#000"
                    />
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="12"
                      fill="#fff"
                      stroke="#000"
                    />
                    <circle cx="12" cy="10" r="4" fill="#ff0000" />
                    <rect x="6" y="18" width="12" height="2" fill="#000" />
                  </svg>
                )}
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

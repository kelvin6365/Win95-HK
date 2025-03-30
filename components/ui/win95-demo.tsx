"use client";
import {
  DraggableWindow,
  DraggableWindowRef,
} from "@/components/ui/draggable-window";
import { Taskbar, TaskbarItem } from "@/components/ui/taskbar";
import {
  CalculatorIcon,
  ComputerIcon,
  ControlPanelIcon,
  DocumentsIcon,
  ExplorerIcon,
  FindIcon,
  HelpIcon,
  MsDosIcon,
  NotepadIcon,
  PaintIcon,
  ProgramsIcon,
  RunIcon,
  SettingsIcon,
  ShutdownIcon,
} from "@/components/ui/win95-icons";
import { Win95ContextMenu } from "@/components/ui/context-menu";
import { Win95LoadingScreen } from "@/components/ui/loading-screen";
import { StartMenu } from "@/components/ui/start-menu";
import { TextFileIcon } from "@/components/ui/text-file-icon";
import {
  Calculator,
  DefaultWindow,
  FileManager,
  MyComputer,
  Notepad,
  Paint,
} from "@/components/ui/tools";
import { useWin95Store, WindowType, DesktopIcon } from "@/lib/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wallpaper } from "./wallpaper";
import { cn } from "../../lib/utils";
import { getDefaultWindowSize } from "@/lib/utils/windows";
import {
  saveWindowState,
  loadSavedWindowState,
  SavedWindowState,
} from "@/lib/utils/window-persistence";
import { SaveDialog } from "./dialogs/save-dialog";

export default function Win95Demo() {
  // State to track if the system is ready
  const [isSystemReady, setIsSystemReady] = useState(false);
  // State to track if it's the first visit
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // CSS for desktop icons with Win95 style selection
  const desktopIconStyles = `
    .win95-desktop-icon-focused {
      position: relative;
      animation: marchingAnts 0.5s infinite linear;
      overflow: visible !important;
    }
    @keyframes marchingAnts {
      0% { border-style: dotted; }
      50% { border-style: dashed; }
      100% { border-style: dotted; }
    }
    .win95-dragging {
      outline: 1px dotted #fff;
    }
  `;

  // Get state and actions from Zustand store
  const {
    windows,
    activeWindowId,
    isMyComputerVisible,
    isTaskbarOpen,
    desktopIcons,
    selectedDesktopIcons,
    contextMenu,
    editingIconId,
    addWindow,
    setActiveWindow,
    closeWindow,
    toggleTaskbar,
    setTaskbarOpen,
    updateDesktopIconPosition,
    selectDesktopIcon,
    clearDesktopSelection,
    setContextMenu,
    setCurrentTime,
    addDesktopIcon,
    setEditingIconId,
    renameDesktopIcon,
  } = useWin95Store();

  // Check if it's the first visit using localStorage
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      const hasVisitedBefore = localStorage.getItem("win95_has_visited");
      if (!hasVisitedBefore) {
        // First visit - show loading screen
        setIsFirstVisit(true);
        // Set the flag in localStorage
        localStorage.setItem("win95_has_visited", "true");

        // Clear any existing window state to ensure a clean start
        localStorage.removeItem("win95_window_state");
        // Ensure the myComputerVisible flag is properly reset
        useWin95Store.setState({ isMyComputerVisible: false });
      } else {
        // Not first visit - skip loading screen
        setIsFirstVisit(false);
        setIsSystemReady(true);
      }
    }
  }, []);

  // References
  const windowRefs = useRef<Record<string, DraggableWindowRef>>({});
  const startMenuRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Constants for grid snapping
  const GRID_SIZE = 92; // Size of grid to snap to for Windows 95 authentic look

  // Handle loading complete
  const handleLoadingComplete = useCallback(() => {
    setIsSystemReady(true);
  }, []);

  // Monitor click outside for taskbar and context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isTaskbarOpen &&
        startMenuRef.current &&
        startButtonRef.current &&
        !startMenuRef.current.contains(event.target as Node) &&
        !startButtonRef.current.contains(event.target as Node)
      ) {
        setTaskbarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTaskbarOpen, contextMenu, setTaskbarOpen, setContextMenu]);

  // Keep clock updated
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setCurrentTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
    };

    // Initial update
    updateClock();

    // Set interval for updates
    const intervalId = setInterval(updateClock, 60000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [setCurrentTime]);

  // Window reference registration
  const registerWindowRef = useCallback(
    (id: string, ref: DraggableWindowRef | null) => {
      if (ref) {
        windowRefs.current[id] = ref;
      }
    },
    []
  );

  // Window handling functions
  const handleWindowFocus = useCallback(
    (id: string) => {
      // Set active window - the store will handle z-index internally
      setActiveWindow(id);
    },
    [setActiveWindow]
  );

  const handleCloseWindow = useCallback(
    (id: string) => {
      // Check if the window being closed is My Computer
      const windowType = windows[id]?.type;

      // Close the window
      closeWindow(id);

      // If it's My Computer, update the visibility flag but ONLY if we're not in desktop icon flow
      // We need to check if this is a special my-computer-main window that should affect the isMyComputerVisible flag
      if (windowType === "my-computer" && id === "my-computer-main") {
        // Use the store's method directly to update visibility
        useWin95Store.setState({ isMyComputerVisible: false });
      }
    },
    [closeWindow, windows]
  );

  // Get the default title for a window type
  const getDefaultTitle = useCallback((type: WindowType) => {
    switch (type) {
      case "notepad":
        return "Untitled - Notepad";
      case "calculator":
        return "Calculator";
      case "explorer":
        return "Windows Explorer";
      case "paint":
        return "Untitled - Paint";
      case "filemanager":
        return "File Manager";
      default:
        return "Window";
    }
  }, []);

  // Get window content function based on window type
  const getWindowContent = useCallback(
    (type: WindowType, windowId: string, filename?: string) => {
      const { updateWindowTitle } = useWin95Store.getState();
      const window = windows[windowId];

      switch (type) {
        case "notepad":
          return (
            <Notepad
              windowId={windowId}
              filename={filename}
              onTitleChange={(newTitle) =>
                updateWindowTitle(windowId, newTitle)
              }
            />
          );
        case "calculator":
          return <Calculator windowId={windowId} />;
        case "explorer":
          return <FileManager windowId={windowId} folderId={window.folderId} />;
        case "paint":
          return (
            <Paint
              windowId={windowId}
              resizable={true}
              size={windows[windowId]?.size || { width: 600, height: 450 }}
              filename={filename}
            />
          );
        case "filemanager":
          return <FileManager windowId={windowId} folderId={window.folderId} />;
        case "text-file":
          return (
            <Notepad
              windowId={windowId}
              filename={filename}
              onTitleChange={(newTitle) =>
                updateWindowTitle(windowId, newTitle)
              }
            />
          );
        case "my-computer":
          return <MyComputer windowId={windowId} />;
        case "default":
          if (window.component === "save-dialog") {
            return (
              <SaveDialog
                windowId={windowId}
                onSave={() => {
                  if (
                    window.content &&
                    typeof window.content === "object" &&
                    "buttons" in window.content
                  ) {
                    const saveButton = window.content.buttons.find(
                      (btn) => btn.label === "Save"
                    );
                    if (saveButton) {
                      saveButton.onClick();
                    }
                  }
                }}
                onCancel={() => {
                  if (
                    window.content &&
                    typeof window.content === "object" &&
                    "buttons" in window.content
                  ) {
                    const cancelButton = window.content.buttons.find(
                      (btn) => btn.label === "Cancel"
                    );
                    if (cancelButton) {
                      cancelButton.onClick();
                    }
                  }
                }}
              />
            );
          }
          // Use DefaultWindow when explicitly requested
          return <DefaultWindow windowId={windowId} title={filename} />;
        default:
          // For any other type, just show an empty div to prevent DefaultWindow from showing up
          console.warn(
            `Unhandled window type: ${type} for window ID: ${windowId}`
          );
          return (
            <div
              className="flex-1 h-full w-full"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              Window content
            </div>
          );
      }
    },
    [windows]
  );

  // Status message handler
  const updateStatusMessage = useCallback((message: string) => {
    console.log(`Status: ${message}`);

    // Find status bar element and update text
    const statusBar = document.querySelector(
      ".bg-\\[var\\(--win95-bg\\)\\].border-t"
    ) as HTMLElement;

    if (statusBar) {
      const originalText = statusBar.textContent;
      statusBar.textContent = message;

      // Reset status after 2 seconds
      setTimeout(() => {
        statusBar.textContent = originalText || "Ready";
      }, 2000);
    }
  }, []);

  // Create a new window
  const createWindow = useCallback(
    (
      type: WindowType,
      title?: string,
      filename?: string,
      folderId?: string
    ) => {
      const id =
        type === "default"
          ? `default-window-${Date.now()}`
          : `window-${Date.now()}`;

      // Generate a random position
      const x = 100 + Math.floor(Math.random() * 100);
      const y = 50 + Math.floor(Math.random() * 100);

      // Set appropriate size based on window type
      const size = getDefaultWindowSize(type);

      // Add window to store
      addWindow({
        id,
        type,
        position: { x, y },
        size,
        title: title || getDefaultTitle(type),
        filename,
        folderId,
        minimized: false,
        maximized: false,
        component: type,
      });

      // Close start menu if it's open
      if (isTaskbarOpen) {
        setTaskbarOpen(false);
      }

      // Show status message when creating window
      updateStatusMessage(`Opened ${title || getDefaultTitle(type)}`);

      return id;
    },
    [
      addWindow,
      getDefaultTitle,
      isTaskbarOpen,
      setTaskbarOpen,
      updateStatusMessage,
    ]
  );

  // Desktop icon drag handlers
  const handleDesktopIconDragStart = useCallback(
    (e: React.DragEvent, iconId: string) => {
      e.dataTransfer.setData("desktop-icon", iconId);
      e.dataTransfer.effectAllowed = "move";

      // Create a visual clone of the icon being dragged to use as drag image
      const iconElement = e.currentTarget as HTMLElement;
      const iconRect = iconElement.getBoundingClientRect();

      // Create a clone of the element for the drag image
      const dragImage = iconElement.cloneNode(true) as HTMLElement;

      // Set styles for the drag image
      dragImage.style.width = `${iconRect.width}px`;
      dragImage.style.height = `${iconRect.height}px`;
      dragImage.style.opacity = "0.8";
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px"; // Hide initially
      dragImage.style.left = "-1000px";
      dragImage.style.pointerEvents = "none";
      dragImage.style.zIndex = "9999";

      // Add to DOM temporarily
      document.body.appendChild(dragImage);

      // Set as drag image with proper offset
      // For Windows 95 style, we want the cursor at the center of the icon
      const offsetX = iconRect.width / 2;
      const offsetY = 10; // Position cursor near the top of the icon
      e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

      // Remove the clone after drag starts
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);

      // Change cursor during drag
      document.body.style.cursor = "move";

      // Make the original icon semi-transparent during drag
      iconElement.style.opacity = "0.4";
      iconElement.dataset.wasDragging = "true";

      // Add dragging class for visual feedback
      iconElement.classList.add("win95-dragging");

      // Select the icon being dragged if not already selected
      if (!selectedDesktopIcons.includes(iconId)) {
        selectDesktopIcon(iconId);
      }

      // Mark other selected icons as being dragged as part of a group
      if (selectedDesktopIcons.length > 1) {
        selectedDesktopIcons.forEach((id) => {
          if (id !== iconId) {
            const el = document.querySelector(`[data-icon-id="${id}"]`);
            if (el) {
              (el as HTMLElement).classList.add("win95-dragging");
              (el as HTMLElement).style.opacity = "0.4";
              (el as HTMLElement).dataset.wasDragging = "true";
            }
          }
        });
      }
    },
    [selectedDesktopIcons, selectDesktopIcon]
  );

  // Handle desktop drop
  const handleDesktopDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      // Reset cursor
      document.body.style.cursor = "default";

      // Get the icon being dragged
      const iconId = e.dataTransfer.getData("desktop-icon");
      const fileItemId = e.dataTransfer.getData("file-item");

      if ((!iconId && !fileItemId) || !desktopRef.current) return;

      // Reset styles on all desktop icons that were dragged
      const icons = document.querySelectorAll('[data-was-dragging="true"]');
      icons.forEach((icon) => {
        const el = icon as HTMLElement;
        el.style.opacity = "1";
        el.classList.remove("win95-dragging");
        delete el.dataset.wasDragging;
      });

      // Check if we're dropping on a folder
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const folderIconElement = dropTarget?.closest("[data-icon-id]");
      const folderIconId = folderIconElement?.getAttribute("data-icon-id");

      if (folderIconId && desktopIcons[folderIconId]?.type === "folder") {
        // We're dropping onto a folder
        console.log(`Dropping onto folder: ${folderIconId}`);

        // Get the Zustand store functions directly to avoid stale closures
        const { moveItemToFolder, addItemToFolder } = useWin95Store.getState();

        if (iconId) {
          // Move the dragged icon to this folder
          moveItemToFolder(iconId, folderIconId);
          addItemToFolder(folderIconId, iconId);

          // If multiple icons were selected, move them all
          if (selectedDesktopIcons.includes(iconId)) {
            selectedDesktopIcons.forEach((id) => {
              if (id !== iconId) {
                moveItemToFolder(id, folderIconId);
                addItemToFolder(folderIconId, id);
              }
            });
          }

          return; // Exit early since we're handling this as a folder drop
        } else if (fileItemId) {
          // Handle file item being dropped from a file manager window
          moveItemToFolder(fileItemId, folderIconId);
          addItemToFolder(folderIconId, fileItemId);
          return;
        }
      }

      // Get desktop position for regular desktop drops
      const rect = desktopRef.current.getBoundingClientRect();
      let x = Math.max(0, e.clientX - rect.left);
      let y = Math.max(0, e.clientY - rect.top);

      // Snap to grid
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;

      // Ensure icons don't go too far right or bottom
      if (rect.width && rect.height) {
        x = Math.min(x, rect.width - 80);
        y = Math.min(y, rect.height - 80);
      }

      // Handle dragging from file manager to desktop (remove from folder)
      if (fileItemId) {
        const { moveItemToFolder, removeItemFromFolder } =
          useWin95Store.getState();
        const item = desktopIcons[fileItemId];

        if (item && item.parentFolderId) {
          // First remove from the source folder contents list
          removeItemFromFolder(item.parentFolderId, fileItemId);

          // Then update the item's parent folder reference
          moveItemToFolder(fileItemId, undefined);

          // Notify all file managers to refresh
          window.dispatchEvent(
            new CustomEvent("folderContentsChanged", {
              detail: {
                sourceFolderId: item.parentFolderId,
                targetFolderId: undefined,
              },
            })
          );
        }

        // Update the position on the desktop
        updateDesktopIconPosition(fileItemId, { x, y });
        return;
      }

      // Regular desktop icon moving
      if (iconId) {
        // Move all selected icons if we're dragging a selected icon
        if (selectedDesktopIcons.includes(iconId)) {
          const draggedIcon = desktopIcons[iconId];
          const offsetX = x - draggedIcon.x;
          const offsetY = y - draggedIcon.y;

          selectedDesktopIcons.forEach((id) => {
            if (id !== iconId) {
              const icon = desktopIcons[id];
              let newX = icon.x + offsetX;
              let newY = icon.y + offsetY;

              // Ensure within bounds
              if (rect.width && rect.height) {
                newX = Math.min(newX, rect.width - 80);
                newY = Math.min(newY, rect.height - 80);
                newX = Math.max(0, newX);
                newY = Math.max(0, newY);
              }

              updateDesktopIconPosition(id, { x: newX, y: newY });
            }
          });
        }

        // Update the dragged icon position
        updateDesktopIconPosition(iconId, { x, y });
      }
    },
    [GRID_SIZE, desktopIcons, selectedDesktopIcons, updateDesktopIconPosition]
  );

  // Handle drag over to show proper win95 cursor
  const handleDesktopDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Handle the drag end (in case drop happens outside the desktop)
  const handleDesktopDragEnd = useCallback(() => {
    // Reset cursor
    document.body.style.cursor = "default";

    // Reset opacity and remove dragging class from all icons
    const icons = document.querySelectorAll('[data-was-dragging="true"]');
    icons.forEach((icon) => {
      const el = icon as HTMLElement;
      el.style.opacity = "1";
      el.classList.remove("win95-dragging");
      delete el.dataset.wasDragging;
    });
  }, []);

  // Create a new folder on the desktop
  const createNewFolder = useCallback(() => {
    // Find a unique folder name
    let folderNum = 1;
    let folderName = "New Folder";
    const existingFolderNames = Object.values(desktopIcons)
      .filter((icon) => icon.label.startsWith("New Folder"))
      .map((icon) => icon.label);

    while (existingFolderNames.includes(folderName)) {
      folderNum++;
      folderName = folderNum === 1 ? "New Folder" : `New Folder (${folderNum})`;
    }

    // Generate a unique ID
    const folderId = `folder-${Date.now()}`;

    // Find a position for the new folder
    // First try to find an empty spot near the top left
    let posX = 24;
    let posY = 24;

    // Check if spot is taken, move to next position if it is
    const usedPositions = Object.values(desktopIcons).map((icon) => ({
      x: icon.x,
      y: icon.y,
    }));

    const GRID_X = 94; // Width of an icon + spacing
    const GRID_Y = 94; // Height of an icon + spacing
    const MAX_COLS = Math.floor(
      (desktopRef.current?.clientWidth || 800) / GRID_X
    );

    // Try to find an empty spot in the grid
    let placed = false;
    for (let row = 0; row < 10 && !placed; row++) {
      for (let col = 0; col < MAX_COLS && !placed; col++) {
        const testX = 24 + col * GRID_X;
        const testY = 24 + row * GRID_Y;

        // Check if this position is already used
        const isTaken = usedPositions.some(
          (pos) => Math.abs(pos.x - testX) < 10 && Math.abs(pos.y - testY) < 10
        );

        if (!isTaken) {
          posX = testX;
          posY = testY;
          placed = true;
          break;
        }
      }
    }

    // Create the new folder icon
    const newFolder: DesktopIcon = {
      id: folderId,
      x: posX,
      y: posY,
      label: folderName,
      type: "folder",
    };

    // Add the folder to desktop
    addDesktopIcon(newFolder);

    // Select the new folder and enable edit mode
    setTimeout(() => {
      selectDesktopIcon(folderId);

      // In a real implementation, you'd now show a text field to rename
      // For now, we'll just select it to simulate the Windows 95 behavior
      console.log(
        `📁 Created new folder: ${folderName} at position (${posX}, ${posY})`
      );
    }, 50);

    return folderId;
  }, [desktopIcons, addDesktopIcon, selectDesktopIcon, desktopRef]);

  // Desktop icon click handler
  const handleDesktopIconClick = useCallback(
    (e: React.MouseEvent | null, iconId: string) => {
      if (e) {
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
          // Add or remove from selection with Ctrl/Cmd key
          selectDesktopIcon(iconId, true);
        } else {
          // Reset selection if no Ctrl/Cmd key
          selectDesktopIcon(iconId);
        }
      } else {
        // If no event (programmatic), just select
        selectDesktopIcon(iconId);
      }

      // Add focus effect to show "marching ants" style selection
      const focusedIcons = document.querySelectorAll(
        ".win95-desktop-icon-focused"
      );
      focusedIcons.forEach((icon) => {
        icon.classList.remove("win95-desktop-icon-focused");
      });

      const clickedIcon = document.querySelector(
        `[data-icon-id="${iconId}"] div:last-child`
      );
      if (clickedIcon) {
        clickedIcon.classList.add("win95-desktop-icon-focused");
      }
    },
    [selectDesktopIcon]
  );

  // Handle desktop background click - clear selection
  const handleDesktopClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Stop propagation to prevent unwanted windows
      clearDesktopSelection();

      // Remove all focus effects
      const focusedIcons = document.querySelectorAll(
        ".win95-desktop-icon-focused"
      );
      focusedIcons.forEach((icon) => {
        icon.classList.remove("win95-desktop-icon-focused");
      });
    },
    [clearDesktopSelection]
  );

  // Handle double-click on desktop icons
  const handleDesktopIconDoubleClick = useCallback(
    (iconId: string) => {
      console.log(`Double-clicked on icon: ${iconId}`);
      const icon = desktopIcons[iconId];

      if (iconId === "myComputer") {
        console.log("Opening My Computer");

        // Check if My Computer window already exists
        const existingMyComputer = Object.entries(windows).find(
          ([, win]) => win.type === "my-computer"
        );

        if (existingMyComputer) {
          // If it exists, just focus the existing window
          setActiveWindow(existingMyComputer[0]);
        } else {
          // Otherwise create a new one
          const windowId = createWindow("my-computer", "My Computer");
          setActiveWindow(windowId);
        }
      } else if (icon.type === "text-file" && icon.label.endsWith(".txt")) {
        // Open text files in Notepad
        const fileTitle = icon.label;
        console.log(`Opening text file: ${fileTitle}`);
        // Pass fileTitle as both title and filename to properly load saved content
        const windowId = createWindow("text-file", fileTitle, fileTitle);
        setActiveWindow(windowId);
      } else if (icon.type === "folder") {
        // Open folder in Explorer
        console.log(`Opening folder: ${icon.label}`);
        const windowId = createWindow(
          "explorer",
          icon.label,
          undefined,
          iconId
        );
        setActiveWindow(windowId);
      } else if (icon.type === "paint-file") {
        // Open paint file in Paint
        console.log(`Opening paint file: ${icon.label}`);
        const windowId = createWindow("paint", icon.label, icon.label, icon.id);
        setActiveWindow(windowId);
      }
    },
    [desktopIcons, createWindow, setActiveWindow, windows]
  );

  // Line up desktop icons in a grid pattern
  const lineUpIcons = useCallback(() => {
    console.log("🔄 Lining up icons - function called");

    try {
      // Calculate grid positions
      const ICON_WIDTH = 70;
      const ICON_HEIGHT = 70;
      const MARGIN = 24;

      let posX = MARGIN;
      let posY = MARGIN;
      let column = 0;

      // Sort icons by their labels
      const sortedIcons = Object.entries(desktopIcons).sort((a, b) =>
        a[1].label.localeCompare(b[1].label)
      );

      const ICONS_PER_COLUMN = 8; // Fixed number of icons per column to ensure consistency

      console.log(`Arranging ${sortedIcons.length} icons in a grid`);

      // Position each icon in the grid
      sortedIcons.forEach(([id, icon]) => {
        const newPosition = { x: posX, y: posY };
        console.log(`Moving icon "${icon.label}" to position:`, newPosition);

        // Update icon position
        updateDesktopIconPosition(id, newPosition);

        // Move to next position
        posY += ICON_HEIGHT;

        // Move to next column when needed
        if (++column >= ICONS_PER_COLUMN) {
          posY = MARGIN;
          posX += ICON_WIDTH;
          column = 0;
        }
      });

      // Force UI refresh
      setTimeout(() => {
        // Trigger a small state update to force re-render
        useWin95Store.setState((state) => ({ ...state }));
        console.log("✅ All icons repositioned");
      }, 50);
    } catch (error) {
      console.error("Error in lineUpIcons:", error);
    }
  }, [desktopIcons, updateDesktopIconPosition]);

  // Context menu action handler
  const handleStartMenuAction = useCallback(
    (action: string, itemId?: string) => {
      console.log(
        `👉 Start menu action received: ${action}, Item: ${itemId || "none"}`
      );

      // Handle actions
      switch (action) {
        case "open":
          if (itemId) {
            const item = desktopIcons[itemId];
            if (!item) return;

            if (itemId === "myComputer") {
              handleDesktopIconDoubleClick("myComputer");
            } else if (item.type === "folder") {
              // Open folder in Explorer
              console.log(`Opening folder: ${item.label}`);
              const windowId = createWindow(
                "explorer",
                item.label,
                undefined,
                itemId
              );
              setActiveWindow(windowId);
            } else if (item.type === "text-file") {
              // Open text file in Notepad
              const fileTitle = item.label;
              console.log(`Opening text file: ${fileTitle}`);
              const windowId = createWindow("text-file", fileTitle, fileTitle);
              setActiveWindow(windowId);
            }
          }
          break;

        case "copy":
          if (itemId) {
            // If multiple items are selected and we're copying one of them,
            // copy all selected items
            const itemsToCopy = selectedDesktopIcons.includes(itemId)
              ? selectedDesktopIcons
              : [itemId];

            console.log("Copying items to clipboard:", itemsToCopy);
            useWin95Store.getState().setClipboard("copy", itemsToCopy);
          }
          break;

        case "paste":
          // When pasting on desktop, pass undefined as targetFolderId
          console.log("Pasting items to desktop");
          useWin95Store.getState().pasteItems(undefined);
          break;

        case "paste-to-folder":
          if (itemId) {
            console.log("Pasting items to folder:", itemId);
            useWin95Store.getState().pasteItems(itemId);
          }
          break;

        case "rename":
          if (itemId) {
            setEditingIconId(itemId);
          }
          break;

        case "explore":
          // Handle explore action
          break;
        case "delete":
          // Handle delete action
          break;
        case "properties":
          // Handle properties action
          break;
        case "lineup":
          console.log("⭐ LINEUP ACTION TRIGGERED in handleStartMenuAction!");
          lineUpIcons();
          break;
        case "new-folder":
          console.log("📁 Creating new folder");
          createNewFolder();
          break;
        default:
          console.log(`Unhandled action: ${action}`);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      lineUpIcons,
      handleDesktopIconDoubleClick,
      createNewFolder,
      desktopIcons,
      createWindow,
      setActiveWindow,
      selectedDesktopIcons,
    ]
  );

  // Load saved window state on startup
  useEffect(() => {
    if (!isSystemReady) return;

    const savedWindows = loadSavedWindowState();

    // Only load saved windows if there are any
    if (savedWindows.length > 0) {
      // Track if we found a my-computer window in saved state
      let hasMyComputerWindow = false;

      savedWindows.forEach((win: SavedWindowState) => {
        // Check if this is a my-computer window
        if (win.type === "my-computer") {
          hasMyComputerWindow = true;
        }

        addWindow({
          id: win.id,
          type: win.type as WindowType,
          position: win.position,
          size: win.size,
          title: win.title,
          isMaximized: win.isMinimized,
          folderId: win.currentFolderId,
          minimized: false,
          maximized: win.isMinimized || false,
          component: win.type,
        });
      });

      // Update the myComputerVisible flag based on found windows
      if (hasMyComputerWindow) {
        useWin95Store.setState({ isMyComputerVisible: true });
      }
    } else {
      // If no saved windows and it's the first visit, create an explorer window
      if (isFirstVisit) {
        // Create a Windows Explorer window to show the desktop
        const explorerWindowId = "desktop-explorer";
        addWindow({
          id: explorerWindowId,
          type: "explorer",
          position: { x: 100, y: 50 },
          size: { width: 440, height: 320 },
          title: "Desktop",
          minimized: false,
          maximized: false,
          component: "explorer",
        });
        setActiveWindow(explorerWindowId);
      }
    }
  }, [isSystemReady, addWindow, isFirstVisit, setActiveWindow]);

  // Create the My Computer window at startup if needed (but only if no windows exist)
  useEffect(() => {
    if (isSystemReady && isMyComputerVisible) {
      // Check if My Computer window already exists in the windows array
      const myComputerExists = Object.values(windows).some(
        (window) => window.type === "my-computer"
      );

      // Check if we have any windows at all
      const hasAnyWindows = Object.keys(windows).length > 0;

      // Only create if it doesn't exist AND we don't have any windows (avoiding duplicates on startup)
      if (!myComputerExists && !hasAnyWindows) {
        // Create a My Computer window with the consistent ID
        const myComputerId = "my-computer-main";
        addWindow({
          id: myComputerId,
          type: "my-computer",
          position: { x: 80, y: 50 },
          size: { width: 440, height: 320 },
          title: "My Computer",
          minimized: false,
          maximized: false,
          component: "my-computer",
        });

        // Set it as the active window
        setActiveWindow(myComputerId);
      }
    }
  }, [isSystemReady, isMyComputerVisible, windows, addWindow, setActiveWindow]);

  // Save window state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const windowsToSave = Object.entries(windows).map(([id, win]) => ({
        id,
        type: win.type,
        title: win.title,
        position: win.position,
        size: win.size || { width: 400, height: 300 },
        isMinimized: win.isMaximized,
        currentFolderId:
          win.type === "filemanager"
            ? localStorage.getItem(`win95_folder_view_${id}`) || undefined
            : undefined,
      }));
      saveWindowState(windowsToSave);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [windows]);

  // Handle icon name editing
  const handleIconNameDoubleClick = useCallback(
    (e: React.MouseEvent, iconId: string) => {
      e.stopPropagation();
      e.preventDefault();
      setEditingIconId(iconId);
    },
    [setEditingIconId]
  );

  const handleIconNameEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, iconId: string) => {
      if (e.key === "Enter") {
        const newName = (e.target as HTMLInputElement).value.trim();
        if (newName) {
          renameDesktopIcon(iconId, newName);
        }
        setEditingIconId(null);
      } else if (e.key === "Escape") {
        setEditingIconId(null);
      }
    },
    [renameDesktopIcon, setEditingIconId]
  );

  const handleIconNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>, iconId: string) => {
      const newName = e.target.value.trim();
      if (newName) {
        renameDesktopIcon(iconId, newName);
      }
      setEditingIconId(null);
    },
    [renameDesktopIcon, setEditingIconId]
  );

  return (
    <div className="relative overflow-hidden w-full h-full">
      {!isSystemReady && isFirstVisit && (
        <Win95LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {isSystemReady && (
        <Wallpaper>
          <div className="flex flex-col h-screen overflow-hidden font-[var(--win95-font)]">
            {/* Desktop area */}
            <div
              className="flex-1 relative h-[calc(100vh-32px)]"
              ref={desktopRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Prevent any window creation
                (e.nativeEvent as unknown as { __handled: boolean }).__handled =
                  true;
                handleDesktopClick(e);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = desktopRef.current?.getBoundingClientRect();
                if (rect) {
                  // Calculate coordinates relative to desktop
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  console.log("Setting context menu at desktop coordinates:", {
                    x,
                    y,
                  });
                  setContextMenu({
                    show: true,
                    x,
                    y,
                    type: "desktop",
                  });
                }
              }}
              onDragOver={handleDesktopDragOver}
              onDrop={handleDesktopDrop}
            >
              {/* CSS for desktop icons */}
              <style jsx>{desktopIconStyles}</style>

              {/* Render desktop icons */}
              {Object.entries(desktopIcons)
                .filter(([, icon]) => !icon.parentFolderId)
                .map(([id, icon]) => (
                  <div
                    key={id}
                    data-icon-id={id}
                    className={`absolute w-[90px] flex flex-col items-center justify-start ${
                      selectedDesktopIcons.includes(id)
                        ? "bg-[#000080] text-white"
                        : "text-white"
                    }`}
                    style={{
                      left: `${icon.x}px`,
                      top: `${icon.y}px`,
                      cursor: "pointer",
                      padding: "2px",
                      height: "84px",
                    }}
                    onClick={(e) => handleDesktopIconClick(e, id)}
                    onDoubleClick={() => handleDesktopIconDoubleClick(id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = desktopRef.current?.getBoundingClientRect();
                      if (rect) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        setContextMenu({
                          show: true,
                          x,
                          y,
                          type: "desktop-icon",
                          itemId: id,
                        });
                        selectDesktopIcon(id);
                      }
                    }}
                    draggable
                    onDragStart={(e) => handleDesktopIconDragStart(e, id)}
                    onDragEnd={handleDesktopDragEnd}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-1 mx-auto">
                      {id === "myComputer" && (
                        <svg width="48" height="48" viewBox="0 0 24 24">
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
                      {icon.type === "text-file" && <TextFileIcon size="lg" />}
                      {icon.type === "folder" && (
                        <svg width="48" height="48" viewBox="0 0 24 24">
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
                      {icon.type === "paint-file" && (
                        <svg width="48" height="48" viewBox="0 0 24 24">
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
                          <rect
                            x="6"
                            y="18"
                            width="12"
                            height="2"
                            fill="#000"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Icon label */}
                    {editingIconId === id ? (
                      <input
                        type="text"
                        className="text-xs w-full px-1 py-[1px] text-center leading-tight bg-[#000080] text-white border border-dotted border-white focus:outline-none"
                        defaultValue={icon.label}
                        autoFocus
                        onKeyDown={(e) => handleIconNameEdit(e, id)}
                        onBlur={(e) => handleIconNameBlur(e, id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontFamily: "var(--win95-font)",
                          maxWidth: "68px",
                        }}
                      />
                    ) : (
                      <div
                        className={`text-xs w-full px-1 py-[1px] truncate text-center leading-tight ${
                          selectedDesktopIcons.includes(id)
                            ? "border border-dotted border-white"
                            : ""
                        }`}
                        style={{
                          textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                          fontFamily: "var(--win95-font)",
                          wordBreak: "break-word",
                          maxHeight: "28px",
                          overflow: "hidden",
                        }}
                        onDoubleClick={(e) => handleIconNameDoubleClick(e, id)}
                      >
                        {icon.label}
                      </div>
                    )}
                  </div>
                ))}

              {/* Windows */}
              {Object.entries(windows).map(([id, window]) => {
                return (
                  <DraggableWindow
                    key={id}
                    ref={(r) => registerWindowRef(id, r)}
                    title={window.title}
                    isActive={activeWindowId === id}
                    onFocus={() => handleWindowFocus(id)}
                    onClose={() => handleCloseWindow(id)}
                    className={cn(
                      `win95-window`,
                      window.type === "my-computer"
                        ? "win95-my-computer-window"
                        : ""
                    )}
                    initialPosition={window.position}
                    initialSize={window.size || { width: 440, height: 320 }}
                    resizable={true}
                    showFooter={window.type === "notepad"}
                    windowId={id}
                    data-window-id={id}
                  >
                    {getWindowContent(window.type, id, window.filename)}
                  </DraggableWindow>
                );
              })}
            </div>

            <Taskbar
              onStartClick={() => toggleTaskbar()}
              taskbarItems={
                <>
                  {/* Display task buttons for all windows */}
                  {Object.entries(windows).map(([id, window]) => (
                    <TaskbarItem
                      key={id}
                      active={activeWindowId === id}
                      onClick={() => handleWindowFocus(id)}
                    >
                      {window.title}
                    </TaskbarItem>
                  ))}
                </>
              }
            />

            {isTaskbarOpen && (
              <StartMenu
                ref={startMenuRef}
                isOpen={isTaskbarOpen}
                onClose={() => setTaskbarOpen(false)}
                items={[
                  {
                    icon: <ProgramsIcon />,
                    label: "Programs",
                    submenu: [
                      {
                        icon: <NotepadIcon />,
                        label: "Notepad",
                        onClick: () => {
                          createWindow("notepad", "Notepad");
                          setTaskbarOpen(false);
                        },
                      },
                      {
                        icon: <CalculatorIcon />,
                        label: "Calculator",
                        onClick: () => {
                          createWindow("calculator", "Calculator");
                          setTaskbarOpen(false);
                        },
                      },
                      {
                        icon: <PaintIcon />,
                        label: "Paint",
                        onClick: () => {
                          createWindow("paint", "Paint");
                          setTaskbarOpen(false);
                        },
                      },
                      {
                        icon: <ExplorerIcon />,
                        label: "Windows Explorer",
                        onClick: () => {
                          createWindow("explorer", "Windows Explorer");
                          setTaskbarOpen(false);
                        },
                      },
                      {
                        icon: <MsDosIcon />,
                        label: "MS-DOS Prompt",
                        onClick: () => {
                          createWindow("default", "MS-DOS Prompt");
                          setTaskbarOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    icon: <DocumentsIcon />,
                    label: "Documents",
                    submenu: [
                      {
                        label: "My Documents",
                        onClick: () => {
                          createWindow("filemanager", "My Documents");
                          setTaskbarOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    icon: <SettingsIcon />,
                    label: "Settings",
                    submenu: [
                      {
                        icon: <ControlPanelIcon />,
                        label: "Control Panel",
                        onClick: () => {
                          createWindow("default", "Control Panel");
                          setTaskbarOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    icon: <FindIcon />,
                    label: "Find",
                    submenu: [
                      {
                        label: "Files or Folders",
                        onClick: () => {
                          createWindow("default", "Find: Files or Folders");
                          setTaskbarOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    icon: <HelpIcon />,
                    label: "Help",
                    onClick: () => {
                      createWindow("default", "Help");
                      setTaskbarOpen(false);
                    },
                  },
                  {
                    icon: <RunIcon />,
                    label: "Run...",
                    onClick: () => {
                      createWindow("default", "Run");
                      setTaskbarOpen(false);
                    },
                  },
                  {
                    divider: true,
                    label: "", // Adding empty label to satisfy type
                  },
                  {
                    icon: <ComputerIcon />,
                    label: "My Computer",
                    onClick: () => {
                      setTaskbarOpen(false);

                      // Check if a My Computer window already exists
                      const myComputerWindow = Object.entries(windows).find(
                        ([, win]) => win.type === "my-computer"
                      );

                      if (myComputerWindow) {
                        // If it exists, just bring it to focus
                        handleWindowFocus(myComputerWindow[0]);
                      } else {
                        // Otherwise create a new one with consistent ID
                        const windowId = "my-computer-main";
                        addWindow({
                          id: windowId,
                          type: "my-computer",
                          position: { x: 80, y: 50 },
                          size: { width: 440, height: 320 },
                          title: "My Computer",
                          minimized: false,
                          maximized: false,
                          component: "my-computer",
                        });
                        handleWindowFocus(windowId);
                        // Ensure visibility flag is set
                        useWin95Store.setState({ isMyComputerVisible: true });
                      }
                    },
                  },
                  {
                    divider: true,
                    label: "", // Adding empty label to satisfy type
                  },
                  {
                    icon: <ShutdownIcon />,
                    label: "Shut Down...",
                    onClick: () => {
                      createWindow("default", "Shut Down Windows");
                      setTaskbarOpen(false);
                    },
                  },
                ]}
              />
            )}

            {/* Context Menu */}
            <Win95ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              itemId={contextMenu.itemId}
              show={contextMenu.show}
              onClose={() => {
                console.log("Context menu closing from onClose prop");
                setContextMenu({
                  show: false,
                  x: contextMenu.x,
                  y: contextMenu.y,
                  type: "desktop",
                });
              }}
              onStartMenuAction={(action, itemId) => {
                console.log("🎯 Action called:", action);
                handleStartMenuAction(action, itemId);
              }}
            />
          </div>
        </Wallpaper>
      )}
    </div>
  );
}

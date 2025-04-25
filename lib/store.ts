import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Define window types
export type WindowType =
  | "default"
  | "notepad"
  | "calculator"
  | "explorer"
  | "paint"
  | "filemanager"
  | "text-file"
  | "my-computer"
  | "minesweeper";

// Window state interface
export interface WindowState {
  id: string;
  type: WindowType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title: string | React.ReactNode;
  zIndex: number;
  filename?: string;
  content?:
    | {
        message: string;
        buttons: Array<{
          label: string;
          onClick: () => void;
        }>;
      }
    | string;
  isMaximized: boolean;
  preMaximizeState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  folderId?: string;
  minimized: boolean;
  maximized: boolean;
  component: string;
}

// Desktop icon interface
export interface DesktopIcon {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  parentFolderId?: string;
  contents?: string[];
  content?: string; // For storing paint file data
}

// Context menu type
export type ContextMenuType = "desktop" | "desktop-icon" | "start-menu";

// Context menu state interface
export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  itemId?: string;
}

// SLICES
// ------

interface WindowsSlice {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  nextZIndex: number;
  isMyComputerVisible: boolean;

  // Actions
  addWindow: (window: Omit<WindowState, "zIndex">) => void;
  updateWindowPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  updateWindowSize: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  updateWindowTitle: (id: string, title: string) => void;
  setActiveWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  toggleMyComputer: () => void;
  updateWindowMaximizedState: (
    id: string,
    isMaximized: boolean,
    preMaximizeState?: {
      position: { x: number; y: number };
      size: { width: number; height: number };
    }
  ) => void;
}

interface DesktopSlice {
  desktopIcons: Record<string, DesktopIcon>;
  selectedDesktopIcons: string[];
  folderContents: Record<string, string[]>;
  editingIconId: string | null;

  // Actions
  addDesktopIcon: (icon: DesktopIcon) => void;
  updateDesktopIconPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  selectDesktopIcon: (id: string, isMultiSelect?: boolean) => void;
  clearDesktopSelection: () => void;
  setEditingIconId: (id: string | null) => void;
  renameDesktopIcon: (id: string, newLabel: string) => void;

  // Folder actions
  addItemToFolder: (folderId: string, itemId: string) => void;
  removeItemFromFolder: (folderId: string, itemId: string) => void;
  moveItemToFolder: (
    itemId: string,
    targetFolderId: string | undefined
  ) => void;
  getFolderContents: (folderId: string) => DesktopIcon[];
}

interface UISlice {
  isTaskbarOpen: boolean;
  contextMenu: ContextMenuState;
  currentTime: string;
  lastRightClickCoords: { x: number; y: number };

  // Actions
  setTaskbarOpen: (isOpen: boolean) => void;
  toggleTaskbar: () => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setCurrentTime: (time: string) => void;
}

interface ClipboardSlice {
  clipboard: {
    type: "copy" | "cut" | null;
    items: string[];
  };

  // Actions
  setClipboard: (type: "copy" | "cut" | null, items: string[]) => void;
  pasteItems: (targetFolderId?: string) => void;
  copyItem: (itemId: string, targetFolderId?: string, newName?: string) => void;
}

// COMBINED STATE
// -------------

export interface Win95State
  extends WindowsSlice,
    DesktopSlice,
    UISlice,
    ClipboardSlice {}

// Function to load saved data from localStorage
const loadSavedData = () => {
  if (typeof window === "undefined") return null;

  try {
    const savedDesktopIcons = localStorage.getItem("win95_desktop_icons");
    const savedFolderContents = localStorage.getItem("win95_folder_contents");

    return {
      desktopIcons: savedDesktopIcons ? JSON.parse(savedDesktopIcons) : null,
      folderContents: savedFolderContents
        ? JSON.parse(savedFolderContents)
        : null,
    };
  } catch (error) {
    console.error("Error loading saved data:", error);
    return null;
  }
};

const savedData = loadSavedData();

/**
 * Saves the desktop icons to localStorage
 */
const saveDesktopIcons = (icons: Record<string, DesktopIcon>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("win95_desktop_icons", JSON.stringify(icons));
  } catch (error) {
    console.error("Error saving desktop icons:", error);
  }
};

/**
 * Saves the folder contents to localStorage
 */
const saveFolderContents = (contents: Record<string, string[]>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("win95_folder_contents", JSON.stringify(contents));
  } catch (error) {
    console.error("Error saving folder contents:", error);
  }
};

// Create the store
export const useWin95Store = create<Win95State>()(
  persist(
    immer((set, get) => ({
      // WINDOWS SLICE
      // ------------
      windows: {},
      activeWindowId: null,
      nextZIndex: 1,
      isMyComputerVisible: false,

      addWindow: (window) =>
        set((state) => {
          const { nextZIndex } = state;
          state.windows[window.id] = {
            ...window,
            zIndex: nextZIndex,
            // Ensure these fields always have default values
            size: window.size || { width: 400, height: 300 },
            isMaximized: window.isMaximized || false,
          };
          state.activeWindowId = window.id;
          state.nextZIndex = nextZIndex + 1;
        }),

      updateWindowPosition: (id, position) =>
        set((state) => {
          if (state.windows[id]) {
            state.windows[id].position = position;
          }
        }),

      updateWindowSize: (id, size) =>
        set((state) => {
          if (state.windows[id]) {
            state.windows[id].size = size;
          }
        }),

      updateWindowTitle: (id, title) =>
        set((state) => {
          if (state.windows[id]) {
            state.windows[id].title = title;
          }
        }),

      setActiveWindow: (id) =>
        set((state) => {
          const { nextZIndex } = state;
          if (state.windows[id]) {
            state.activeWindowId = id;
            state.windows[id].zIndex = nextZIndex;
            state.nextZIndex = nextZIndex + 1;
          }
        }),

      closeWindow: (id) =>
        set((state) => {
          if (state.windows[id]) {
            delete state.windows[id];
            // Only reset activeWindowId if the closed window was active
            if (state.activeWindowId === id) {
              state.activeWindowId = null;
            }
          }
        }),

      toggleMyComputer: () =>
        set((state) => {
          state.isMyComputerVisible = !state.isMyComputerVisible;
        }),

      updateWindowMaximizedState: (id, isMaximized, preMaximizeState) =>
        set((state) => {
          if (state.windows[id]) {
            state.windows[id].isMaximized = isMaximized;
            state.windows[id].maximized = isMaximized;

            if (isMaximized && preMaximizeState) {
              state.windows[id].preMaximizeState = preMaximizeState;
            }
          }
        }),

      // DESKTOP SLICE
      // ------------
      desktopIcons: savedData?.desktopIcons || {
        myComputer: {
          id: "myComputer",
          x: 0,
          y: 0,
          label: "My Computer",
          type: "my-computer",
        },
      },
      selectedDesktopIcons: [],
      folderContents: savedData?.folderContents || {},
      editingIconId: null,

      addDesktopIcon: (icon) =>
        set((state) => {
          state.desktopIcons[icon.id] = icon;
          saveDesktopIcons(state.desktopIcons);
        }),

      updateDesktopIconPosition: (id, position) =>
        set((state) => {
          if (state.desktopIcons[id]) {
            state.desktopIcons[id].x = position.x;
            state.desktopIcons[id].y = position.y;
            saveDesktopIcons(state.desktopIcons);
          }
        }),

      selectDesktopIcon: (id, isMultiSelect = false) =>
        set((state) => {
          if (isMultiSelect) {
            if (state.selectedDesktopIcons.includes(id)) {
              state.selectedDesktopIcons = state.selectedDesktopIcons.filter(
                (i) => i !== id
              );
            } else {
              state.selectedDesktopIcons.push(id);
            }
          } else {
            state.selectedDesktopIcons = [id];
          }
        }),

      clearDesktopSelection: () =>
        set((state) => {
          state.selectedDesktopIcons = [];
        }),

      setEditingIconId: (id) =>
        set((state) => {
          state.editingIconId = id;
        }),

      renameDesktopIcon: (id, newLabel) =>
        set((state) => {
          if (state.desktopIcons[id]) {
            state.desktopIcons[id].label = newLabel;
            state.editingIconId = null;
            saveDesktopIcons(state.desktopIcons);
          }
        }),

      addItemToFolder: (folderId, itemId) =>
        set((state) => {
          if (!state.folderContents[folderId]) {
            state.folderContents[folderId] = [];
          }
          if (!state.folderContents[folderId].includes(itemId)) {
            state.folderContents[folderId].push(itemId);
            saveFolderContents(state.folderContents);
          }
        }),

      removeItemFromFolder: (folderId, itemId) =>
        set((state) => {
          if (state.folderContents[folderId]) {
            state.folderContents[folderId] = state.folderContents[
              folderId
            ].filter((id) => id !== itemId);
            saveFolderContents(state.folderContents);
          }
        }),

      moveItemToFolder: (itemId, targetFolderId) =>
        set((state) => {
          const item = state.desktopIcons[itemId];
          if (!item) return;

          // Handle removing from previous folder if needed
          if (
            item.parentFolderId &&
            item.parentFolderId in state.folderContents
          ) {
            state.folderContents[item.parentFolderId] = state.folderContents[
              item.parentFolderId
            ].filter((id) => id !== itemId);
          }

          // Update the item's parentFolderId
          state.desktopIcons[itemId].parentFolderId = targetFolderId;

          // Add to target folder if specified
          if (targetFolderId) {
            if (!state.folderContents[targetFolderId]) {
              state.folderContents[targetFolderId] = [];
            }
            if (!state.folderContents[targetFolderId].includes(itemId)) {
              state.folderContents[targetFolderId].push(itemId);
            }
          }

          // Save changes
          saveDesktopIcons(state.desktopIcons);
          saveFolderContents(state.folderContents);
        }),

      getFolderContents: (folderId) => {
        const state = get();
        return (state.folderContents[folderId] || [])
          .map((id) => state.desktopIcons[id])
          .filter(Boolean);
      },

      // UI SLICE
      // -------
      isTaskbarOpen: false,
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        type: "desktop",
      },
      currentTime: "",
      lastRightClickCoords: { x: 0, y: 0 },

      setTaskbarOpen: (isOpen) =>
        set((state) => {
          state.isTaskbarOpen = isOpen;
        }),

      toggleTaskbar: () =>
        set((state) => {
          state.isTaskbarOpen = !state.isTaskbarOpen;
        }),

      setContextMenu: (menu) =>
        set((state) => {
          if (menu) {
            state.contextMenu = menu;
            state.lastRightClickCoords = { x: menu.x, y: menu.y };
          } else {
            state.contextMenu.show = false;
          }
        }),

      setCurrentTime: (time) =>
        set((state) => {
          state.currentTime = time;
        }),

      // CLIPBOARD SLICE
      // -------------
      clipboard: {
        type: null,
        items: [],
      },

      setClipboard: (type, items) =>
        set((state) => {
          state.clipboard.type = type;
          state.clipboard.items = items;
        }),

      pasteItems: (targetFolderId) =>
        set((state) => {
          const { clipboard, desktopIcons } = state;
          if (!clipboard.items.length) return;

          clipboard.items.forEach((itemId) => {
            const item = desktopIcons[itemId];
            if (!item) return;

            if (clipboard.type === "cut") {
              // Move the item
              const sourceFolderId = item.parentFolderId;

              // Update parentFolderId
              state.desktopIcons[itemId].parentFolderId = targetFolderId;

              // Remove from source folder if needed
              if (sourceFolderId && state.folderContents[sourceFolderId]) {
                state.folderContents[sourceFolderId] = state.folderContents[
                  sourceFolderId
                ].filter((id) => id !== itemId);
              }

              // Add to target folder if needed
              if (targetFolderId) {
                if (!state.folderContents[targetFolderId]) {
                  state.folderContents[targetFolderId] = [];
                }
                if (!state.folderContents[targetFolderId].includes(itemId)) {
                  state.folderContents[targetFolderId].push(itemId);
                }
              }
            } else {
              // Copy the item
              const newId = `${item.type}-${Date.now()}`;
              state.desktopIcons[newId] = {
                ...item,
                id: newId,
                parentFolderId: targetFolderId,
              };

              // Add to target folder if needed
              if (targetFolderId) {
                if (!state.folderContents[targetFolderId]) {
                  state.folderContents[targetFolderId] = [];
                }
                state.folderContents[targetFolderId].push(newId);
              }
            }
          });

          // Clear clipboard if it was a cut operation
          if (clipboard.type === "cut") {
            state.clipboard.type = null;
            state.clipboard.items = [];
          }

          // Save changes
          saveDesktopIcons(state.desktopIcons);
          saveFolderContents(state.folderContents);
        }),

      copyItem: (itemId, targetFolderId, newName) =>
        set((state) => {
          const item = state.desktopIcons[itemId];
          if (!item) return;

          const newId = `${item.type}-${Date.now()}`;
          state.desktopIcons[newId] = {
            ...item,
            id: newId,
            label: newName || item.label,
            parentFolderId: targetFolderId,
          };

          // Add to target folder if needed
          if (targetFolderId) {
            if (!state.folderContents[targetFolderId]) {
              state.folderContents[targetFolderId] = [];
            }
            state.folderContents[targetFolderId].push(newId);
          }

          // Save changes
          saveDesktopIcons(state.desktopIcons);
          saveFolderContents(state.folderContents);
        }),
    })),
    {
      name: "win95-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        windows: Object.entries(state.windows).reduce(
          (acc, [id, win]) => ({
            ...acc,
            [id]: {
              id: win.id,
              type: win.type,
              position: win.position,
              size: win.size,
              title: win.title,
              isMaximized: win.isMaximized,
              maximized: win.maximized,
              minimized: win.minimized,
              folderId: win.folderId,
              component: win.component,
              filename: win.filename,
            },
          }),
          {}
        ),
        desktopIcons: state.desktopIcons,
        folderContents: state.folderContents,
        isMyComputerVisible: state.isMyComputerVisible,
      }),
    }
  )
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define window types
export type WindowType =
  | "default"
  | "notepad"
  | "calculator"
  | "explorer"
  | "paint"
  | "filemanager"
  | "text-file"
  | "my-computer";

// Window state interface
export interface WindowState {
  id: string;
  type: WindowType;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  title: string;
  isActive?: boolean;
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
  isMaximized?: boolean;
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
  onDoubleClick?: () => void;
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

// Store state interface
export interface Win95State {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  nextZIndex: number;
  desktopIcons: Record<string, DesktopIcon>;
  selectedDesktopIcons: string[];
  clipboard: {
    type: "copy" | "cut" | null;
    items: string[];
  };
  isMyComputerVisible: boolean;
  isTaskbarOpen: boolean;
  contextMenu: ContextMenuState;
  currentTime: string;
  folderContents: Record<string, string[]>;
  lastRightClickCoords: { x: number; y: number };
  editingIconId: string | null;

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
  setTaskbarOpen: (isOpen: boolean) => void;
  toggleTaskbar: () => void;
  addDesktopIcon: (icon: DesktopIcon) => void;
  updateDesktopIconPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  selectDesktopIcon: (id: string, isMultiSelect?: boolean) => void;
  clearDesktopSelection: () => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setCurrentTime: (time: string) => void;
  updateWindowMaximizedState: (
    id: string,
    isMaximized: boolean,
    preMaximizeState?: {
      position: { x: number; y: number };
      size: { width: number; height: number };
    }
  ) => void;
  addItemToFolder: (folderId: string, itemId: string) => void;
  removeItemFromFolder: (folderId: string, itemId: string) => void;
  moveItemToFolder: (
    itemId: string,
    targetFolderId: string | undefined
  ) => void;
  getFolderContents: (folderId: string) => DesktopIcon[];
  setClipboard: (type: "copy" | "cut" | null, items: string[]) => void;
  pasteItems: (targetFolderId?: string) => void;
  copyItem: (itemId: string, targetFolderId?: string, newName?: string) => void;
  setEditingIconId: (id: string | null) => void;
  renameDesktopIcon: (id: string, newLabel: string) => void;
}

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

// Create the store
export const useWin95Store = create<Win95State>()(
  persist(
    (set, get) => ({
      // Initial state
      windows: {},
      activeWindowId: null,
      nextZIndex: 1,
      desktopIcons: savedData?.desktopIcons || {
        myComputer: {
          id: "myComputer",
          x: 24,
          y: 24,
          label: "My Computer",
          type: "my-computer",
        },
      },
      selectedDesktopIcons: [],
      isMyComputerVisible: false,
      isTaskbarOpen: false,
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        type: "desktop",
      },
      folderContents: savedData?.folderContents || {},
      currentTime: "",
      clipboard: {
        type: null,
        items: [],
      },
      lastRightClickCoords: { x: 0, y: 0 },
      editingIconId: null,

      // Actions
      addWindow: (window) => {
        const { nextZIndex } = get();
        set((state) => ({
          windows: {
            ...state.windows,
            [window.id]: {
              ...window,
              zIndex: nextZIndex,
            },
          },
          activeWindowId: window.id,
          nextZIndex: nextZIndex + 1,
        }));
      },

      updateWindowPosition: (id, position) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              position,
            },
          },
        })),

      updateWindowSize: (id, size) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              size,
            },
          },
        })),

      updateWindowTitle: (id, title) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              title,
            },
          },
        })),

      setActiveWindow: (id) => {
        const { nextZIndex } = get();
        set((state) => ({
          activeWindowId: id,
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              zIndex: nextZIndex,
            },
          },
          nextZIndex: nextZIndex + 1,
        }));
      },

      closeWindow: (id) =>
        set((state) => {
          const newWindows = { ...state.windows };
          delete newWindows[id];
          return {
            windows: newWindows,
            activeWindowId: null,
          };
        }),

      toggleMyComputer: () =>
        set((state) => ({
          isMyComputerVisible: !state.isMyComputerVisible,
        })),

      setTaskbarOpen: (isOpen) => set({ isTaskbarOpen: isOpen }),

      toggleTaskbar: () =>
        set((state) => ({
          isTaskbarOpen: !state.isTaskbarOpen,
        })),

      addDesktopIcon: (icon) =>
        set((state) => ({
          desktopIcons: {
            ...state.desktopIcons,
            [icon.id]: icon,
          },
        })),

      updateDesktopIconPosition: (id, position) =>
        set((state) => ({
          desktopIcons: {
            ...state.desktopIcons,
            [id]: {
              ...state.desktopIcons[id],
              x: position.x,
              y: position.y,
            },
          },
        })),

      selectDesktopIcon: (id, isMultiSelect = false) =>
        set((state) => ({
          selectedDesktopIcons: isMultiSelect
            ? state.selectedDesktopIcons.includes(id)
              ? state.selectedDesktopIcons.filter((i) => i !== id)
              : [...state.selectedDesktopIcons, id]
            : [id],
        })),

      clearDesktopSelection: () => set({ selectedDesktopIcons: [] }),

      setContextMenu: (menu) =>
        set((state) => ({
          contextMenu: menu || {
            show: false,
            x: 0,
            y: 0,
            type: "desktop",
          },
          lastRightClickCoords: menu
            ? { x: menu.x, y: menu.y }
            : state.lastRightClickCoords,
        })),

      setCurrentTime: (time) => set({ currentTime: time }),

      updateWindowMaximizedState: (id, isMaximized, preMaximizeState) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              isMaximized,
              preMaximizeState: isMaximized
                ? preMaximizeState
                : state.windows[id].preMaximizeState,
            },
          },
        })),

      addItemToFolder: (folderId, itemId) =>
        set((state) => ({
          folderContents: {
            ...state.folderContents,
            [folderId]: [...(state.folderContents[folderId] || []), itemId],
          },
        })),

      removeItemFromFolder: (folderId, itemId) =>
        set((state) => ({
          folderContents: {
            ...state.folderContents,
            [folderId]: state.folderContents[folderId].filter(
              (id) => id !== itemId
            ),
          },
        })),

      moveItemToFolder: (itemId, targetFolderId) =>
        set((state) => {
          const item = state.desktopIcons[itemId];
          if (!item) return state;

          return {
            desktopIcons: {
              ...state.desktopIcons,
              [itemId]: {
                ...item,
                parentFolderId: targetFolderId,
              },
            },
          };
        }),

      getFolderContents: (folderId) => {
        const state = get();
        return (state.folderContents[folderId] || [])
          .map((id) => state.desktopIcons[id])
          .filter(Boolean);
      },

      setClipboard: (type, items) => set({ clipboard: { type, items } }),

      pasteItems: (targetFolderId) => {
        const state = get();
        if (!state.clipboard.items.length) return;

        state.clipboard.items.forEach((itemId) => {
          const item = state.desktopIcons[itemId];
          if (!item) return;

          if (state.clipboard.type === "cut") {
            state.moveItemToFolder(itemId, targetFolderId);
          } else {
            const newId = `${item.type}-${Date.now()}`;
            state.addDesktopIcon({
              ...item,
              id: newId,
              parentFolderId: targetFolderId,
            });
          }
        });

        if (state.clipboard.type === "cut") {
          set({ clipboard: { type: null, items: [] } });
        }
      },

      copyItem: (itemId, targetFolderId, newName) =>
        set((state) => {
          const item = state.desktopIcons[itemId];
          if (!item) return state;

          const newId = `${item.type}-${Date.now()}`;
          return {
            desktopIcons: {
              ...state.desktopIcons,
              [newId]: {
                ...item,
                id: newId,
                label: newName || item.label,
                parentFolderId: targetFolderId,
              },
            },
          };
        }),

      setEditingIconId: (id) => set({ editingIconId: id }),

      renameDesktopIcon: (id, newLabel) =>
        set((state) => {
          if (!state.desktopIcons[id]) return state;

          const updatedIcons = {
            ...state.desktopIcons,
            [id]: {
              ...state.desktopIcons[id],
              label: newLabel,
            },
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(
              "win95_desktop_icons",
              JSON.stringify(updatedIcons)
            );
          }

          return {
            desktopIcons: updatedIcons,
            editingIconId: null,
          };
        }),
    }),
    {
      name: "win95-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        windows: Object.fromEntries(
          Object.entries(state.windows).map(([id, window]) => [
            id,
            {
              id: window.id,
              type: window.type,
              position: window.position,
              size: window.size,
              title: window.title,
              isMaximized: window.isMaximized,
              preMaximizeState: window.preMaximizeState,
            },
          ])
        ),
        desktopIcons: state.desktopIcons,
        isMyComputerVisible: state.isMyComputerVisible,
      }),
    }
  )
);

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
  filename?: string; // For text files
  content?: string; // For text files
  isMaximized?: boolean; // Track if window is maximized
  preMaximizeState?: {
    // Store pre-maximize dimensions and position
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

// Desktop icon interface
export interface DesktopIcon {
  id: string;
  x: number;
  y: number;
  label: string;
  type?: string;
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
interface Win95State {
  // Window management
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  nextZIndex: number;

  // Desktop icons
  desktopIcons: Record<string, DesktopIcon>;
  selectedDesktopIcons: string[];

  // Main window visibility
  isMyComputerVisible: boolean;

  // Taskbar state
  isTaskbarOpen: boolean;

  // Context menu
  contextMenu: ContextMenuState;

  // Time state
  currentTime: string;

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

  // Desktop icon actions
  addDesktopIcon: (icon: DesktopIcon) => void;
  updateDesktopIconPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  selectDesktopIcon: (id: string, isMultiSelect?: boolean) => void;
  clearDesktopSelection: () => void;

  // Context menu actions
  setContextMenu: (menu: ContextMenuState | null) => void;

  // Time actions
  setCurrentTime: (time: string) => void;

  updateWindowMaximizedState: (
    id: string,
    isMaximized: boolean,
    preMaximizeState?: {
      position: { x: number; y: number };
      size: { width: number; height: number };
    }
  ) => void;
}

export const useWin95Store = create<Win95State>()(
  persist(
    (set, get) => ({
      // Initial state
      windows: {},
      activeWindowId: null,
      nextZIndex: 1,
      desktopIcons: {
        myComputer: {
          id: "myComputer",
          x: 24,
          y: 24,
          label: "My Computer",
          type: "my-computer",
        },
      },
      selectedDesktopIcons: [],
      isMyComputerVisible: true,
      isTaskbarOpen: false,
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        type: "desktop",
      },
      currentTime: "",

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

      updateWindowPosition: (id, position) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              position,
            },
          },
        }));
      },

      updateWindowSize: (id, size) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              size,
            },
          },
        }));
      },

      updateWindowTitle: (id, title) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [id]: {
              ...state.windows[id],
              title,
            },
          },
        }));
      },

      setActiveWindow: (id) => {
        const { nextZIndex } = get();
        const highZIndex = Math.max(1000, nextZIndex + 100); // Ensure active window has a much higher z-index

        set((state) => {
          // First check if the window still exists
          if (!state.windows[id]) {
            return state;
          }

          // Prepare updates for all windows to ensure correct z-ordering
          const updatedWindows = { ...state.windows };

          // Set the active window to have the highest z-index
          updatedWindows[id] = {
            ...updatedWindows[id],
            zIndex: highZIndex,
          };

          return {
            activeWindowId: id,
            windows: updatedWindows,
            nextZIndex: highZIndex + 1,
          };
        });
      },

      closeWindow: (id) => {
        set((state) => {
          const newWindows = { ...state.windows };
          delete newWindows[id];

          // Set active window to the one with highest z-index or null if no windows
          const windowIds = Object.keys(newWindows);
          const activeId =
            windowIds.length > 0
              ? windowIds.reduce((a, b) =>
                  newWindows[a].zIndex > newWindows[b].zIndex ? a : b
                )
              : null;

          return {
            windows: newWindows,
            activeWindowId: activeId,
          };
        });
      },

      // Toggle My Computer visibility
      toggleMyComputer: () => {
        console.log("toggleMyComputer called - toggling visibility");
        const { isMyComputerVisible, activeWindowId, windows, nextZIndex } =
          get();

        if (isMyComputerVisible) {
          // If closing My Computer, activate another window if My Computer was active
          if (activeWindowId === "main") {
            const windowIds = Object.keys(windows);
            const nextActiveId =
              windowIds.length > 0
                ? windowIds.reduce((a, b) =>
                    windows[a].zIndex > windows[b].zIndex ? a : b
                  )
                : null;

            set({ activeWindowId: nextActiveId });
          }
        } else {
          // When reopening, bring to front
          set({
            activeWindowId: "main",
            nextZIndex: nextZIndex + 1,
          });
        }

        set({ isMyComputerVisible: !isMyComputerVisible });
      },

      setTaskbarOpen: (isOpen) => set({ isTaskbarOpen: isOpen }),

      toggleTaskbar: () =>
        set((state) => ({
          isTaskbarOpen: !state.isTaskbarOpen,
        })),

      // Desktop icon actions
      addDesktopIcon: (icon) => {
        set((state) => ({
          desktopIcons: {
            ...state.desktopIcons,
            [icon.id]: icon,
          },
        }));
      },

      updateDesktopIconPosition: (id, position) => {
        set((state) => ({
          desktopIcons: {
            ...state.desktopIcons,
            [id]: {
              ...state.desktopIcons[id],
              x: position.x,
              y: position.y,
            },
          },
        }));
      },

      selectDesktopIcon: (id, isMultiSelect = false) => {
        set((state) => ({
          selectedDesktopIcons: isMultiSelect
            ? state.selectedDesktopIcons.includes(id)
              ? state.selectedDesktopIcons.filter((i) => i !== id)
              : [...state.selectedDesktopIcons, id]
            : [id],
        }));
      },

      clearDesktopSelection: () => {
        set({ selectedDesktopIcons: [] });
      },

      // Context menu actions
      setContextMenu: (menu) =>
        set(() => ({
          contextMenu: menu
            ? menu
            : {
                show: false,
                x: 0,
                y: 0,
                type: "desktop",
              },
        })),

      // Time actions
      setCurrentTime: (time) =>
        set(() => ({
          currentTime: time,
        })),

      updateWindowMaximizedState: (id, isMaximized, preMaximizeState) => {
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
        }));
      },
    }),
    {
      name: "win95-storage", // name of the item in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist the window positions and desktop icons
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

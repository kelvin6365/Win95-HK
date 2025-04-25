// Type for window data to be saved in localStorage
export interface SavedWindowState {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title: string | React.ReactNode;
  isMinimized?: boolean;
  currentFolderId?: string;
}

/**
 * Save current window state to localStorage
 */
export function saveWindowState(windows: SavedWindowState[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("win95_window_state", JSON.stringify(windows));
}

/**
 * Load saved window state from localStorage
 */
export function loadSavedWindowState(): SavedWindowState[] {
  if (typeof window === "undefined") return [];

  try {
    const savedState = localStorage.getItem("win95_window_state");
    if (!savedState) return [];

    const windows = JSON.parse(savedState) as SavedWindowState[];

    // Migrate old window states that don't have currentFolderId
    return windows.map((win) => ({
      ...win,
      currentFolderId: win.currentFolderId || undefined,
    }));
  } catch (error) {
    console.error("Error loading window state:", error);
    return [];
  }
}

/**
 * Clear saved window state
 */
export function clearSavedWindowState() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("win95_window_state");
  } catch (error) {
    console.error("Error clearing window state:", error);
  }
}

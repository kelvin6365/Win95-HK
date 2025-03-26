import { WindowState, WindowType } from "../store";

// Type for window data to be saved in localStorage
interface SavedWindowState {
  id?: string;
  type: WindowType;
  title: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  filename?: string;
  folderId?: string;
  wasActive?: boolean;
}

/**
 * Save current window state to localStorage
 */
export function saveWindowState(
  windows: Record<string, WindowState>,
  activeWindowId: string | null
) {
  if (typeof window === "undefined") return;

  try {
    // Convert windows to a simpler format for storage
    const windowsToSave = Object.entries(windows).map(([id, win]) => ({
      id,
      type: win.type,
      title: win.title,
      position: win.position,
      size: win.size,
      filename: win.filename,
      folderId: win.folderId,
      wasActive: id === activeWindowId,
    }));

    // Save to localStorage
    localStorage.setItem("win95_open_windows", JSON.stringify(windowsToSave));
  } catch (error) {
    console.error("Error saving window state:", error);
  }
}

/**
 * Load saved window state from localStorage
 */
export function loadSavedWindowState(): SavedWindowState[] {
  if (typeof window === "undefined") return [];

  try {
    const savedData = localStorage.getItem("win95_open_windows");
    if (!savedData) return [];

    return JSON.parse(savedData) as SavedWindowState[];
  } catch (error) {
    console.error("Error loading saved window state:", error);
    return [];
  }
}

/**
 * Clear saved window state
 */
export function clearSavedWindowState() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("win95_open_windows");
  } catch (error) {
    console.error("Error clearing window state:", error);
  }
}

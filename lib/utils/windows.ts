import { WindowState, WindowType } from "@/lib/store";

/**
 * Find a window by its type in the windows map
 * Returns the window ID and window state, or undefined if not found
 */
export function findWindowByType(
  windows: Record<string, WindowState>,
  type: WindowType
): [string, WindowState] | undefined {
  return Object.entries(windows).find(([_, window]) => window.type === type);
}

/**
 * Find a window by its ID in the windows map
 */
export function findWindowById(
  windows: Record<string, WindowState>,
  id: string
): WindowState | undefined {
  return windows[id];
}

/**
 * Generate a unique window ID for a given type
 */
export function generateWindowId(type: WindowType): string {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Get default position for a new window with optional offset
 */
export function getDefaultWindowPosition(offset: number = 0): {
  x: number;
  y: number;
} {
  return {
    x: 100 + offset * 20,
    y: 50 + offset * 20,
  };
}

/**
 * Get default size for a window based on its type
 */
export function getDefaultWindowSize(type: WindowType): {
  width: number;
  height: number;
} {
  switch (type) {
    case "notepad":
    case "text-file":
      return { width: 480, height: 360 };
    case "calculator":
      return { width: 260, height: 320 };
    case "explorer":
    case "my-computer":
      return { width: 440, height: 320 };
    case "paint":
      return { width: 600, height: 450 };
    case "filemanager":
      return { width: 520, height: 400 };
    default:
      return { width: 400, height: 300 };
  }
}

/**
 * Get default title for a window based on its type
 */
export function getDefaultWindowTitle(
  type: WindowType,
  filename?: string
): string {
  switch (type) {
    case "notepad":
      return filename ? `${filename} - Notepad` : "Untitled - Notepad";
    case "calculator":
      return "Calculator";
    case "explorer":
      return "Windows Explorer";
    case "my-computer":
      return "My Computer";
    case "paint":
      return "Untitled - Paint";
    case "filemanager":
      return "File Manager";
    case "text-file":
      return filename || "Untitled";
    case "default":
      return filename || "Window";
    default:
      return "Window";
  }
}

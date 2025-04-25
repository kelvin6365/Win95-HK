// Google Analytics utility for tracking user interactions
// This file provides functions to track events in GA4

// Add type declaration for window.gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: unknown;
      }
    ) => void;
  }
}

/**
 * Track a user event in Google Analytics
 * @param action - The user action/event name (e.g., 'game_start', 'difficulty_change')
 * @param category - The feature/category (e.g., 'minesweeper', 'calculator')
 * @param label - Optional label for additional context
 * @param value - Optional numeric value for the event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track a game event specifically
 * @param game - The game name (e.g., 'minesweeper', 'solitaire')
 * @param action - The game action (e.g., 'start', 'win', 'lose')
 * @param difficulty - Optional difficulty level
 * @param timeSpent - Optional time spent in seconds
 */
export const trackGameEvent = (
  game: string,
  action: "start" | "win" | "lose" | "restart" | "difficulty_change" | "exit",
  difficulty?: string,
  timeSpent?: number
) => {
  trackEvent(action, `game_${game}`, difficulty, timeSpent);
};

/**
 * Track UI interactions (clicks, opens, etc.)
 * @param component - The component name (e.g., 'menu', 'dialog', 'taskbar')
 * @param action - The action taken (e.g., 'click', 'open', 'close')
 * @param label - Optional identifier for the specific element
 */
export const trackUIInteraction = (
  component: string,
  action: "click" | "open" | "close" | "drag" | "resize",
  label?: string
) => {
  trackEvent(action, `ui_${component}`, label);
};

/**
 * Track errors that occur in the application
 * @param errorType - Type of error
 * @param message - Error message
 * @param source - Source of the error (component/file name)
 */
export const trackError = (
  errorType: string,
  message: string,
  source: string
) => {
  trackEvent("error", errorType, `${source}: ${message}`);
};

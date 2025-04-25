"use client";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { useWin95Store } from "@/lib/store";

// Add missing CSS
const WIN95_RESIZE_HANDLES = `
  .resize-handle {
    position: absolute;
    background-color: transparent;
  }
  .resize-handle-top {
    top: -3px;
    left: 0;
    right: 0;
    height: 6px;
    cursor: n-resize;
  }
  .resize-handle-right {
    top: 0;
    right: -3px;
    bottom: 0;
    width: 6px;
    cursor: e-resize;
  }
  .resize-handle-bottom {
    bottom: -3px;
    left: 0;
    right: 0;
    height: 6px;
    cursor: s-resize;
  }
  .resize-handle-left {
    top: 0;
    left: -3px;
    bottom: 0;
    width: 6px;
    cursor: w-resize;
  }
  .resize-handle-top-right {
    top: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: ne-resize;
  }
  .resize-handle-bottom-right {
    bottom: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
  }
  .resize-handle-bottom-left {
    bottom: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: sw-resize;
  }
  .resize-handle-top-left {
    top: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: nw-resize;
  }
`;

// Component that shows a draggable window
export interface DraggableWindowProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  isActive?: boolean;
  onFocus?: () => void;
  onClose?: () => void;
  resizable?: boolean;
  showMinimize?: boolean;
  showMaximize?: boolean;
  showFooter?: boolean;
  windowId: string;
}

export interface DraggableWindowRef {
  windowRef: React.RefObject<HTMLDivElement>;
  setPosition: (position: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setActive: (active: boolean) => void;
  bringToFront: () => void;
  maximize: () => void;
  restore: () => void;
}

export const DraggableWindow = forwardRef<
  DraggableWindowRef,
  DraggableWindowProps
>((props, ref) => {
  const {
    children,
    title = "Window",
    className,
    initialPosition = { x: 20, y: 20 },
    initialSize = { width: 400, height: 300 },
    isActive = false,
    onFocus,
    onClose,
    resizable = true,
    showMinimize = true,
    showMaximize = true,
    showFooter = false,
    windowId,
  } = props;

  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>(
    initialPosition
  );
  const [size, setSize] = useState<{ width: number; height: number }>(
    initialSize
  );
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>({
    position: initialPosition,
    size: initialSize,
  });
  const isFirstRender = useRef(true);

  // Get store methods with proper type safety
  const updateWindowPosition = useWin95Store(
    (state) => state.updateWindowPosition
  );
  const updateWindowSize = useWin95Store((state) => state.updateWindowSize);
  const updateWindowMaximizedState = useWin95Store(
    (state) => state.updateWindowMaximizedState
  );

  // When the component mounts, get the position and size from the store if available
  useEffect(() => {
    // Only sync from store on first render or when windowId changes
    if (isFirstRender.current) {
      const storedWindow = useWin95Store.getState().windows[windowId];

      if (storedWindow?.position) {
        setPosition(storedWindow.position);
      }

      if (storedWindow?.size) {
        setSize(storedWindow.size);
      }

      // Restore maximized state if it exists
      if (storedWindow?.isMaximized) {
        setIsMaximized(storedWindow.isMaximized);
      }

      // Restore pre-maximize state if it exists
      if (storedWindow?.preMaximizeState) {
        setPreMaximizeState(storedWindow.preMaximizeState);
      }

      isFirstRender.current = false;
    }
  }, [windowId]);

  // Inject resize handle CSS on mount
  useEffect(() => {
    const styleId = "win95-resize-handles";
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.innerHTML = WIN95_RESIZE_HANDLES;
      document.head.appendChild(styleElement);

      return () => {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, []);

  // Handle window resize stop - update size in store
  const handleResizeStop = (
    _e: MouseEvent | TouchEvent,
    _direction: string,
    ref: HTMLElement,
    _delta: { width: number; height: number },
    position: { x: number; y: number }
  ) => {
    const newSize = {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
    };
    setSize(newSize);
    updateWindowSize(windowId, newSize);
    setPosition(position);
    updateWindowPosition(windowId, position);
  };

  // Handle maximize/restore
  const maximize = () => {
    if (!isMaximized) {
      // Save current position and size for later restoration
      const newPreMaximizeState = {
        position: { ...position },
        size: { ...size },
      };
      setPreMaximizeState(newPreMaximizeState);

      // Store maximized state in the global store
      updateWindowMaximizedState(windowId, true, newPreMaximizeState);

      // Get the desktop workspace dimensions instead of immediate parent
      const desktopEl = document.querySelector(
        ".flex-1.relative.h-\\[calc\\(100vh-32px\\)\\]"
      );
      if (desktopEl) {
        const desktopRect = desktopEl.getBoundingClientRect();
        const newSize = {
          width: desktopRect.width,
          height: desktopRect.height - 5, // Slight adjustment to prevent overflow
        };
        const newPosition = { x: 0, y: 0 };

        // Update state and store
        setSize(newSize);
        setPosition(newPosition);
        updateWindowSize(windowId, newSize);
        updateWindowPosition(windowId, newPosition);
        setIsMaximized(true);
      } else {
        // Fallback if desktop element not found
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 40; // Account for taskbar
        const newSize = {
          width: viewportWidth,
          height: viewportHeight,
        };
        const newPosition = { x: 0, y: 0 };

        // Update state and store
        setSize(newSize);
        setPosition(newPosition);
        updateWindowSize(windowId, newSize);
        updateWindowPosition(windowId, newPosition);
        setIsMaximized(true);
      }
    } else {
      restore();
    }
  };

  // Restore window to pre-maximized state
  const restore = () => {
    if (isMaximized) {
      // Restore previous position and size
      setSize(preMaximizeState.size);
      setPosition(preMaximizeState.position);
      updateWindowSize(windowId, preMaximizeState.size);
      updateWindowPosition(windowId, preMaximizeState.position);
      setIsMaximized(false);

      // Update the global store
      updateWindowMaximizedState(windowId, false);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(
    ref,
    () => ({
      windowRef: windowRef as React.RefObject<HTMLDivElement>,
      setPosition: (pos: { x: number; y: number }) => {
        setPosition(pos);
        updateWindowPosition(windowId, pos);
      },
      setSize: (newSize: { width: number; height: number }) => {
        setSize(newSize);
        updateWindowSize(windowId, newSize);
      },
      setActive: () => {
        // This method is now unused but kept for API compatibility
      },
      bringToFront: () => {
        if (onFocus) onFocus();
      },
      maximize,
      restore,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onFocus,
      updateWindowPosition,
      updateWindowSize,
      windowId,
      isMaximized,
      preMaximizeState,
    ]
  );

  const zIndex = isActive ? 1000 : 5;

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(_e, d) => {
        const newPosition = { x: d.x, y: d.y };
        setPosition(newPosition);
        updateWindowPosition(windowId, newPosition);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        handleResizeStop(e, direction, ref, delta, position);
      }}
      disableDragging={!isActive || isMaximized}
      enableResizing={
        resizable && isActive && !isMaximized
          ? {
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }
          : false
      }
      dragHandleClassName="win95-titlebar"
      bounds="parent"
      minWidth={200}
      minHeight={150}
      cancel=".window-control-button"
      style={{
        position: "absolute",
        pointerEvents: "auto", // Make sure we can click this even if it's behind another window
        cursor: "default",
        zIndex,
      }}
    >
      <div
        ref={windowRef}
        className={cn(
          "flex flex-col border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] shadow-md",
          className
        )}
        style={{
          width: "100%",
          height: "100%",
        }}
        onClick={() => {
          // Always propagate click to focus the window
          if (onFocus) onFocus();
        }}
      >
        {/* Titlebar */}
        <div
          className={cn(
            "win95-titlebar flex items-center justify-between p-1 cursor-move select-none",
            isActive
              ? "bg-[var(--win95-titlebar)] text-[var(--win95-titlebar-fg)]"
              : "bg-[var(--win95-titlebar-inactive)] text-[var(--win95-titlebar-inactive-fg)]"
          )}
          onMouseDown={() => {
            // Always trigger focus when clicking on titlebar
            if (onFocus) {
              onFocus();
            }
          }}
          onDoubleClick={() => {
            if (showMaximize) {
              maximize();
            }
          }}
        >
          <div className="flex items-center">
            {/* Window icon will go here */}
            <span className="text-xs font-bold truncate max-w-[300px]">
              {title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {showMinimize && (
              <button
                className="window-control-button w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle minimize
                }}
              >
                <svg
                  width="8"
                  height="2"
                  viewBox="0 0 8 2"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="8" height="2" fill="black" />
                </svg>
              </button>
            )}
            {showMaximize && (
              <button
                className="window-control-button w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={(e) => {
                  e.stopPropagation();
                  maximize();
                }}
              >
                {isMaximized ? (
                  // Restore button icon
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0"
                      y="2"
                      width="6"
                      height="6"
                      stroke="black"
                      strokeWidth="1"
                      fill="none"
                    />
                    <rect
                      x="2"
                      y="0"
                      width="6"
                      height="6"
                      stroke="black"
                      strokeWidth="1"
                      fill="white"
                    />
                    <rect x="3" y="1" width="4" height="4" fill="white" />
                  </svg>
                ) : (
                  // Maximize button icon
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="8"
                      height="8"
                      stroke="black"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            )}
            <button
              className="window-control-button w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0L8 8M8 0L0 8" stroke="black" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Window content */}
        <div
          className="flex-1 overflow-hidden relative bg-white"
          onClick={() => {
            // Always propagate click to focus the window
            if (onFocus) onFocus();
          }}
        >
          {children || (
            <div className="p-4 flex items-center justify-center h-full w-full text-xs">
              <div className="flex flex-col items-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  className="mb-2"
                >
                  <rect
                    x="4"
                    y="4"
                    width="24"
                    height="24"
                    fill="#C3C7CB"
                    stroke="#000000"
                  />
                  <path
                    d="M10,16 L22,16 M16,10 L16,22"
                    stroke="#000000"
                    strokeWidth="2"
                  />
                </svg>
                <p>No content available</p>
              </div>
            </div>
          )}
        </div>

        {/* Status bar (optional) */}
        {showFooter && (
          <div className="border-t border-[var(--win95-border-dark)] p-1 text-xs flex items-center">
            <div>Ready</div>
          </div>
        )}
      </div>
    </Rnd>
  );
});

DraggableWindow.displayName = "DraggableWindow";

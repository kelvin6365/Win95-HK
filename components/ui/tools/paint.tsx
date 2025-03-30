import React, { useEffect, useRef, useState } from "react";
import "react-resizable/css/styles.css";
import { useWin95Store } from "@/lib/store";

interface PaintProps {
  windowId: string;
  resizable?: boolean;
  size?: { width: number; height: number };
  onResize?: (size: { width: number; height: number }) => void;
  filename?: string;
  iconId?: string;
}

// Define tool types
type ToolType = "brush" | "eraser";

// Define menu types
type MenuType = "file" | "edit" | "view" | "image" | "help";

export function Paint({
  windowId,
  resizable = false,
  size = { width: 500, height: 400 },
  onResize,
  filename,
  iconId,
}: PaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [lineWidth, setLineWidth] = useState(2);
  const canvasDataRef = useRef<ImageData | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("brush");
  const [canvasSize, setCanvasSize] = useState(size);
  const prevSizeRef = useRef(size);
  const [activeMenu, setActiveMenu] = useState<MenuType | null>(null);
  const [currentFilename, setCurrentFilename] = useState(filename || "");
  const addWindow = useWin95Store((state) => state.addWindow);
  const addDesktopIcon = useWin95Store((state) => state.addDesktopIcon);
  const desktopIcons = useWin95Store((state) => state.desktopIcons);
  const updateWindowTitle = useWin95Store((state) => state.updateWindowTitle);

  // Load saved image if filename is provided
  useEffect(() => {
    if (filename && canvasRef.current) {
      // Find the icon with the matching filename and ID
      const icon = iconId
        ? desktopIcons[iconId]
        : Object.values(desktopIcons).find(
            (icon) => icon.label === filename && icon.type === "paint-file"
          );

      if (icon && icon.content) {
        // Load the image data
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Set canvas size to match the container first
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
          }

          // Clear the canvas before drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the image at full size
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Save the initial state for undo/redo
          saveCanvasContent();

          // Update window title
          updateWindowTitle(windowId, `Paint - ${filename}`);
          setCurrentFilename(filename);
        };
        img.src = icon.content;
      }
    }
  }, [filename, iconId, desktopIcons, windowId, updateWindowTitle]);

  // Save functionality
  const handleSave = (saveAs: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to base64 data URL
    const imageData = canvas.toDataURL("image/png");

    // For existing files, if it's not Save As, just update the file directly
    if (currentFilename && !saveAs) {
      // Try to find the icon by ID first, then by name if no ID
      const existingIcon = iconId
        ? desktopIcons[iconId]
        : Object.values(desktopIcons).find(
            (icon) =>
              icon.label === currentFilename && icon.type === "paint-file"
          );

      if (existingIcon) {
        // Update existing icon's content directly
        const updatedIcon = {
          ...existingIcon,
          content: imageData,
        };
        addDesktopIcon(updatedIcon);

        // Update window title to reflect the current file
        updateWindowTitle(windowId, `Paint - ${currentFilename}`);
        return;
      }
    }

    // Only show Save As dialog for new files or when Save As is chosen
    if (saveAs || !currentFilename) {
      addWindow({
        id: `save-dialog-${windowId}`,
        type: "default",
        title: "Save As",
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        component: "save-dialog",
        content: {
          message: "Choose a location to save the file:",
          buttons: [
            {
              label: "Save",
              onClick: () => {
                // Generate a unique filename if needed
                let newFilename = saveAs
                  ? `Copy of ${currentFilename || "Untitled.png"}`
                  : "Untitled.png";
                let counter = 1;
                while (
                  Object.values(desktopIcons).some(
                    (icon) =>
                      icon.label === newFilename && icon.type === "paint-file"
                  )
                ) {
                  const baseName = newFilename
                    .replace(/\(\d+\)\.png$/, "")
                    .replace(".png", "");
                  newFilename = `${baseName}(${counter}).png`;
                  counter++;
                }

                // Create a new desktop icon for the saved image
                const iconId = `paint-${Date.now()}`;
                const newIcon = {
                  id: iconId,
                  x: 24 + (Object.keys(desktopIcons).length % 8) * 74,
                  y: 24 + Math.floor(Object.keys(desktopIcons).length / 8) * 74,
                  label: newFilename,
                  type: "paint-file",
                  content: imageData,
                };
                addDesktopIcon(newIcon);

                // Update current filename and window title
                setCurrentFilename(newFilename);
                updateWindowTitle(windowId, `Paint - ${newFilename}`);
              },
            },
            {
              label: "Cancel",
              onClick: () => {
                // Just close the dialog
              },
            },
          ],
        },
        isMaximized: false,
        minimized: false,
        maximized: false,
      });
    }
  };

  // Menu handling
  const handleMenuClick = (menu: MenuType) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "save":
        handleSave(false);
        break;
      case "save-as":
        handleSave(true);
        break;
      // Add more actions as needed
    }
    setActiveMenu(null);
  };

  // Handle window resize events
  useEffect(() => {
    // Only update if size actually changed
    if (
      prevSizeRef.current.width !== size.width ||
      prevSizeRef.current.height !== size.height
    ) {
      setCanvasSize(size);
      prevSizeRef.current = size;

      // Notify parent of resize if callback provided
      if (onResize) {
        onResize(size);
      }
    }
  }, [size, onResize]);

  // Save canvas content before any potential changes
  const saveCanvasContent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Only save if canvas has dimensions
      if (canvas.width > 0 && canvas.height > 0) {
        canvasDataRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    } catch (e) {
      console.log("Error saving canvas content", e);
    }
  };

  // Initialize canvas and handle resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    // Set canvas dimensions to match its display size
    const resizeCanvas = () => {
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();

      // Only proceed if container has dimensions
      if (rect.width <= 0 || rect.height <= 0) return;

      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const oldImageData = canvasDataRef.current;

      // Only resize if dimensions actually changed
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Save current state before resize
        if (oldWidth > 0 && oldHeight > 0 && !oldImageData) {
          saveCanvasContent();
        }

        // Update canvas dimensions
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Restore drawing if we have saved content
        const ctx = canvas.getContext("2d");
        if (ctx && canvasDataRef.current && oldWidth > 0 && oldHeight > 0) {
          try {
            ctx.putImageData(canvasDataRef.current, 0, 0);
          } catch (e) {
            console.log("Error restoring canvas data", e);
          }
        }

        // Always update drawing settings
        updateDrawingSettings();
      }
    };

    // Update drawing settings without clearing canvas
    const updateDrawingSettings = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = activeTool === "eraser" ? "white" : color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    // Initial setup
    canvas.setAttribute("data-window-id", windowId);

    // Initial setup - first save any existing content
    saveCanvasContent();

    // Then resize the canvas
    resizeCanvas();

    // Listen for window resize when not manually resizing
    const handleWindowResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [windowId, color, lineWidth, activeTool]);

  // Update drawing settings without clearing canvas when color/size/tool changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = activeTool === "eraser" ? "white" : color;
      ctx.lineWidth = lineWidth;
    }
  }, [color, lineWidth, activeTool]);

  // Handle drawing
  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    // Save canvas state after each stroke
    saveCanvasContent();
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
  };

  // Create color picker buttons
  const colorOptions = ["black", "white", "red", "blue", "green", "yellow"];
  const lineWidthOptions = [1, 2, 4, 6];

  // Win95 toolbar button style
  const toolbarButtonStyle = (isActive: boolean) =>
    `flex items-center justify-center w-8 h-8 border-2 ${
      isActive
        ? "border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-[var(--win95-button-highlight)]"
        : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
    }`;

  return (
    <div
      className="h-full flex flex-col"
      onClick={(e) => {
        // Make sure the window receives the click to bring it to front
        e.stopPropagation();
        // Close menu if clicking outside
        if (activeMenu) setActiveMenu(null);
      }}
    >
      {/* Menu bar */}
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-1 text-xs flex">
        <div
          className={`px-2 ${
            activeMenu === "file"
              ? "bg-[var(--win95-button-highlight)]"
              : "hover:bg-[var(--win95-button-highlight)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick("file");
          }}
        >
          File
          {activeMenu === "file" && (
            <div className="absolute mt-1 -ml-2 bg-[var(--win95-bg)] border-2 border-[var(--win95-border-dark)] shadow-md z-50">
              <div
                className="px-4 py-1 hover:bg-[var(--win95-button-highlight)] cursor-default"
                onClick={() => handleMenuAction("save")}
              >
                Save
              </div>
              <div
                className="px-4 py-1 hover:bg-[var(--win95-button-highlight)] cursor-default"
                onClick={() => handleMenuAction("save-as")}
              >
                Save As...
              </div>
              <div className="h-[1px] bg-[var(--win95-border-dark)] my-1" />
              <div className="px-4 py-1 hover:bg-[var(--win95-button-highlight)] cursor-default">
                Exit
              </div>
            </div>
          )}
        </div>
        <div
          className={`px-2 ${
            activeMenu === "edit"
              ? "bg-[var(--win95-button-highlight)]"
              : "hover:bg-[var(--win95-button-highlight)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick("edit");
          }}
        >
          Edit
        </div>
        <div
          className={`px-2 ${
            activeMenu === "view"
              ? "bg-[var(--win95-button-highlight)]"
              : "hover:bg-[var(--win95-button-highlight)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick("view");
          }}
        >
          View
        </div>
        <div
          className={`px-2 ${
            activeMenu === "image"
              ? "bg-[var(--win95-button-highlight)]"
              : "hover:bg-[var(--win95-button-highlight)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick("image");
          }}
        >
          Image
        </div>
        <div
          className={`px-2 ${
            activeMenu === "help"
              ? "bg-[var(--win95-button-highlight)]"
              : "hover:bg-[var(--win95-button-highlight)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick("help");
          }}
        >
          Help
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-2 flex items-center gap-3">
        {/* Tool selection */}
        <div className="flex gap-1 items-center">
          <button
            className={toolbarButtonStyle(activeTool === "brush")}
            onClick={() => setActiveTool("brush")}
            title="Brush"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 4C14.8 2.8 3.8 13.8 3 14.6C2.6 15 2 16 3 17C4 18 5 17.4 5.4 17C6.2 16.2 17.2 5.2 16 4Z"
                fill="#000000"
                stroke="#000000"
              />
              <rect x="3" y="15" width="3" height="2" fill="#000000" />
            </svg>
          </button>

          <button
            className={toolbarButtonStyle(activeTool === "eraser")}
            onClick={() => setActiveTool("eraser")}
            title="Eraser"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 6H15V14H5V6Z" fill="white" stroke="black" />
              <path d="M8 6V14" stroke="black" strokeWidth="1" />
              <path d="M11 6V14" stroke="black" strokeWidth="1" />
              <path d="M14 9H6" stroke="black" strokeWidth="1" />
              <path d="M14 11H6" stroke="black" strokeWidth="1" />
              <rect x="4" y="5" width="1" height="10" fill="black" />
              <rect x="15" y="5" width="1" height="10" fill="black" />
              <rect x="5" y="5" width="10" height="1" fill="black" />
              <rect x="5" y="14" width="10" height="1" fill="black" />
            </svg>
          </button>
        </div>

        <div className="h-6 border-l dark:border-[var(--win95-border-dark)] border-r border-[var(--win95-border-light)] mx-1"></div>

        <div className="flex gap-1">
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption}
              className={`w-8 h-8 border-2 ${
                color === colorOption && activeTool !== "eraser"
                  ? "border-black"
                  : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]"
              }`}
              style={{ backgroundColor: colorOption }}
              onClick={() => {
                setColor(colorOption);
                if (activeTool === "eraser") {
                  setActiveTool("brush");
                }
              }}
            ></button>
          ))}
        </div>

        <div className="h-6 border-l dark:border-[var(--win95-border-dark)] border-r border-[var(--win95-border-light)] mx-1"></div>

        <div className="flex gap-1 items-center">
          <span className="text-xs font-bold mr-1">Size:</span>
          {lineWidthOptions.map((width) => (
            <button
              key={width}
              className={toolbarButtonStyle(lineWidth === width)}
              onClick={() => {
                setLineWidth(width);
              }}
            >
              <div
                style={{
                  width: width * 2,
                  height: width * 2,
                  backgroundColor: activeTool === "eraser" ? "white" : "black",
                  borderRadius: "50%",
                  border: activeTool === "eraser" ? "1px solid black" : "none",
                }}
              ></div>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-white">
        <div
          ref={containerRef}
          className="w-full h-full bg-white relative overflow-hidden"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        >
          <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full ${
              activeTool === "eraser" ? "cursor-cell" : "cursor-crosshair"
            }`}
          ></canvas>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[var(--win95-bg)] border-t border-[var(--win95-border-dark)] p-1 text-xs flex justify-between">
        <span>
          {canvasRef.current
            ? `${canvasRef.current.width}x${canvasRef.current.height}px`
            : `${canvasSize.width}x${canvasSize.height}px`}
        </span>
        <span className="font-bold">
          {activeTool === "eraser" ? "Eraser" : `Brush: ${color}`}, {lineWidth}
          px
          {resizable && " (Resizable)"}
        </span>
      </div>
    </div>
  );
}

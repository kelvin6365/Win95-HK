import React, { useEffect, useRef, useState } from "react";
import "react-resizable/css/styles.css";

interface PaintProps {
  windowId: string;
  resizable?: boolean;
  size?: { width: number; height: number };
  onResize?: (size: { width: number; height: number }) => void;
}

// Define tool types
type ToolType = "brush" | "eraser";

export function Paint({
  windowId,
  resizable = false,
  size = { width: 500, height: 400 },
  onResize,
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
      }}
    >
      {/* Menu bar */}
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-1 text-xs flex">
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          File
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Edit
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          View
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Image
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
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

        <div className="h-6 border-l border-[var(--win95-border-dark)] border-r border-[var(--win95-border-light)] mx-1"></div>

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

        <div className="h-6 border-l border-[var(--win95-border-dark)] border-r border-[var(--win95-border-light)] mx-1"></div>

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

"use client";

import { useState, MouseEvent } from "react";

interface ExplorerProps {
  windowId: string;
  resizable?: boolean;
}

export function Explorer({ windowId, resizable = false }: ExplorerProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "large" | "small" | "list" | "details"
  >("large");

  // Function to completely stop events from propagating
  const preventEventBubbling = (e: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      // Add a flag to the event to mark it as handled
      // Using a type assertion with a more specific type to avoid 'any'
      (e.nativeEvent as unknown as { __handled: boolean }).__handled = true;
    }
  };

  // Mock data for drives
  const drives = [
    {
      id: "c",
      label: "C:",
      type: "hard-disk",
      freeSpace: "1.2 GB free of 2.1 GB",
    },
    { id: "a", label: "A:", type: "floppy", freeSpace: "1.44 MB" },
    { id: "d", label: "D:", type: "cd-rom", freeSpace: "650 MB" },
    {
      id: "network",
      label: "Network Neighborhood",
      type: "network",
      freeSpace: "",
    },
    { id: "printer", label: "Printers", type: "printer", freeSpace: "" },
    {
      id: "control",
      label: "Control Panel",
      type: "control-panel",
      freeSpace: "",
    },
  ];

  const handleItemClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedItem(id === selectedItem ? null : id);
  };

  const handleDoubleClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    console.log(`Opening ${id}...`);
    // Would open the appropriate drive/folder
  };

  // Additional handler specifically for the menu bar items
  const handleMenuItemClick = (e: React.MouseEvent, menuName: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Mark as fully handled to prevent any window creation
    (e.nativeEvent as unknown as { __handled: boolean }).__handled = true;
    console.log(`${menuName} menu clicked in ${windowId} window`);
  };

  const DriveIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "hard-disk":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="4"
              y="6"
              width="16"
              height="12"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <rect
              x="6"
              y="8"
              width="12"
              height="8"
              fill="#FFFFFF"
              stroke="#000000"
            />
            <rect x="7" y="17" width="10" height="1" fill="#808080" />
          </svg>
        );
      case "floppy":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="5"
              y="4"
              width="14"
              height="16"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <rect
              x="7"
              y="6"
              width="10"
              height="8"
              fill="#FFFFFF"
              stroke="#000000"
            />
            <rect
              x="15"
              y="6"
              width="2"
              height="2"
              fill="#C3C7CB"
              stroke="#000000"
            />
          </svg>
        );
      case "cd-rom":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="#C0C0C0" stroke="#000000" />
            <circle cx="12" cy="12" r="2" fill="#FFFFFF" stroke="#000000" />
            <circle
              cx="12"
              cy="12"
              r="5"
              fill="none"
              stroke="#808080"
              strokeDasharray="2,1"
            />
          </svg>
        );
      case "network":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="2"
              y="10"
              width="6"
              height="4"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <rect
              x="16"
              y="10"
              width="6"
              height="4"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <rect
              x="9"
              y="5"
              width="6"
              height="4"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <line x1="12" y1="9" x2="12" y2="12" stroke="#000000" />
            <line x1="5" y1="12" x2="12" y2="12" stroke="#000000" />
            <line x1="19" y1="12" x2="12" y2="12" stroke="#000000" />
          </svg>
        );
      case "printer":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="5"
              y="10"
              width="14"
              height="6"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <rect
              x="8"
              y="5"
              width="8"
              height="5"
              fill="#FFFFFF"
              stroke="#000000"
            />
            <rect
              x="8"
              y="16"
              width="8"
              height="4"
              fill="#FFFFFF"
              stroke="#000000"
            />
            <circle cx="17" cy="11" r="1" fill="#00FF00" />
          </svg>
        );
      case "control-panel":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              fill="#C3C7CB"
              stroke="#000000"
            />
            <circle cx="8" cy="8" r="2" fill="#FF0000" stroke="#000000" />
            <circle cx="16" cy="8" r="2" fill="#00FF00" stroke="#000000" />
            <circle cx="8" cy="16" r="2" fill="#0000FF" stroke="#000000" />
            <circle cx="16" cy="16" r="2" fill="#FFFF00" stroke="#000000" />
          </svg>
        );
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 24 24">
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              fill="#C3C7CB"
              stroke="#000000"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full bg-[var(--win95-bg)] text-black"
      onClick={preventEventBubbling}
      onMouseDown={preventEventBubbling}
      onMouseUp={preventEventBubbling}
      onDoubleClick={preventEventBubbling}
    >
      {/* Menu Bar */}
      <div
        className="flex border-b border-[var(--win95-border-darker)] bg-[var(--win95-bg)] text-xs"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Mark as handled
          (e.nativeEvent as unknown as { __handled: boolean }).__handled = true;
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div
          className="px-2 py-0.5 hover:bg-[var(--win95-button-highlight)] cursor-pointer"
          onClick={(e) => handleMenuItemClick(e, "File")}
        >
          File
        </div>
        <div
          className="px-2 py-0.5 hover:bg-[var(--win95-button-highlight)] cursor-pointer"
          onClick={(e) => handleMenuItemClick(e, "Edit")}
        >
          Edit
        </div>
        <div
          className="px-2 py-0.5 hover:bg-[var(--win95-button-highlight)] cursor-pointer"
          onClick={(e) => handleMenuItemClick(e, "View")}
        >
          View
        </div>
        <div
          className="px-2 py-0.5 hover:bg-[var(--win95-button-highlight)] cursor-pointer"
          onClick={(e) => handleMenuItemClick(e, "Help")}
        >
          Help
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center border-b border-[var(--win95-border-darker)] p-1 bg-[var(--win95-bg)]"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Mark as handled to prevent window creation
          (e.nativeEvent as unknown as { __handled: boolean }).__handled = true;
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Mark as handled
          (e.nativeEvent as unknown as { __handled: boolean }).__handled = true;
        }}
      >
        <button
          className="flex items-center justify-center border border-[var(--win95-border-light)] border-r-[var(--win95-border-darker)] border-b-[var(--win95-border-darker)] bg-[var(--win95-bg)] p-0.5 mx-0.5 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            (e.nativeEvent as unknown as { __handled: boolean }).__handled =
              true;
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="4,2 12,2 12,12 8,8 4,12" fill="black" />
          </svg>
        </button>
        <div className="border-r border-[var(--win95-border-darker)] h-6 mx-1"></div>
        <button
          className="flex items-center justify-center border border-[var(--win95-border-light)] border-r-[var(--win95-border-darker)] border-b-[var(--win95-border-darker)] bg-[var(--win95-bg)] p-0.5 mx-0.5 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            (e.nativeEvent as unknown as { __handled: boolean }).__handled =
              true;
            setViewMode("large");
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect
              x="3"
              y="3"
              width="4"
              height="4"
              fill={viewMode === "large" ? "black" : "#808080"}
            />
            <rect
              x="9"
              y="3"
              width="4"
              height="4"
              fill={viewMode === "large" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="9"
              width="4"
              height="4"
              fill={viewMode === "large" ? "black" : "#808080"}
            />
            <rect
              x="9"
              y="9"
              width="4"
              height="4"
              fill={viewMode === "large" ? "black" : "#808080"}
            />
          </svg>
        </button>
        <button
          className="flex items-center justify-center border border-[var(--win95-border-light)] border-r-[var(--win95-border-darker)] border-b-[var(--win95-border-darker)] bg-[var(--win95-bg)] p-0.5 mx-0.5 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setViewMode("list");
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect
              x="3"
              y="3"
              width="2"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
            <rect
              x="6"
              y="3"
              width="7"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="7"
              width="2"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
            <rect
              x="6"
              y="7"
              width="7"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="11"
              width="2"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
            <rect
              x="6"
              y="11"
              width="7"
              height="2"
              fill={viewMode === "list" ? "black" : "#808080"}
            />
          </svg>
        </button>
        <button
          className="flex items-center justify-center border border-[var(--win95-border-light)] border-r-[var(--win95-border-darker)] border-b-[var(--win95-border-darker)] bg-[var(--win95-bg)] p-0.5 mx-0.5 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setViewMode("details");
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect
              x="3"
              y="3"
              width="10"
              height="1"
              fill={viewMode === "details" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="5"
              width="10"
              height="1"
              fill={viewMode === "details" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="7"
              width="10"
              height="1"
              fill={viewMode === "details" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="9"
              width="10"
              height="1"
              fill={viewMode === "details" ? "black" : "#808080"}
            />
            <rect
              x="3"
              y="11"
              width="10"
              height="1"
              fill={viewMode === "details" ? "black" : "#808080"}
            />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div
        className="flex-1 p-2 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === "large" && (
          <div className="grid grid-cols-3 gap-4">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className={`flex flex-col items-center p-1 cursor-pointer ${
                  selectedItem === drive.id
                    ? "bg-[var(--win95-selection)] text-white"
                    : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(e, drive.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e, drive.id);
                }}
              >
                <DriveIcon type={drive.type} />
                <div className="text-center mt-1 text-xs w-full">
                  {drive.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "list" && (
          <div className="flex flex-col">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className={`flex items-center p-1 cursor-pointer ${
                  selectedItem === drive.id
                    ? "bg-[var(--win95-selection)] text-white"
                    : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(e, drive.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e, drive.id);
                }}
              >
                <div className="w-6 h-6 mr-1">
                  <DriveIcon type={drive.type} />
                </div>
                <div className="text-xs">{drive.label}</div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "details" && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--win95-bg)]">
                <th className="text-left p-1 border-b border-[var(--win95-border-darker)]">
                  Name
                </th>
                <th className="text-left p-1 border-b border-[var(--win95-border-darker)]">
                  Type
                </th>
                <th className="text-left p-1 border-b border-[var(--win95-border-darker)]">
                  Free Space
                </th>
              </tr>
            </thead>
            <tbody>
              {drives.map((drive) => (
                <tr
                  key={drive.id}
                  className={`cursor-pointer ${
                    selectedItem === drive.id
                      ? "bg-[var(--win95-selection)] text-white"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(e, drive.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleDoubleClick(e, drive.id);
                  }}
                >
                  <td className="p-1 flex items-center">
                    <div className="w-4 h-4 mr-1">
                      <DriveIcon type={drive.type} />
                    </div>
                    {drive.label}
                  </td>
                  <td className="p-1">
                    {drive.type === "hard-disk" && "Local Disk"}
                    {drive.type === "floppy" && "Floppy Disk"}
                    {drive.type === "cd-rom" && "CD-ROM Drive"}
                    {drive.type === "network" && "Network"}
                    {drive.type === "printer" && "Printers"}
                    {drive.type === "control-panel" && "Control Panel"}
                  </td>
                  <td className="p-1">{drive.freeSpace}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div
        className="border-t border-[var(--win95-border-lighter)] bg-[var(--win95-bg)] p-1 text-xs flex justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {selectedItem
            ? `${drives.find((d) => d.id === selectedItem)?.label} selected`
            : "6 object(s)"}
        </div>
        <div>Total Size: 2.1 GB</div>
      </div>
    </div>
  );
}

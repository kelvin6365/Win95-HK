"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWin95Store } from "@/lib/store";
import { TextFileIcon } from "../text-file-icon";

interface NotepadProps {
  windowId: string;
  initialContent?: string;
  filename?: string;
  onTitleChange?: (newTitle: string) => void;
}

export function Notepad({
  windowId,
  initialContent = "",
  filename = "Untitled",
  onTitleChange,
}: NotepadProps) {
  const [content, setContent] = useState(initialContent);
  const [initialLoadedContent, setInitialLoadedContent] =
    useState(initialContent);
  const [currentFilename, setCurrentFilename] = useState(filename);
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [saveFilename, setSaveFilename] = useState(currentFilename);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);
  const [selectedFileToOpen, setSelectedFileToOpen] = useState<string>("");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openDialogRef = useRef<HTMLDivElement>(null);
  const printDialogRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const { addDesktopIcon, closeWindow } = useWin95Store();

  // Load saved files list on component mount
  useEffect(() => {
    loadSavedFilesList();
  }, []);

  // Load the list of saved files from localStorage
  const loadSavedFilesList = () => {
    const savedFilesObj = JSON.parse(
      localStorage.getItem("win95_notepad_files") || "{}"
    );
    setSavedFiles(Object.keys(savedFilesObj));
  };

  // Check if there's saved content for this file
  useEffect(() => {
    if (filename !== "Untitled") {
      const savedFiles = JSON.parse(
        localStorage.getItem("win95_notepad_files") || "{}"
      );
      if (savedFiles[filename]) {
        const savedContent = savedFiles[filename];
        setContent(savedContent);
        setInitialLoadedContent(savedContent);
      }
    }
  }, [filename]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (currentFilename === "Untitled" && content !== "") {
      return true;
    }
    return content !== initialLoadedContent;
  };

  // Listen for clicks outside of menus to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(null);
      }

      if (
        isSaveDialogOpen &&
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsSaveDialogOpen(false);
      }

      if (
        isOpenDialogOpen &&
        openDialogRef.current &&
        !openDialogRef.current.contains(event.target as Node)
      ) {
        setIsOpenDialogOpen(false);
      }

      if (
        isPrintDialogOpen &&
        printDialogRef.current &&
        !printDialogRef.current.contains(event.target as Node)
      ) {
        setIsPrintDialogOpen(false);
      }

      if (
        isConfirmDialogOpen &&
        confirmDialogRef.current &&
        !confirmDialogRef.current.contains(event.target as Node)
      ) {
        setIsConfirmDialogOpen(false);
        setPendingAction(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isMenuOpen,
    isSaveDialogOpen,
    isOpenDialogOpen,
    isPrintDialogOpen,
    isConfirmDialogOpen,
  ]);

  // Open file function
  const openFile = () => {
    if (!selectedFileToOpen) {
      return;
    }

    // Check for unsaved changes before opening
    if (hasUnsavedChanges()) {
      setIsConfirmDialogOpen(true);
      setPendingAction("open");
      return;
    }

    completeOpenFile();
  };

  // Complete open file operation
  const completeOpenFile = () => {
    if (!selectedFileToOpen) return;

    // Load the selected file content from localStorage
    const savedFiles = JSON.parse(
      localStorage.getItem("win95_notepad_files") || "{}"
    );

    if (savedFiles[selectedFileToOpen]) {
      const fileContent = savedFiles[selectedFileToOpen];
      setContent(fileContent);
      setInitialLoadedContent(fileContent);
      setCurrentFilename(selectedFileToOpen);

      // Update window title
      if (onTitleChange) {
        onTitleChange(`${selectedFileToOpen} - Notepad`);
      }

      // Close the open dialog
      setIsOpenDialogOpen(false);
      setSelectedFileToOpen("");
      setPendingAction(null);
    }
  };

  // Print function
  const printFile = () => {
    // Set up print content in a hidden iframe
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const iframeDoc = iframe.contentDocument;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${currentFilename}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  white-space: pre-wrap;
                  margin: 1cm;
                }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `);
        iframeDoc.close();

        // Close the print dialog
        setIsPrintDialogOpen(false);

        // Give a moment for the iframe to render
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 100);
      }
    }
  };

  // Exit function
  const exitNotepad = () => {
    if (hasUnsavedChanges()) {
      // Ask user to save changes
      setIsConfirmDialogOpen(true);
      setPendingAction("exit");
    } else {
      // No unsaved changes, just close
      closeWindow(windowId);
    }
  };

  // Save file function
  const saveFile = () => {
    if (!saveFilename.trim()) {
      return;
    }

    const filename = saveFilename.endsWith(".txt")
      ? saveFilename
      : `${saveFilename}.txt`;

    // Save to localStorage
    const savedFiles = JSON.parse(
      localStorage.getItem("win95_notepad_files") || "{}"
    );
    savedFiles[filename] = content;
    localStorage.setItem("win95_notepad_files", JSON.stringify(savedFiles));

    // Update current filename
    setCurrentFilename(filename);
    setInitialLoadedContent(content);

    // Update window title in parent component
    if (onTitleChange) {
      onTitleChange(`${filename} - Notepad`);
    }

    // Update saved files list
    loadSavedFilesList();

    // Add icon to desktop if not already there
    const fileIconKey = `file-${filename}`;
    addDesktopIcon({
      id: fileIconKey,
      label: filename,
      x: 40 + ((Object.keys(savedFiles).length * 30) % 200),
      y: 80 + ((Object.keys(savedFiles).length * 40) % 300),
      type: "text-file",
    });

    // Show success message
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);

    // Close dialog
    setIsSaveDialogOpen(false);

    // If there was a pending action, complete it now
    if (pendingAction === "new") {
      completeNewFile();
    } else if (pendingAction === "exit") {
      // Close the notepad window after saving
      closeWindow(windowId);
    } else if (pendingAction === "open") {
      completeOpenFile();
    }
  };

  // New file function
  const newFile = () => {
    if (hasUnsavedChanges()) {
      // Ask user to save changes
      setIsConfirmDialogOpen(true);
      setPendingAction("new");
    } else {
      completeNewFile();
    }
  };

  // Complete new file operation
  const completeNewFile = () => {
    setContent("");
    setCurrentFilename("Untitled");
    setSaveFilename("Untitled");
    setInitialLoadedContent("");

    // Update window title for new file
    if (onTitleChange) {
      onTitleChange("Untitled - Notepad");
    }

    setPendingAction(null);
    setIsMenuOpen(null);
  };

  // Menu handling functions
  const handleMenuToggle = (menu: string) => {
    setIsMenuOpen(isMenuOpen === menu ? null : menu);
  };

  return (
    <div className="h-full flex flex-col p-0 relative">
      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        style={{ display: "none" }}
        title="Print Frame"
      />

      {/* Menu bar */}
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-1 text-xs flex">
        <div
          className={`px-2 py-0.5 ${
            isMenuOpen === "file"
              ? "bg-[var(--win95-titlebar)] text-white"
              : "hover:bg-[var(--win95-button-highlight)]"
          } cursor-pointer`}
          onClick={() => handleMenuToggle("file")}
        >
          File
        </div>
        <div
          className={`px-2 py-0.5 ${
            isMenuOpen === "edit"
              ? "bg-[var(--win95-titlebar)] text-white"
              : "hover:bg-[var(--win95-button-highlight)]"
          } cursor-pointer`}
          onClick={() => handleMenuToggle("edit")}
        >
          Edit
        </div>
        <div
          className={`px-2 py-0.5 ${
            isMenuOpen === "search"
              ? "bg-[var(--win95-titlebar)] text-white"
              : "hover:bg-[var(--win95-button-highlight)]"
          } cursor-pointer`}
          onClick={() => handleMenuToggle("search")}
        >
          Search
        </div>
        <div
          className={`px-2 py-0.5 ${
            isMenuOpen === "help"
              ? "bg-[var(--win95-titlebar)] text-white"
              : "hover:bg-[var(--win95-button-highlight)]"
          } cursor-pointer`}
          onClick={() => handleMenuToggle("help")}
        >
          Help
        </div>
      </div>

      {/* File menu dropdown */}
      {isMenuOpen === "file" && (
        <div
          ref={menuRef}
          className="absolute top-6 left-0 z-20 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md min-w-[180px]"
        >
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={newFile}
          >
            New
          </div>
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={() => {
              loadSavedFilesList();
              setIsOpenDialogOpen(true);
              setIsMenuOpen(null);
            }}
          >
            Open...
          </div>
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={() => {
              setIsSaveDialogOpen(true);
              setIsMenuOpen(null);
              setSaveFilename(currentFilename);
            }}
          >
            Save
          </div>
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={() => {
              setIsSaveDialogOpen(true);
              setIsMenuOpen(null);
              setSaveFilename("Untitled");
            }}
          >
            Save As...
          </div>
          <div className="h-[1px] bg-[var(--win95-border-dark)] my-1 mx-1">
            <div className="h-[1px] bg-[var(--win95-border-light)] translate-y-[1px]"></div>
          </div>
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={() => {
              setIsPrintDialogOpen(true);
              setIsMenuOpen(null);
            }}
          >
            Print
          </div>
          <div className="h-[1px] bg-[var(--win95-border-dark)] my-1 mx-1">
            <div className="h-[1px] bg-[var(--win95-border-light)] translate-y-[1px]"></div>
          </div>
          <div
            className="px-6 py-0.5 text-xs hover:bg-[var(--win95-titlebar)] hover:text-white cursor-pointer"
            onClick={exitNotepad}
          >
            Exit
          </div>
        </div>
      )}

      {/* Main editor */}
      <textarea
        className="flex-1 p-1 text-xs font-[var(--win95-font)] resize-none focus:outline-none"
        placeholder="Type your text here..."
        style={{ fontFamily: "var(--win95-font)" }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onClick={() => setIsMenuOpen(null)}
      />

      {/* Open dialog */}
      {isOpenDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            ref={openDialogRef}
            className="w-80 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md"
          >
            <div className="bg-[var(--win95-titlebar)] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
              <span>Open</span>
              <button
                className="w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={() => setIsOpenDialogOpen(false)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 0L8 8M8 0L0 8" stroke="black" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <div className="p-3 text-xs">
              <div className="mb-4">
                <label className="block mb-1">File name:</label>
                <select
                  value={selectedFileToOpen}
                  onChange={(e) => setSelectedFileToOpen(e.target.value)}
                  className="w-full border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs"
                >
                  <option value="">Select a file...</option>
                  {savedFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Files of type:</label>
                <select className="w-full border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs">
                  <option>Text Documents (*.txt)</option>
                  <option>All Files (*.*)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Look in:</label>
                <div className="w-full h-24 border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs overflow-y-auto">
                  <div className="flex items-center py-0.5">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <rect
                        x="1"
                        y="3"
                        width="14"
                        height="10"
                        fill="#F0F0F0"
                        stroke="#000000"
                      />
                      <rect
                        x="3"
                        y="5"
                        width="10"
                        height="6"
                        fill="#FFFFFF"
                        stroke="#000000"
                      />
                    </svg>
                    <span className="ml-1">Desktop</span>
                  </div>

                  {/* List of files that can be clicked */}
                  <div className="mt-2">
                    {savedFiles.map((file) => (
                      <div
                        key={file}
                        className={`flex items-center py-0.5 px-1 cursor-pointer ${
                          selectedFileToOpen === file
                            ? "bg-[var(--win95-titlebar)] text-white"
                            : "hover:bg-[var(--win95-button-highlight)]"
                        }`}
                        onClick={() => setSelectedFileToOpen(file)}
                        onDoubleClick={() => {
                          setSelectedFileToOpen(file);
                          openFile();
                        }}
                      >
                        <TextFileIcon size="sm" />
                        <span className="ml-1">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={openFile}
                  disabled={!selectedFileToOpen}
                >
                  Open
                </button>
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => setIsOpenDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save dialog */}
      {isSaveDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            ref={dialogRef}
            className="w-80 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md"
          >
            <div className="bg-[var(--win95-titlebar)] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
              <span>Save As</span>
              <button
                className="w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={() => setIsSaveDialogOpen(false)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 0L8 8M8 0L0 8" stroke="black" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <div className="p-3 text-xs">
              <div className="mb-4">
                <label className="block mb-1">File name:</label>
                <input
                  type="text"
                  className="w-full border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs"
                  value={saveFilename}
                  onChange={(e) => setSaveFilename(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1">Save as type:</label>
                <select className="w-full border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs">
                  <option>Text Documents (*.txt)</option>
                  <option>All Files (*.*)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Save in:</label>
                <div className="w-full h-24 border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1 py-0.5 text-xs overflow-y-auto">
                  <div className="flex items-center py-0.5">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <rect
                        x="1"
                        y="3"
                        width="14"
                        height="10"
                        fill="#F0F0F0"
                        stroke="#000000"
                      />
                      <rect
                        x="3"
                        y="5"
                        width="10"
                        height="6"
                        fill="#FFFFFF"
                        stroke="#000000"
                      />
                    </svg>
                    <span className="ml-1">Desktop</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={saveFile}
                >
                  Save
                </button>
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => setIsSaveDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print dialog */}
      {isPrintDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            ref={printDialogRef}
            className="w-80 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md"
          >
            <div className="bg-[var(--win95-titlebar)] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
              <span>Print</span>
              <button
                className="w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={() => setIsPrintDialogOpen(false)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 0L8 8M8 0L0 8" stroke="black" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <div className="p-3 text-xs">
              <div className="mb-4">
                <div className="flex items-center py-1">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <rect
                      x="4"
                      y="8"
                      width="24"
                      height="16"
                      fill="#C0C0C0"
                      stroke="#000000"
                    />
                    <rect
                      x="8"
                      y="4"
                      width="16"
                      height="4"
                      fill="#C0C0C0"
                      stroke="#000000"
                    />
                    <rect
                      x="8"
                      y="24"
                      width="16"
                      height="4"
                      fill="#C0C0C0"
                      stroke="#000000"
                    />
                    <circle cx="24" cy="12" r="2" fill="#00FF00" />
                  </svg>
                  <span className="ml-2 font-bold">
                    Printer: Default Printer
                  </span>
                </div>
                <div className="border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] p-2 mt-2">
                  <div className="mb-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>Ready</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>Generic / Text Only</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Where:</span>
                      <span>LPT1:</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comment:</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="mr-2">Print range:</span>
                  <input
                    type="radio"
                    name="print-range"
                    id="print-all"
                    checked
                    readOnly
                  />
                  <label htmlFor="print-all" className="ml-1">
                    All
                  </label>
                </div>
                <div>
                  <span className="mr-2">Copies:</span>
                  <input
                    type="number"
                    className="w-10 border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] px-1"
                    defaultValue="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={printFile}
                >
                  OK
                </button>
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => setIsPrintDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm save dialog */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            ref={confirmDialogRef}
            className="w-80 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md"
          >
            <div className="bg-[var(--win95-titlebar)] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
              <span>Notepad</span>
              <button
                className="w-[14px] h-[14px] flex items-center justify-center border border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
                onClick={() => {
                  setIsConfirmDialogOpen(false);
                  setPendingAction(null);
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 0L8 8M8 0L0 8" stroke="black" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <div className="p-4 text-xs">
              <div className="flex items-start mb-4">
                <div className="mr-3 mt-1">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="#0000AA" />
                    <text
                      x="16"
                      y="22"
                      textAnchor="middle"
                      fill="white"
                      fontSize="24"
                      fontWeight="bold"
                    >
                      ?
                    </text>
                  </svg>
                </div>
                <div>
                  <p>Do you want to save changes to {currentFilename}?</p>
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => {
                    setIsConfirmDialogOpen(false);
                    setIsSaveDialogOpen(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => {
                    setIsConfirmDialogOpen(false);

                    if (pendingAction === "new") {
                      completeNewFile();
                    } else if (pendingAction === "exit") {
                      closeWindow(windowId);
                    } else if (pendingAction === "open") {
                      completeOpenFile();
                    }
                  }}
                >
                  No
                </button>
                <button
                  className="px-4 py-1 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs"
                  onClick={() => {
                    setIsConfirmDialogOpen(false);
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save success notification */}
      {showSaveSuccess && (
        <div className="absolute bottom-4 right-4 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] shadow-md p-2 text-xs">
          File saved successfully!
        </div>
      )}

      {/* Status bar */}
      <div className="bg-[var(--win95-bg)] border-t border-[var(--win95-border-light)] p-1 text-xs flex justify-between">
        <div>{currentFilename}</div>
        <div>{content.length} characters</div>
      </div>
    </div>
  );
}

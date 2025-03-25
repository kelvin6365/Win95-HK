"use client";

import { useState } from "react";

interface DefaultWindowProps {
  windowId: string;
  title?: string;
}

export function DefaultWindow({}: DefaultWindowProps) {
  const [activeSection, setActiveSection] = useState("about");

  return (
    <div
      className="flex flex-col h-full w-full bg-[var(--win95-bg)] text-black overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar */}
      <div className="flex items-center border-b border-[var(--win95-border-darker)] p-1 bg-[var(--win95-bg)]">
        <button
          className={`px-3 py-0.5 text-xs border-2 mx-0.5 ${
            activeSection === "about"
              ? "border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-[var(--win95-button-pressed)]"
              : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveSection("about");
          }}
        >
          About
        </button>
        <button
          className={`px-3 py-0.5 text-xs border-2 mx-0.5 ${
            activeSection === "help"
              ? "border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-[var(--win95-button-pressed)]"
              : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveSection("help");
          }}
        >
          Help
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 p-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {activeSection === "about" && (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-16 h-16 mb-4">
              <WindowsLogo />
            </div>
            <h2 className="text-lg font-bold mb-2">Windows 95</h2>
            <p className="text-xs mb-4">
              Version 4.00.950
              <br />
              Copyright © 1981-1995 Mxxxxxxx Corp.
            </p>
            <div className="text-xs mb-4 text-center max-w-xs mx-auto">
              <p className="mb-2">This product is licensed to:</p>
              <p className="pl-4 mb-2">Windows 95 User</p>
              <p className="mb-2">
                Physical Memory Available to Windows: 16,384 KB
              </p>
            </div>
            <div className="mt-6">
              <button
                className="px-6 py-1 text-xs border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]"
                onClick={(e) => e.stopPropagation()}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {activeSection === "help" && (
          <div onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">Windows 95 Help</h2>
            <p className="text-xs mb-2">To get help with Windows 95:</p>
            <ul className="text-xs list-disc pl-6 mb-4">
              <li className="mb-1">
                Click the Start button, and then click Help
              </li>
              <li className="mb-1">
                Press F1 on your keyboard when using most Windows applications
              </li>
              <li className="mb-1">Look for items with question mark icons</li>
              <li className="mb-1">
                Use the Help Topics dialog to search for specific help
              </li>
            </ul>
            <div className="border border-[var(--win95-border-darker)] p-2 bg-[#ffffcc] text-xs mb-4">
              <p className="font-bold">Tip:</p>
              <p>
                You can also right-click on most items to get context-sensitive
                help.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="border-t border-[var(--win95-border-lighter)] bg-[var(--win95-bg)] p-1 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        Ready
      </div>
    </div>
  );
}

// Windows logo component
const WindowsLogo = () => (
  <svg width="64" height="64" viewBox="0 0 16 16">
    <rect x="1" y="1" width="6" height="6" fill="#FF0000" />
    <rect x="9" y="1" width="6" height="6" fill="#00FF00" />
    <rect x="1" y="9" width="6" height="6" fill="#0000FF" />
    <rect x="9" y="9" width="6" height="6" fill="#FFFF00" />
  </svg>
);

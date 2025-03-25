import React from "react";

interface FileManagerProps {
  windowId: string;
}

export function FileManager({}: FileManagerProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] p-1 text-xs flex">
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          File
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Disk
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Tree
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          View
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Options
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Window
        </div>
        <div className="px-2 hover:bg-[var(--win95-button-highlight)]">
          Help
        </div>
      </div>
      <div className="flex-1 flex text-xs">
        <div className="w-1/2 border-r border-[var(--win95-border-dark)] p-2">
          <div className="mb-1 font-bold">C:\</div>
          <div className="pl-2 cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            WINDOWS
          </div>
          <div className="pl-2 cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            PROGRAM FILES
          </div>
          <div className="pl-2 cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            DOCUMENTS
          </div>
          <div className="pl-2 cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            AUTOEXEC.BAT
          </div>
          <div className="pl-2 cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            CONFIG.SYS
          </div>
        </div>
        <div className="w-1/2 p-2">
          <div className="mb-1 font-bold">C:\WINDOWS</div>
          <div className="cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            SYSTEM
          </div>
          <div className="cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            SYSTEM32
          </div>
          <div className="cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            TEMP
          </div>
          <div className="cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            WIN.INI
          </div>
          <div className="cursor-pointer hover:bg-[var(--win95-button-highlight)]">
            SYSTEM.INI
          </div>
        </div>
      </div>
      <div className="bg-[var(--win95-bg)] border-t border-[var(--win95-border-dark)] p-1 text-xs">
        5 file(s) selected
      </div>
    </div>
  );
}

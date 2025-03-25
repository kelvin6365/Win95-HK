"use client";

import React from "react";
import { stopEvent } from "@/lib/utils/events";

type MenuItemProps = {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
};

type MenuBarProps = {
  items: MenuItemProps[];
};

/**
 * Standard Windows 95 style menu bar
 */
export function MenuBar({ items }: MenuBarProps) {
  return (
    <div
      className="flex border-b border-[var(--win95-border-darker)] bg-[var(--win95-bg)] text-xs"
      onClick={stopEvent}
      onMouseDown={stopEvent}
    >
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={`px-2 py-0.5 hover:bg-[var(--win95-button-highlight)] cursor-pointer ${
            item.active ? "bg-[var(--win95-button-highlight)]" : ""
          }`}
          onClick={(e) => {
            stopEvent(e);
            if (item.onClick) item.onClick(e);
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

type ToolbarButtonProps = {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  title?: string;
};

type ToolbarProps = {
  buttons: ToolbarButtonProps[];
  dividers?: number[]; // Indices where to add dividers
};

/**
 * Standard Windows 95 style toolbar
 */
export function Toolbar({ buttons, dividers = [] }: ToolbarProps) {
  return (
    <div
      className="flex items-center border-b border-[var(--win95-border-darker)] p-1 bg-[var(--win95-bg)]"
      onClick={stopEvent}
      onMouseDown={stopEvent}
    >
      {buttons.map((button, index) => (
        <React.Fragment key={index}>
          <button
            className={`flex items-center justify-center border border-[var(--win95-border-light)] border-r-[var(--win95-border-darker)] border-b-[var(--win95-border-darker)] bg-[var(--win95-bg)] p-0.5 mx-0.5 h-6 w-6 ${
              button.active ? "bg-[var(--win95-button-pressed)]" : ""
            }`}
            onClick={(e) => {
              stopEvent(e);
              if (button.onClick) button.onClick(e);
            }}
            title={button.title}
          >
            {button.icon}
          </button>
          {dividers.includes(index) && (
            <div className="border-r border-[var(--win95-border-darker)] h-6 mx-1"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

type StatusBarProps = {
  leftText?: string;
  rightText?: string;
};

/**
 * Standard Windows 95 style status bar
 */
export function StatusBar({ leftText, rightText }: StatusBarProps) {
  return (
    <div
      className="border-t border-[var(--win95-border-lighter)] bg-[var(--win95-bg)] p-1 text-xs flex justify-between"
      onClick={stopEvent}
    >
      <div>{leftText || ""}</div>
      {rightText && <div>{rightText}</div>}
    </div>
  );
}

type WindowContentProps = {
  children: React.ReactNode;
};

/**
 * Standard Windows 95 style window content area with proper event handling
 */
export function WindowContent({ children }: WindowContentProps) {
  return (
    <div
      className="flex-1 overflow-auto"
      onClick={stopEvent}
      onMouseDown={stopEvent}
    >
      {children}
    </div>
  );
}

import React from "react";

interface CalculatorProps {
  windowId: string;
  resizable?: boolean;
}

export function Calculator({ windowId }: CalculatorProps) {
  // Helper function to handle calculator equals operation
  const handleCalculatorEquals = (display: HTMLInputElement) => {
    try {
      display.value = eval(display.value).toString();
    } catch (error) {
      display.value = "Error";
      console.error("Calculator error:", error);
    }
  };

  return (
    <div className="h-full p-2 flex flex-col">
      <input
        type="text"
        className="mb-2 border border-[var(--win95-border-dark)] p-1 text-right text-sm"
        placeholder="0"
        readOnly
      />
      <div className="grid grid-cols-4 gap-1 flex-1">
        {["MC", "MR", "MS", "M+"].map((btn) => (
          <button
            key={btn}
            className="border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs active:border-inset"
            onClick={() => {
              const display = document.querySelector(
                `[data-window-id="${windowId}"] input`
              ) as HTMLInputElement;
              if (display) {
                display.placeholder = btn;
                setTimeout(() => {
                  display.placeholder = "0";
                }, 300);
              }
            }}
          >
            {btn}
          </button>
        ))}
        {["7", "8", "9", "/"].map((btn) => (
          <button
            key={btn}
            className="border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs active:border-inset"
            onClick={() => {
              const display = document.querySelector(
                `[data-window-id="${windowId}"] input`
              ) as HTMLInputElement;
              if (display) {
                if (display.value === "0") {
                  display.value = btn;
                } else {
                  display.value += btn;
                }
              }
            }}
          >
            {btn}
          </button>
        ))}
        {["4", "5", "6", "*"].map((btn) => (
          <button
            key={btn}
            className="border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs active:border-inset"
            onClick={() => {
              const display = document.querySelector(
                `[data-window-id="${windowId}"] input`
              ) as HTMLInputElement;
              if (display) {
                if (display.value === "0") {
                  display.value = btn;
                } else {
                  display.value += btn;
                }
              }
            }}
          >
            {btn}
          </button>
        ))}
        {["1", "2", "3", "-"].map((btn) => (
          <button
            key={btn}
            className="border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs active:border-inset"
            onClick={() => {
              const display = document.querySelector(
                `[data-window-id="${windowId}"] input`
              ) as HTMLInputElement;
              if (display) {
                if (display.value === "0") {
                  display.value = btn;
                } else {
                  display.value += btn;
                }
              }
            }}
          >
            {btn}
          </button>
        ))}
        {["0", ".", "=", "+"].map((btn) => (
          <button
            key={btn}
            className="border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs active:border-inset"
            onClick={() => {
              const display = document.querySelector(
                `[data-window-id="${windowId}"] input`
              ) as HTMLInputElement;
              if (display) {
                if (btn === "=") {
                  handleCalculatorEquals(display);
                } else {
                  if (display.value === "0" && btn !== ".") {
                    display.value = btn;
                  } else {
                    display.value += btn;
                  }
                }
              }
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

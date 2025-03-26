"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function Win95LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const loadingSteps = [
    "Starting Windows 95...",
    "Checking system configuration...",
    "Loading MS-DOS compatibility layer...",
    "Initializing device drivers...",
    "Starting Windows Explorer...",
    "Loading system services...",
    "Welcome to Windows 95",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        // Increment more towards the end to feel like the real Windows loading
        const increment =
          progress < 80 ? Math.random() * 10 + 5 : Math.random() * 3 + 1;

        const newProgress = Math.min(progress + increment, 100);
        setProgress(newProgress);

        // Update step based on progress
        const newStep = Math.min(
          Math.floor((newProgress / 100) * loadingSteps.length),
          loadingSteps.length - 1
        );
        setStep(newStep);
      } else {
        // Loading complete
        onComplete();
      }
    }, 400); // Update every 400ms for a realistic loading feel

    return () => clearTimeout(timer);
  }, [progress, loadingSteps.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#008080] flex flex-col items-center justify-center z-50 font-[var(--win95-font)]">
      <div className="max-w-md w-full p-4">
        {/* Windows 95 Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-64 h-64 bg-black flex items-center justify-center">
              <div className="grid grid-cols-2 gap-2">
                <div className="w-24 h-24 bg-[#FF0000]"></div>
                <div className="w-24 h-24 bg-[#00FF00]"></div>
                <div className="w-24 h-24 bg-[#0000FF]"></div>
                <div className="w-24 h-24 bg-[#FFFF00]"></div>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xl font-bold">
              Windows<span className="text-sm align-text-top">®</span> 95
            </div>
          </div>
        </div>

        {/* Loading message */}
        <div className="text-white text-center mb-4">{loadingSteps[step]}</div>

        {/* Progress bar */}
        <div className="border-2 border-[var(--win95-border-light)] bg-[var(--win95-bg)] h-6 w-full">
          <div
            className="h-full bg-[var(--win95-button-highlight)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Copyright */}
        <div className="text-white text-xs text-center mt-8">
          © 1995 Mxxxxxxx Corporation. All rights reserved.
        </div>

        {/* Made love by @kelvin6365 */}
        <div className="text-white text-xs text-center mt-8">
          Made love by{" "}
          <a href="https://github.com/kelvin6365" className="underline">
            kelvin6365
          </a>
        </div>
      </div>
    </div>
  );
}

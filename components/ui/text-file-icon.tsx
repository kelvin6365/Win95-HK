"use client";

import React from "react";

interface TextFileIconProps {
  size?: "sm" | "md" | "lg";
}

export function TextFileIcon({ size = "md" }: TextFileIconProps) {
  // Size values based on selection
  const sizeMap = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  };

  const { width, height } = sizeMap[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base document */}
      <path
        d="M4 2H15L20 7V22H4V2Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="1"
      />

      {/* Document corner fold */}
      <path d="M15 2V7H20" fill="none" stroke="#000000" strokeWidth="1" />

      {/* Text lines */}
      <line x1="7" y1="10" x2="17" y2="10" stroke="#000000" strokeWidth="1" />
      <line x1="7" y1="13" x2="17" y2="13" stroke="#000000" strokeWidth="1" />
      <line x1="7" y1="16" x2="17" y2="16" stroke="#000000" strokeWidth="1" />
      <line x1="7" y1="19" x2="13" y2="19" stroke="#000000" strokeWidth="1" />
    </svg>
  );
}

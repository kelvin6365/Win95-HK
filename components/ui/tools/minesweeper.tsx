"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useState } from "react";
import { useWin95Store } from "../../../lib/store";
import { trackGameEvent, trackUIInteraction } from "@/lib/analytics";

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isDetonated?: boolean; // For the clicked mine
  isWrongFlag?: boolean; // For incorrect flags shown at game over
  neighborMines: number;
}

interface MinesweeperProps {
  windowId: string;
}

type DifficultyLevel = "beginner" | "intermediate" | "expert" | "custom";

interface DifficultySettings {
  rows: number;
  cols: number;
  mines: number;
}

// Game difficulty settings based on the original Windows Minesweeper
const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySettings> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
  custom: { rows: 9, cols: 9, mines: 10 }, // Default custom settings
};

export function Minesweeper({ windowId }: MinesweeperProps) {
  const closeWindow = useWin95Store((state) => state.closeWindow);

  const windowRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.setAttribute("data-window-id", windowId);
    }
  }, [windowId]);

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [customSettings, setCustomSettings] = useState<DifficultySettings>({
    rows: 9,
    cols: 9,
    mines: 10,
  });
  const [currentSettings, setCurrentSettings] = useState<DifficultySettings>(
    DIFFICULTY_SETTINGS.beginner
  );
  const [minesCount, setMinesCount] = useState(10);
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [faceState, setFaceState] = useState<
    "smile" | "surprised" | "won" | "dead"
  >("smile");
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customRows, setCustomRows] = useState(customSettings.rows);
  const [customCols, setCustomCols] = useState(customSettings.cols);
  const [customMines, setCustomMines] = useState(customSettings.mines);
  const [mouseDown, setMouseDown] = useState(false);

  // Initialize the game
  const initializeGame = useCallback(() => {
    // Get current difficulty settings
    const settings =
      difficulty === "custom"
        ? customSettings
        : DIFFICULTY_SETTINGS[difficulty];
    setCurrentSettings(settings);
    setMinesCount(settings.mines);

    // Create empty grid
    const newGrid: Cell[][] = Array(settings.rows)
      .fill(null)
      .map(() =>
        Array(settings.cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < settings.mines) {
      const randomRow = Math.floor(Math.random() * settings.rows);
      const randomCol = Math.floor(Math.random() * settings.cols);

      if (!newGrid[randomRow][randomCol].isMine) {
        newGrid[randomRow][randomCol].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let r = 0; r < settings.rows; r++) {
      for (let c = 0; c < settings.cols; c++) {
        if (newGrid[r][c].isMine) continue;

        // Check all 8 neighbors
        let count = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newR = r + i;
            const newC = c + j;
            if (
              newR >= 0 &&
              newR < settings.rows &&
              newC >= 0 &&
              newC < settings.cols
            ) {
              if (newGrid[newR][newC].isMine) count++;
            }
          }
        }
        newGrid[r][c].neighborMines = count;
      }
    }

    setGrid(newGrid);
    setGameStatus("playing");
    setFlagsPlaced(0);
    setTime(0);
    setTimerActive(false);
    setFaceState("smile");

    // Track game start/restart
    trackGameEvent("minesweeper", "restart", difficulty);
  }, [difficulty, customSettings]);

  // Start timer when first cell is revealed
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && gameStatus === "playing") {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime < 999) {
            return prevTime + 1;
          }
          return prevTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameStatus]);

  // Initialize game on mount or when difficulty changes
  useEffect(() => {
    initializeGame();
    // Track initial game start only on mount
    if (difficulty === "beginner") {
      trackGameEvent("minesweeper", "start", difficulty);
    }
  }, [initializeGame, difficulty]);

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
    setDifficulty(newDifficulty);
    setShowDifficultyMenu(false);

    // Track difficulty change
    trackGameEvent("minesweeper", "difficulty_change", newDifficulty);

    // If custom was selected, show the custom dialog
    if (newDifficulty === "custom") {
      setShowCustomDialog(true);
      trackUIInteraction("minesweeper", "click", "custom_difficulty");
    }
  };

  // Handle custom settings submission
  const handleCustomSubmit = () => {
    // Validate custom settings
    const maxRows = 24;
    const maxCols = 30;

    // Apply constraints
    const validRows = Math.min(Math.max(customRows, 9), maxRows);
    const validCols = Math.min(Math.max(customCols, 9), maxCols);
    const totalCells = validRows * validCols;
    // Maximum mines is 1/3 of cells, minimum is 10
    const validMines = Math.min(
      Math.max(customMines, 10),
      Math.floor(totalCells / 3)
    );

    setCustomSettings({ rows: validRows, cols: validCols, mines: validMines });
    setShowCustomDialog(false);
    trackUIInteraction("minesweeper", "click", "custom_difficulty");
  };

  // Reveal cell function
  const revealCell = (r: number, c: number) => {
    if (
      gameStatus !== "playing" ||
      grid[r][c].isRevealed ||
      grid[r][c].isFlagged
    ) {
      return;
    }

    // Start timer on first click
    if (!timerActive) {
      setTimerActive(true);
    }

    const newGrid = [...grid.map((row) => [...row])]; // Deep copy

    // If clicked on mine, game over
    if (newGrid[r][c].isMine) {
      // Mark this mine as detonated (the red one)
      newGrid[r][c].isDetonated = true;

      // Reveal all mines and mark wrong flags
      for (let i = 0; i < currentSettings.rows; i++) {
        for (let j = 0; j < currentSettings.cols; j++) {
          // Show all mines that weren't flagged
          if (newGrid[i][j].isMine && !newGrid[i][j].isFlagged) {
            newGrid[i][j].isRevealed = true;
          }
          // Mark incorrectly flagged cells
          if (!newGrid[i][j].isMine && newGrid[i][j].isFlagged) {
            newGrid[i][j].isWrongFlag = true;
          }
        }
      }
      setGrid(newGrid);
      setGameStatus("lost");
      setFaceState("dead");
      setTimerActive(false);

      // Track game loss
      trackGameEvent("minesweeper", "lose", difficulty, time);

      return;
    }

    // Reveal clicked cell
    newGrid[r][c].isRevealed = true;

    // If cell has no neighboring mines, reveal adjacent cells (flood fill)
    if (newGrid[r][c].neighborMines === 0) {
      const floodFill = (row: number, col: number) => {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newR = row + i;
            const newC = col + j;
            if (
              newR >= 0 &&
              newR < currentSettings.rows &&
              newC >= 0 &&
              newC < currentSettings.cols &&
              !newGrid[newR][newC].isRevealed &&
              !newGrid[newR][newC].isFlagged
            ) {
              newGrid[newR][newC].isRevealed = true;
              if (newGrid[newR][newC].neighborMines === 0) {
                floodFill(newR, newC);
              }
            }
          }
        }
      };

      floodFill(r, c);
    }

    setGrid(newGrid);

    // Check if player has won
    checkWinCondition(newGrid);
  };

  // Flag cell function
  const flagCell = (r: number, c: number) => {
    if (gameStatus !== "playing" || grid[r][c].isRevealed) {
      return;
    }

    const newGrid = [...grid.map((row) => [...row])]; // Deep copy

    // If not flagged, flag it
    if (!newGrid[r][c].isFlagged && flagsPlaced < minesCount) {
      newGrid[r][c].isFlagged = true;
      setFlagsPlaced(flagsPlaced + 1);
    }
    // If already flagged, unflag it
    else if (newGrid[r][c].isFlagged) {
      newGrid[r][c].isFlagged = false;
      setFlagsPlaced(flagsPlaced - 1);
    }

    setGrid(newGrid);
  };

  // Check if player has won
  const checkWinCondition = (currentGrid: Cell[][]) => {
    let unrevealedNonMines = 0;

    for (let r = 0; r < currentSettings.rows; r++) {
      for (let c = 0; c < currentSettings.cols; c++) {
        if (!currentGrid[r][c].isRevealed && !currentGrid[r][c].isMine) {
          unrevealedNonMines++;
        }
      }
    }

    if (unrevealedNonMines === 0) {
      // All non-mine cells are revealed, player wins
      setGameStatus("won");
      setFaceState("won");
      setTimerActive(false);

      // Flag all remaining mines
      const winGrid = [...currentGrid.map((row) => [...row])]; // Deep copy
      for (let r = 0; r < currentSettings.rows; r++) {
        for (let c = 0; c < currentSettings.cols; c++) {
          if (winGrid[r][c].isMine && !winGrid[r][c].isFlagged) {
            winGrid[r][c].isFlagged = true;
          }
        }
      }
      setGrid(winGrid);
      setFlagsPlaced(minesCount);

      // Track game win
      trackGameEvent("minesweeper", "win", difficulty, time);
    }
  };

  // Handle cell left click
  const handleCellClick = (r: number, c: number) => {
    revealCell(r, c);
  };

  // Handle cell right click (flag)
  const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    flagCell(r, c);
  };

  // Handle face button click (restart game)
  const handleFaceClick = () => {
    initializeGame();
    trackUIInteraction("minesweeper", "click", "restart_face");
  };

  // Handle mouse down on cell
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click
      setMouseDown(true);
      if (gameStatus === "playing") {
        setFaceState("surprised");
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setMouseDown(false);
    if (gameStatus === "playing") {
      setFaceState("smile");
    }
  };

  // Helper function to get cell background color
  const getCellBackground = (cell: Cell) => {
    if (!cell.isRevealed) {
      return "bg-[#c0c0c0]"; // Win95 button color
    }
    if (cell.isMine && cell.isDetonated) {
      return "bg-red-600"; // Red background for clicked mine
    }
    return "bg-[#c0c0c0]"; // Win95 background
  };

  // Helper function to get cell content
  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="2" width="1" height="9" fill="black" />
              <rect x="4" y="10" width="5" height="2" fill="black" />
              <polygon points="7,2 7,7 11,4.5" fill="red" />
            </svg>
          </div>
        );
      }
      return null;
    }

    if (cell.isWrongFlag) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="6" y="2" width="1" height="9" fill="black" />
            <rect x="4" y="10" width="5" height="2" fill="black" />
            <polygon points="7,2 7,7 11,4.5" fill="red" />
            <line
              x1="3"
              y1="3"
              x2="11"
              y2="11"
              stroke="black"
              strokeWidth="1.5"
            />
            <line
              x1="3"
              y1="11"
              x2="11"
              y2="3"
              stroke="black"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      );
    }

    if (cell.isMine) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="7" cy="7" r="5" fill="black" />
            <rect x="6" y="2" width="1" height="10" fill="black" />
            <rect x="2" y="6" width="10" height="1" fill="black" />
            <line
              x1="3"
              y1="3"
              x2="11"
              y2="11"
              stroke="black"
              strokeWidth="1"
            />
            <line
              x1="3"
              y1="11"
              x2="11"
              y2="3"
              stroke="black"
              strokeWidth="1"
            />
            <circle cx="5" cy="5" r="1" fill="white" />
          </svg>
        </div>
      );
    }

    if (cell.neighborMines > 0) {
      const colors = [
        "", // 0 has no text
        "text-blue-700", // 1 - blue
        "text-green-700", // 2 - green
        "text-red-600", // 3 - red
        "text-indigo-800", // 4 - dark blue
        "text-red-800", // 5 - dark red
        "text-teal-600", // 6 - teal
        "text-black", // 7 - black
        "text-gray-600", // 8 - gray
      ];

      return (
        <span className={`font-bold ${colors[cell.neighborMines]}`}>
          {cell.neighborMines}
        </span>
      );
    }

    return null;
  };

  // Render mine counter (remaining mines)
  const renderMineCounter = () => {
    const remaining = minesCount - flagsPlaced;
    const displayNumber = remaining.toString().padStart(3, "0");

    return (
      <div className="bg-black text-red-600 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white font-[digital] font-bold text-2xl w-[54px] h-[32px] flex items-center justify-center leading-none">
        {displayNumber}
      </div>
    );
  };

  // Render timer
  const renderTimer = () => {
    const displayTime = time.toString().padStart(3, "0");

    return (
      <div className="bg-black text-red-600 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white font-[digital] font-bold text-2xl w-[54px] h-[32px] flex items-center justify-center leading-none">
        {displayTime}
      </div>
    );
  };

  // Render face button
  const renderFace = () => {
    const faceIcons = {
      smile: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="9" fill="#ffff00" stroke="#808080" />
          <circle cx="6" cy="7" r="1" fill="#000" />
          <circle cx="14" cy="7" r="1" fill="#000" />
          <path
            d="M5,12 Q10,16 15,12"
            stroke="#000"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
      surprised: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="9" fill="#ffff00" stroke="#808080" />
          <circle cx="6" cy="7" r="1" fill="#000" />
          <circle cx="14" cy="7" r="1" fill="#000" />
          <circle cx="10" cy="13" r="2" fill="#000" />
        </svg>
      ),
      won: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="9" fill="#ffff00" stroke="#808080" />
          <rect x="4" y="6" width="4" height="2" fill="#000" />
          <rect x="12" y="6" width="4" height="2" fill="#000" />
          <path
            d="M5,12 Q10,16 15,12"
            stroke="#000"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
      dead: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="9" fill="#ffff00" stroke="#808080" />
          <line x1="4" y1="4" x2="8" y2="8" stroke="#000" strokeWidth="1.5" />
          <line x1="8" y1="4" x2="4" y2="8" stroke="#000" strokeWidth="1.5" />
          <line x1="12" y1="4" x2="16" y2="8" stroke="#000" strokeWidth="1.5" />
          <line x1="16" y1="4" x2="12" y2="8" stroke="#000" strokeWidth="1.5" />
          <path
            d="M5,14 Q10,11 15,14"
            stroke="#000"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
    };

    return (
      <button
        className={cn(
          "w-[40px] h-[40px] flex items-center justify-center",
          "border-2 relative bg-[#c0c0c0]",
          mouseDown && gameStatus === "playing"
            ? "border-t-[#808080] border-l-[#808080] border-b-white border-r-white"
            : "border-t-white border-l-white border-b-[#808080] border-r-[#808080]"
        )}
        onClick={handleFaceClick}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
      >
        {faceIcons[faceState]}
      </button>
    );
  };

  // Render game menu
  const renderGameMenu = () => {
    if (!showDifficultyMenu) return null;

    return (
      <div className="absolute z-10 left-0 top-6 w-48 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md">
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => handleDifficultyChange("beginner")}
        >
          <span className={difficulty === "beginner" ? "font-bold" : ""}>
            {difficulty === "beginner" && "✓ "}Beginner
          </span>
        </button>
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => handleDifficultyChange("intermediate")}
        >
          <span className={difficulty === "intermediate" ? "font-bold" : ""}>
            {difficulty === "intermediate" && "✓ "}Intermediate
          </span>
        </button>
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => handleDifficultyChange("expert")}
        >
          <span className={difficulty === "expert" ? "font-bold" : ""}>
            {difficulty === "expert" && "✓ "}Expert
          </span>
        </button>
        <div className="h-[1px] bg-[#808080] my-1 mx-2"></div>
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => handleDifficultyChange("custom")}
        >
          <span className={difficulty === "custom" ? "font-bold" : ""}>
            {difficulty === "custom" && "✓ "}Custom...
          </span>
        </button>
        <div className="h-[1px] bg-[#808080] my-1 mx-2"></div>
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => {
            setShowDifficultyMenu(false);
            initializeGame();
          }}
        >
          New Game
        </button>
        <div className="h-[1px] bg-[#808080] my-1 mx-2"></div>
        <button
          className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white"
          onClick={() => {
            setShowDifficultyMenu(false);
            closeWindow(windowId);
            trackGameEvent("minesweeper", "exit", difficulty, time);
          }}
        >
          Exit
        </button>
      </div>
    );
  };

  // Render custom settings dialog
  const renderCustomDialog = () => {
    if (!showCustomDialog) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md p-4 w-64">
          <div className="bg-[#000080] text-white px-2 py-1 mb-4 flex items-center justify-between">
            <span>Custom Field</span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="mr-2">Height:</label>
              <input
                type="number"
                className="border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-2 py-1 w-16 text-right"
                value={customRows}
                onChange={(e) => setCustomRows(parseInt(e.target.value) || 9)}
                min={9}
                max={24}
              />
            </div>

            <div className="flex justify-between items-center mb-2">
              <label className="mr-2">Width:</label>
              <input
                type="number"
                className="border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-2 py-1 w-16 text-right"
                value={customCols}
                onChange={(e) => setCustomCols(parseInt(e.target.value) || 9)}
                min={9}
                max={30}
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="mr-2">Mines:</label>
              <input
                type="number"
                className="border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-2 py-1 w-16 text-right"
                value={customMines}
                onChange={(e) => setCustomMines(parseInt(e.target.value) || 10)}
                min={10}
                max={Math.floor((customRows * customCols) / 3)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] px-4 py-1 min-w-[70px] bg-[#c0c0c0]"
              onClick={handleCustomSubmit}
            >
              OK
            </button>
            <button
              className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] px-4 py-1 min-w-[70px] bg-[#c0c0c0]"
              onClick={() => setShowCustomDialog(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={windowRef}
      className="flex flex-col p-2 h-full bg-[#c0c0c0] select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMouseDown(false);
        if (gameStatus === "playing") setFaceState("smile");
      }}
    >
      {/* Menu bar with icon */}
      <div className="flex items-center mb-2">
        <div className="mr-2 relative">
          <button
            className={cn(
              "px-2 py-0.5 border-2 bg-[#c0c0c0]",
              showDifficultyMenu
                ? "border-t-[#808080] border-l-[#808080] border-b-white border-r-white"
                : "border-t-white border-l-white border-b-[#808080] border-r-[#808080]"
            )}
            onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
          >
            Game
          </button>
          {renderGameMenu()}
        </div>
        <div>
          <button className="px-2 py-0.5 border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0]">
            Help
          </button>
        </div>
      </div>

      {/* Game container */}
      <div className="border-4 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0] p-2">
        {/* Status bar with counters */}
        <div className="flex justify-between items-center mb-2">
          {renderMineCounter()}
          {renderFace()}
          {renderTimer()}
        </div>

        {/* Game grid - with scrollable container if large */}
        <div
          className="border-4 border-t-[#808080] border-l-[#808080] border-b-white border-r-white overflow-auto bg-[#c0c0c0]"
          style={{
            maxHeight: "calc(100vh - 180px)", // Limit height for large boards
            maxWidth: "calc(100vw - 80px)", // Limit width for large boards
          }}
        >
          <div>
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center text-sm",
                      getCellBackground(cell),
                      !cell.isRevealed
                        ? "border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]"
                        : "border border-[#808080]"
                    )}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) =>
                      handleCellRightClick(e, rowIndex, colIndex)
                    }
                    disabled={gameStatus !== "playing" || cell.isRevealed}
                  >
                    {getCellContent(cell)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom settings dialog */}
      {renderCustomDialog()}
    </div>
  );
}

import React, { useState } from "react";

interface CalculatorProps {
  windowId: string;
  resizable?: boolean;
}

export function Calculator({}: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);
  const [lastAnswer, setLastAnswer] = useState<number | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [firstOperand, setFirstOperand] = useState<number | null>(null);

  // Handle digit input
  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  // Handle decimal point
  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  // Handle operators
  const handleOperator = (operator: string) => {
    if (display.includes("Error")) {
      return;
    }

    const currentValue = parseFloat(display);

    if (firstOperand === null) {
      // First number in calculation
      setFirstOperand(currentValue);
    } else if (currentOperation) {
      // We have a pending operation, calculate it first
      const result = calculate(firstOperand, currentValue, currentOperation);
      setFirstOperand(result);
      setLastAnswer(result);
      setDisplay(String(result));
    }

    setCurrentOperation(operator);
    setWaitingForOperand(true);
  };

  // Calculate function
  const calculate = (
    first: number,
    second: number,
    operation: string
  ): number => {
    switch (operation) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        return second !== 0 ? first / second : NaN;
      default:
        return second;
    }
  };

  // Handle calculation
  const performCalculation = () => {
    if (
      display.includes("Error") ||
      currentOperation === null ||
      firstOperand === null
    ) {
      return;
    }

    const secondOperand = parseFloat(display);
    const result = calculate(firstOperand, secondOperand, currentOperation);

    if (Number.isFinite(result)) {
      setDisplay(String(result));
      setLastAnswer(result);
      // Reset for next calculation
      setFirstOperand(null);
      setCurrentOperation(null);
    } else {
      setDisplay("Error");
    }
    setWaitingForOperand(true);
  };

  // Toggle positive/negative
  const toggleSign = () => {
    try {
      const value = parseFloat(display);
      setDisplay(String(-value));
      setWaitingForOperand(true);
    } catch {
      setDisplay("Error");
    }
  };

  // Handle memory operations
  const handleMemory = (operation: string) => {
    const currentValue = parseFloat(display);

    switch (operation) {
      case "MC": // Memory Clear
        setMemory(null);
        break;
      case "MR": // Memory Recall
        if (memory !== null) {
          setDisplay(String(memory));
          setWaitingForOperand(true);
        }
        break;
      case "MS": // Memory Store
        if (!isNaN(currentValue)) {
          setMemory(currentValue);
          setWaitingForOperand(true);
        }
        break;
      case "M+": // Memory Add
        if (!isNaN(currentValue) && memory !== null) {
          setMemory(memory + currentValue);
          setWaitingForOperand(true);
        } else if (!isNaN(currentValue)) {
          setMemory(currentValue);
          setWaitingForOperand(true);
        }
        break;
      case "ANS": // Use last answer
        if (lastAnswer !== null) {
          setDisplay(String(lastAnswer));
          setWaitingForOperand(true);
        }
        break;
    }
  };

  // Handle square root
  const calculateSquareRoot = () => {
    try {
      const value = parseFloat(display);
      if (value >= 0) {
        const result = Math.sqrt(value);
        setDisplay(String(result));
        setLastAnswer(result);
        setWaitingForOperand(true);
      } else {
        setDisplay("Error");
      }
    } catch {
      setDisplay("Error");
    }
  };

  // Handle percentage
  const calculatePercentage = () => {
    try {
      const value = parseFloat(display);
      const result = value / 100;
      setDisplay(String(result));
      setLastAnswer(result);
      setWaitingForOperand(true);
    } catch {
      setDisplay("Error");
    }
  };

  // Handle reciprocal (1/x)
  const calculateReciprocal = () => {
    try {
      const value = parseFloat(display);
      if (value !== 0) {
        const result = 1 / value;
        setDisplay(String(result));
        setLastAnswer(result);
        setWaitingForOperand(true);
      } else {
        setDisplay("Error");
      }
    } catch {
      setDisplay("Error");
    }
  };

  // Clear display
  const clearDisplay = () => {
    setDisplay("0");
    setWaitingForOperand(true);
    setFirstOperand(null);
    setCurrentOperation(null);
  };

  // Win95-style button class
  const win95ButtonClass =
    "flex items-center justify-center border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] text-xs h-8 active:border-inset active:pt-[2px] active:pl-[2px]";

  return (
    <div className="h-full flex flex-col bg-[var(--win95-bg)]">
      {/* Menu Bar */}
      <div className="flex text-xs items-center bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)] px-1 py-0.5">
        <span className="mr-4 cursor-default">Edit</span>
        <span className="mr-4 cursor-default">View</span>
        <span className="cursor-default">Help</span>
      </div>

      <div className="flex-1 p-2 flex flex-col gap-1">
        {/* Calculator display with Win95 inset style */}
        <div className="mb-2 border border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-white p-1">
          <input
            type="text"
            className="w-full bg-white p-0 text-right text-sm font-mono leading-tight outline-none"
            value={display}
            readOnly
          />
        </div>

        {/* Calculator buttons arranged like Win95 calculator */}
        <div className="grid grid-cols-5 gap-1">
          {/* First row */}
          <button
            className={`${win95ButtonClass} text-blue-700`}
            onClick={() => handleMemory("ANS")}
          >
            Ans
          </button>
          <button
            className={`${win95ButtonClass} text-red-700 font-bold col-span-2`}
            onClick={() =>
              setDisplay(display.length > 1 ? display.slice(0, -1) : "0")
            }
          >
            Back
          </button>
          <button
            className={`${win95ButtonClass} text-red-700 font-bold`}
            onClick={clearDisplay}
          >
            CE
          </button>
          <button
            className={`${win95ButtonClass} text-red-700 font-bold`}
            onClick={clearDisplay}
          >
            C
          </button>

          {/* Second row */}
          <button
            className={win95ButtonClass}
            onClick={() => handleMemory("MC")}
          >
            MC
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("7")}>
            7
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("8")}>
            8
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("9")}>
            9
          </button>
          <button
            className={win95ButtonClass}
            onClick={() => handleOperator("/")}
          >
            /
          </button>

          {/* Third row */}
          <button
            className={win95ButtonClass}
            onClick={() => handleMemory("MR")}
          >
            MR
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("4")}>
            4
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("5")}>
            5
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("6")}>
            6
          </button>
          <button
            className={win95ButtonClass}
            onClick={() => handleOperator("*")}
          >
            *
          </button>

          {/* Fourth row */}
          <button
            className={win95ButtonClass}
            onClick={() => handleMemory("MS")}
          >
            MS
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("1")}>
            1
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("2")}>
            2
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("3")}>
            3
          </button>
          <button
            className={win95ButtonClass}
            onClick={() => handleOperator("-")}
          >
            -
          </button>

          {/* Fifth row */}
          <button
            className={win95ButtonClass}
            onClick={() => handleMemory("M+")}
          >
            M+
          </button>
          <button className={win95ButtonClass} onClick={() => inputDigit("0")}>
            0
          </button>
          <button className={win95ButtonClass} onClick={inputDecimal}>
            .
          </button>
          <button className={win95ButtonClass} onClick={toggleSign}>
            +/-
          </button>
          <button
            className={win95ButtonClass}
            onClick={() => handleOperator("+")}
          >
            +
          </button>

          {/* Sixth row - just sqrt, %, 1/x, = */}
          <button className={win95ButtonClass} onClick={calculateSquareRoot}>
            sqrt
          </button>
          <button className={win95ButtonClass} onClick={calculatePercentage}>
            %
          </button>
          <button className={win95ButtonClass} onClick={calculateReciprocal}>
            1/x
          </button>
          <button
            className={`${win95ButtonClass} col-span-2`}
            onClick={performCalculation}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}

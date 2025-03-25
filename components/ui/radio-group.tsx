import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(
      value || defaultValue
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setSelectedValue(newValue);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    const radioContextValue = React.useMemo(
      () => ({
        value: selectedValue,
        onValueChange: handleValueChange,
      }),
      [selectedValue, handleValueChange]
    );

    return (
      <RadioContext.Provider value={radioContextValue}>
        <div
          ref={ref}
          className={cn("flex flex-col gap-2", className)}
          {...props}
        />
      </RadioContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
  extends React.HTMLAttributes<HTMLLabelElement> {
  value: string;
  disabled?: boolean;
  id?: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, disabled, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;
    const { value: selectedValue, onValueChange } = useRadioContext();
    const isSelected = selectedValue === value;

    return (
      <label
        htmlFor={radioId}
        className={cn("flex items-center space-x-2 cursor-pointer", className)}
        {...props}
      >
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            id={radioId}
            className="peer sr-only"
            value={value}
            checked={isSelected}
            disabled={disabled}
            onChange={() => onValueChange(value)}
            ref={ref}
          />
          <div className="h-4 w-4 rounded-full border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-white peer-focus:outline-dashed peer-focus:outline-1 peer-focus:outline-[var(--win95-focus)] peer-focus:outline-offset-1" />
          {isSelected && (
            <div className="absolute h-2 w-2 rounded-full bg-black" />
          )}
        </div>
        <span>{children}</span>
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

type RadioContextValue = {
  value: string | undefined;
  onValueChange: (value: string) => void;
};

const RadioContext = React.createContext<RadioContextValue | undefined>(
  undefined
);

const useRadioContext = () => {
  const context = React.useContext(RadioContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  return context;
};

export { RadioGroup, RadioGroupItem };

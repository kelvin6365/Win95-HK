import * as React from "react";
import { cn } from "@/lib/utils";

export interface StartMenuItem {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  submenu?: StartMenuItem[];
  divider?: boolean;
  isExpanded?: boolean;
}

export interface StartMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
  items?: StartMenuItem[];
}

const StartMenu = React.forwardRef<HTMLDivElement, StartMenuProps>(
  ({ className, isOpen = false, onClose, items = [], ...props }, ref) => {
    const [expandedItem, setExpandedItem] = React.useState<number | null>(null);

    // Move useEffect outside of conditional to fix linter error
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target &&
          !target.closest("[data-start-menu]") &&
          !target.closest("[data-start-button]")
        ) {
          onClose?.();
          setExpandedItem(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        data-start-menu
        className={cn(
          "absolute bottom-8 left-0 w-[200px] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] shadow-lg z-50",
          className
        )}
        {...props}
      >
        {/* Vertical Windows 95 sidebar */}
        <div className="h-full w-9 bg-[#000080] absolute left-0 top-0 bottom-0 flex items-end justify-center pb-4">
          <div className="text-white font-bold text-sm [writing-mode:vertical-lr] rotate-180 tracking-wide font-sans">
            Windows 95
          </div>
        </div>

        {/* Menu items container */}
        <div className="pl-10 py-1 flex flex-col">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider ? (
                <div className="h-[1px] bg-[var(--win95-border-dark)] my-1 mr-1" />
              ) : (
                <div className="relative">
                  {/* Menu item */}
                  <button
                    className={cn(
                      "flex items-center h-[22px] px-1 py-0.5 text-left w-full text-sm",
                      "hover:bg-[var(--win95-titlebar)] hover:text-[var(--win95-titlebar-fg)]",
                      expandedItem === index &&
                        "bg-[var(--win95-titlebar)] text-[var(--win95-titlebar-fg)]"
                    )}
                    onClick={() => {
                      if (item.submenu?.length) {
                        setExpandedItem(expandedItem === index ? null : index);
                      } else {
                        item.onClick?.();
                        onClose?.();
                      }
                    }}
                  >
                    {item.icon && (
                      <div className="mr-2 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </div>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.submenu?.length && <span className="ml-1">▶</span>}
                  </button>

                  {/* Submenu */}
                  {item.submenu?.length && expandedItem === index && (
                    <div className="absolute left-full top-0 w-[180px] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)] shadow-lg">
                      {item.submenu.map((subItem, subIndex) => (
                        <React.Fragment key={subIndex}>
                          {subItem.divider ? (
                            <div className="h-[1px] bg-[var(--win95-border-dark)] my-1 mx-1" />
                          ) : (
                            <button
                              className="flex items-center h-[22px] px-1 py-0.5 text-left hover:bg-[var(--win95-titlebar)] hover:text-[var(--win95-titlebar-fg)] w-full text-sm"
                              onClick={() => {
                                subItem.onClick?.();
                                onClose?.();
                              }}
                            >
                              {subItem.icon && (
                                <div className="mr-2 w-5 h-5 flex items-center justify-center">
                                  {subItem.icon}
                                </div>
                              )}
                              <span>{subItem.label}</span>
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
);
StartMenu.displayName = "StartMenu";

export { StartMenu };

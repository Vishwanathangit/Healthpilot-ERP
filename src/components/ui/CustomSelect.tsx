"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean | string;
  disabled?: boolean;
  size?: "sm" | "md";
  direction?: "auto" | "up" | "down";
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className = "",
  error,
  disabled = false,
  size = "md",
  direction = "auto",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (direction === "up") {
        setOpenUpward(true);
      } else if (direction === "down") {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 220);
      }
    }
  }, [isOpen, direction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 rounded-lg text-xs"
      : "px-4 py-3 rounded-xl text-sm";

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-auto"} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full border flex items-center justify-between gap-2.5 text-left font-semibold transition-all shadow-2xs cursor-pointer select-none ${sizeClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
            : isOpen
            ? "border-accent bg-white text-text-primary ring-2 ring-accent/20 shadow-xs"
            : error
            ? "border-rose-500 bg-surface text-text-primary ring-2 ring-rose-500/20"
            : "border-(--color-border) bg-surface text-text-primary hover:border-accent/50"
        }`}
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ease-in-out ${
            size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
          } ${isOpen ? "rotate-180 text-accent" : "text-text-muted"}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 left-0 min-w-full w-max max-w-xs sm:max-w-md max-h-60 overflow-y-auto rounded-xl border border-(--color-border) bg-white shadow-xl py-1 divide-y divide-border-subtle ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-text-muted italic text-center">
              No options available
            </div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(String(opt.value));
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent-light text-accent font-bold"
                      : "text-text-primary hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div>{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-accent shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

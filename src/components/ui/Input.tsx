"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[#1A1A1A] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]",
            error && "border-[#8B0000] focus:border-[#8B0000] focus:ring-[#8B0000]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[#8B0000]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

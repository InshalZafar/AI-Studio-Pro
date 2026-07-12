import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md bg-canvas-surface border border-canvas-border px-3.5 py-2.5 text-sm text-ink",
        "placeholder:text-ink-faint outline-none transition-colors",
        "focus:border-signal focus:ring-1 focus:ring-signal/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md bg-canvas-surface border border-canvas-border px-3.5 py-2.5 text-sm text-ink",
        "placeholder:text-ink-faint outline-none transition-colors resize-none",
        "focus:border-signal focus:ring-1 focus:ring-signal/40",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

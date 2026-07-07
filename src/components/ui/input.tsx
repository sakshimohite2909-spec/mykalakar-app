import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-orange-100/80 bg-white/85 px-3 py-2 text-sm text-foreground outline-none placeholder:text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl focus:border-orange-400/70 focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

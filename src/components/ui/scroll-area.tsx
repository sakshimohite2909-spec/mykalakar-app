import * as React from "react";

import { cn } from "@/lib/utils";

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  maxHeight?: string;
};

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, maxHeight = "100%", style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("scroll-container no-scrollbar pointer-events-auto", className)}
      style={{ maxHeight, ...style }}
      {...props}
    />
  )
);

ScrollArea.displayName = "ScrollArea";

export { ScrollArea };

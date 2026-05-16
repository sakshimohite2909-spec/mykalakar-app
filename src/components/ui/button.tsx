import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:-translate-y-0.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[linear-gradient(135deg,#ff6a00_0%,#ff8c3a_58%,#ffb37a_100%)] text-white shadow-[0_14px_34px_rgba(255,106,0,0.24)] hover:shadow-[0_22px_54px_rgba(255,106,0,0.28)]",
        destructive: "border border-red-300/20 bg-red-500/90 text-white shadow-[0_16px_40px_rgba(251,113,133,0.18)] hover:bg-red-500",
        outline: "border border-orange-100/80 bg-white/80 text-stone-800 shadow-sm backdrop-blur-2xl hover:border-orange-300/70 hover:bg-white hover:text-orange-700 hover:shadow-[0_14px_34px_rgba(255,106,0,0.12)]",
        secondary: "border border-orange-100/70 bg-white/75 text-stone-800 backdrop-blur-2xl hover:bg-white hover:text-orange-700",
        ghost: "text-stone-700 hover:bg-orange-50/80 hover:text-orange-700",
        link: "text-orange-700 underline-offset-4 hover:text-orange-600 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

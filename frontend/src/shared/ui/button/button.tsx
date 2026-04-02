import * as React from "react";
import { Loader2 } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "./button-variants";

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
}

// isLoading=true일 때는 항상 <button> 태그로 렌더링 (asChild 무시)
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  loadingContent,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild && !isLoading ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={isLoading || disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading
        ? (loadingContent ?? <Loader2 className="h-4 w-4 animate-spin" />)
        : children}
    </Comp>
  );
}

export { Button };
export type { ButtonProps };

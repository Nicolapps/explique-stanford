import { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export default function Tooltip({
  tip,
  children,
  side,
  sideOffset,
  asChild = false,
}: React.PropsWithChildren<{
  tip: ReactNode | string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  asChild?: boolean;
}>) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild={asChild}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className="z-50 overflow-hidden rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {tip}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

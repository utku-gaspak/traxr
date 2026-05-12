import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = ({ className, ...props }: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]", className)}
    {...props}
  />
);

const SheetContent = ({ className, children, ...props }: DialogPrimitive.DialogContentProps) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-[min(92vw,44rem)] flex-col border-l border-[color:var(--color-primary)] bg-[color:var(--color-card)] shadow-2xl",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-foreground)]">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
);

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-b border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] px-6 py-5",
      className,
    )}
    {...props}
  />
);

const SheetTitle = ({ className, ...props }: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title
    className={cn("font-heading text-2xl font-semibold text-[color:var(--color-foreground)]", className)}
    {...props}
  />
);

const SheetDescription = ({ className, ...props }: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description
    className={cn("mt-2 text-sm text-[color:var(--color-muted-foreground)]", className)}
    {...props}
  />
);

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger };

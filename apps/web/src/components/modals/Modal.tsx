"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

/**
 * Centered modal: blurred dark backdrop, card scales in. base-ui handles focus trap,
 * escape, and scroll lock; transitions ride on data-starting/ending-style.
 */
export function Modal({
  open, onOpenChange, title, subtitle, children, size = "md",
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; subtitle?: string; children: React.ReactNode; size?: "md" | "lg";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-md transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] ${size === "lg" ? "max-w-xl" : "max-w-md"} -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-card p-7 shadow-[0_30px_80px_-20px_rgba(18,20,18,0.45)] outline-none transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0 data-starting-style:translate-y-[calc(-50%+12px)]`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight">{title}</Dialog.Title>
              {subtitle && <Dialog.Description className="mt-1 text-sm text-dim">{subtitle}</Dialog.Description>}
            </div>
            <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas text-dim transition hover:bg-line hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

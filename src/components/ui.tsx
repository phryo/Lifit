"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Sprout,
  Footprints,
  Utensils,
  Wine,
  Moon,
  Soup,
} from "lucide-react";
import { Recommendation } from "@/lib/types";
export function Brand() {
  return (
    <span className="brand">
      <Sprout />
      lifit<span>・</span>
    </span>
  );
}
export function Modal({
  title,
  description,
  children,
  open,
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          aria-describedby={description ? "modal-description" : undefined}
        >
          <div className="modal-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="close-button" aria-label="閉じる">
              <X size={20} />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description
              id="modal-description"
              className="modal-description"
            >
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ActionIcon({
  kind,
  size = 22,
}: {
  kind: Recommendation["icon"];
  size?: number;
}) {
  const Icon = {
    salt: Soup,
    walk: Footprints,
    meal: Utensils,
    drink: Wine,
    sleep: Moon,
  }[kind];
  return <Icon size={size} strokeWidth={1.6} />;
}

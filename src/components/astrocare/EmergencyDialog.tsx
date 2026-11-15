import type { ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface EmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Simulated emergency communication interface. All visible copy — including
 * the dialog title for accessibility — is rendered by the page and passed as
 * children, so it stays inline-editable.
 */
export default function EmergencyDialog({ open, onOpenChange, children }: EmergencyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[85vh] max-w-lg overflow-y-auto border-destructive/40 bg-card"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

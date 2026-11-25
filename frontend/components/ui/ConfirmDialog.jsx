import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Editorial Confirmation Dialog for important / consequential actions
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this operation?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
            isDestructive
              ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]'
              : 'bg-[#F5F2EB] text-[#171717] border-[#E7E3DC]'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#171717] tracking-tight">{title}</h3>
          <p className="mt-1.5 text-xs text-[#6B665E] leading-relaxed">{description}</p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={isDestructive ? 'destructive' : 'primary'}
              size="sm"
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

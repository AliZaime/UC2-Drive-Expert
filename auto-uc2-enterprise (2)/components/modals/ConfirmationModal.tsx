
import React from 'react';
import { Modal, Button } from '../UI';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'emerald';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-6">
        <div className={`p-4 rounded-full ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          <AlertTriangle size={32} />
        </div>
        
        <div>
           <p className="text-zinc-300 mb-2">{message}</p>
        </div>

        <div className="flex gap-4 w-full">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button 
            variant={variant}
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

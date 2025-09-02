
import React, { ReactNode } from 'react';
import { XMarkIcon } from '../icons/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-700 transition-transform duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-brand-text capitalize">{title}</h2>
          <button onClick={onClose} className="p-1 text-brand-text-secondary hover:text-white rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

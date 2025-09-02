import React from 'react';
import { Email } from '../../types';
import { XMarkIcon } from '../icons/Icons';

interface EmailDetailModalProps {
  email: Email | null;
  onClose: () => void;
}

const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, onClose }) => {
  if (!email) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700 transition-transform duration-300 transform scale-95"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: 'scale(1)' }} // Animate in
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-brand-text">Email Details</h2>
          <button onClick={onClose} className="p-1 text-brand-text-secondary hover:text-white rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <span className="text-sm font-semibold text-brand-text-secondary">From: </span>
            <span className="text-sm text-brand-text">{email.sender}</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-brand-text-secondary">Subject: </span>
            <span className="text-sm font-semibold text-brand-text">{email.subject}</span>
          </div>
          <div className="pt-4 border-t border-slate-700">
             <p className="text-brand-text whitespace-pre-wrap leading-relaxed">{email.body}</p>
          </div>
        </div>
         <div className="p-4 border-t border-slate-700 text-right">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailModal;

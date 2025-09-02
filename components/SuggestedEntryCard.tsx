

import React from 'react';
import { SuggestedEntry } from '../types';
import { PencilIcon, XMarkIcon, PlusCircleIcon, SparklesIcon, EnvelopeIcon } from './icons/Icons';
import Spinner from './ui/Spinner';
import ConfidenceMeter from './ui/ConfidenceMeter';

interface SuggestedEntryCardProps {
  suggestion: SuggestedEntry;
  onReview: (suggestion: SuggestedEntry) => void;
  onDismiss: (emailIds: string[]) => void;
  onQuickAdd: (suggestion: SuggestedEntry) => void;
  isProcessing: boolean;
}

const SuggestedEntryCard: React.FC<SuggestedEntryCardProps> = ({ suggestion, onReview, onDismiss, onQuickAdd, isProcessing }) => {
  const { emails, preview } = suggestion;
  const primaryEmail = emails[0];

  return (
    <div className={`bg-brand-primary p-3 rounded-lg shadow-lg border border-slate-700 transition-all duration-300 hover:border-brand-accent ${isProcessing ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <p className="text-sm font-semibold text-brand-text truncate">{primaryEmail.subject}</p>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-400 w-fit">
                <EnvelopeIcon className="h-3 w-3 mr-1.5"/>
                {emails.length} emails
             </div>
             <p className="text-xs text-brand-text-secondary truncate">From: {primaryEmail.sender}</p>
          </div>
        </div>
        <p className="text-xs text-brand-text-secondary whitespace-nowrap">{new Date(primaryEmail.date).toLocaleDateString()}</p>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-800">
        <p className="text-sm text-brand-text-secondary italic flex items-start gap-2">
            <SparklesIcon className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <span>"{preview.description}"</span>
        </p>
        {preview.confidenceScore && (
          <div className="mt-2">
            <ConfidenceMeter 
              score={preview.confidenceScore} 
              justification={preview.confidenceJustification || 'No justification provided.'} 
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button 
          onClick={() => onDismiss(suggestion.emailIds)}
          disabled={isProcessing}
          className="p-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors disabled:cursor-not-allowed"
          aria-label="Dismiss suggestion"
          title="Dismiss"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onReview(suggestion)}
          disabled={isProcessing}
          className="p-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors disabled:cursor-not-allowed"
          aria-label="Review suggestion"
          title="Review"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onQuickAdd(suggestion)}
          disabled={isProcessing}
          className="flex-grow flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors disabled:cursor-wait disabled:bg-brand-accent/70"
          aria-label="Quickly add as draft"
        >
          {isProcessing ? <Spinner size="small" /> : <PlusCircleIcon className="w-5 h-5" />}
          <span className={isProcessing ? 'hidden' : 'sm:inline'}>Quick Add</span>
        </button>
      </div>
    </div>
  );
};

export default SuggestedEntryCard;

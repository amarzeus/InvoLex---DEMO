import React, { useState } from 'react';
import { Email } from '../types';
import { SparklesIcon, BoltIcon } from './icons/Icons';
import Spinner from './ui/Spinner';

interface ReplyViewProps {
  email: Email;
  replyText: string;
  setReplyText: (text: string) => void;
  onCancel: () => void;
  isGeneratingDraft: boolean;
  onAiEmailAction: (action: 'draft' | 'refine', instruction: string, context: { emailBody: string | null, currentDraft: string | null }) => Promise<void>;
}

const ReplyView: React.FC<ReplyViewProps> = ({ email, replyText, setReplyText, onCancel, isGeneratingDraft, onAiEmailAction }) => {
  const subject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
  const [userPrompt, setUserPrompt] = useState('');

  const handleDraft = () => {
    if (userPrompt.trim()) {
      onAiEmailAction('draft', userPrompt, { emailBody: email.body, currentDraft: null });
    }
  };

  const handleRefine = (refinementInstruction: string) => {
    onAiEmailAction('refine', refinementInstruction, {
      emailBody: email.body,
      currentDraft: replyText,
    });
  };

  return (
    <div className="flex flex-col h-full bg-brand-primary p-4 overflow-y-auto flex-1">
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Reply with AI</h2>
          <button onClick={onCancel} className="text-sm text-brand-text-secondary hover:text-brand-text">Cancel</button>
        </div>
        <div className="mt-4 bg-brand-secondary p-3 rounded-lg text-sm space-y-2 border border-slate-700">
            <div><span className="font-semibold text-brand-text-secondary w-16 inline-block">From:</span> you@yourfirm.com</div>
            <div><span className="font-semibold text-brand-text-secondary w-16 inline-block">To:</span> {email.sender}</div>
            <div><span className="font-semibold text-brand-text-secondary w-16 inline-block">Subject:</span> {subject}</div>
        </div>
      </div>
      
      {/* AI Prompt Section */}
      <div className="flex-shrink-0 mb-4 space-y-2">
        <label htmlFor="ai-prompt" className="text-sm font-medium text-brand-text-secondary">AI Instruction</label>
        <textarea
            id="ai-prompt"
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder="e.g., Agree to the extension but ask for the documents by Friday."
            rows={2}
            className="w-full bg-brand-secondary border border-slate-600 rounded-lg p-2 text-sm text-brand-text focus:ring-brand-accent focus:border-brand-accent resize-y"
        />
        <button onClick={handleDraft} disabled={isGeneratingDraft || !userPrompt.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isGeneratingDraft ? <Spinner size="small" /> : <SparklesIcon className="h-5 w-5" />}
            Draft with AI
        </button>
      </div>

      {/* Main Editor */}
      <div className="flex-grow flex flex-col">
        {isGeneratingDraft ? (
            <div className="flex-grow w-full bg-brand-secondary border border-slate-600 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
        ) : (
            <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Your AI-generated draft will appear here..."
                className="flex-grow w-full bg-brand-secondary border border-slate-600 rounded-lg p-4 text-base text-brand-text focus:ring-brand-accent focus:border-brand-accent resize-none"
            />
        )}
      </div>

      {/* Refinement Toolbar */}
      {replyText && !isGeneratingDraft && (
        <div className="flex-shrink-0 mt-3 space-y-2">
            <label className="text-xs font-medium text-brand-text-secondary flex items-center gap-2"><BoltIcon className="h-4 w-4 text-purple-400" /> Refine Tone & Style</label>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => handleRefine('Make it more formal')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">More Formal</button>
                <button onClick={() => handleRefine('Make it more casual')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">More Casual</button>
                <button onClick={() => handleRefine('Make it firmer')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">Firmer Stance</button>
                <button onClick={() => handleRefine('Make it more accommodating')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">Softer Stance</button>
                <button onClick={() => handleRefine('Make it more concise')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">More Concise</button>
                <button onClick={() => handleRefine('Expand on the details')} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-600 hover:bg-slate-500 transition-colors">More Detailed</button>
            </div>
        </div>
      )}

      {/* Original Message */}
      <div className="mt-4 p-4 border-t border-slate-700 bg-brand-primary rounded-b-lg flex-shrink-0">
        <details>
          <summary className="text-sm font-semibold text-brand-text-secondary cursor-pointer">View Original Message</summary>
          <div className="mt-2 text-sm bg-brand-secondary p-3 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
            <p className="font-bold">{email.subject}</p>
            <p className="text-xs text-brand-text-secondary">From: {email.sender}</p>
            <p className="mt-3 whitespace-pre-wrap text-brand-text-secondary">{email.body}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ReplyView;
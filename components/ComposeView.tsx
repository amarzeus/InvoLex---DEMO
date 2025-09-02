import React, { useState } from 'react';
import { SparklesIcon, BoltIcon } from './icons/Icons';
import Spinner from './ui/Spinner';

interface ComposeData {
  to: string;
  subject: string;
  body: string;
}

interface ComposeViewProps {
  composeData: ComposeData;
  setComposeData: (data: ComposeData) => void;
  onCancel: () => void;
  isGeneratingDraft: boolean;
  onAiEmailAction: (action: 'draft' | 'refine', instruction: string, context: { emailBody: string | null, currentDraft: string | null }) => Promise<void>;
}

const ComposeView: React.FC<ComposeViewProps> = ({ composeData, setComposeData, onCancel, isGeneratingDraft, onAiEmailAction }) => {
  const [userPrompt, setUserPrompt] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setComposeData({
      ...composeData,
      [e.target.name]: e.target.value
    });
  };

  const handleDraft = () => {
    if (userPrompt.trim()) {
      onAiEmailAction('draft', userPrompt, { emailBody: null, currentDraft: null });
    }
  };

  const handleRefine = (refinementInstruction: string) => {
    onAiEmailAction('refine', refinementInstruction, {
        emailBody: null,
        currentDraft: composeData.body,
    });
  };

  return (
    <div className="flex flex-col h-full bg-brand-primary p-4 overflow-y-auto flex-1">
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Compose with AI</h2>
          <button onClick={onCancel} className="text-sm text-brand-text-secondary hover:text-brand-text">Cancel</button>
        </div>
        <div className="mt-4 bg-brand-secondary p-3 rounded-lg text-sm space-y-2 border border-slate-700">
          <div className="flex items-center">
            <label htmlFor="to" className="font-semibold text-brand-text-secondary w-16 inline-block">To:</label>
            <input 
              type="email" 
              name="to" 
              id="to" 
              value={composeData.to}
              onChange={handleChange}
              placeholder="recipient@example.com"
              className="flex-grow bg-transparent focus:outline-none text-brand-text" 
            />
          </div>
          <div className="flex items-center border-t border-slate-600 pt-2">
            <label htmlFor="subject" className="font-semibold text-brand-text-secondary w-16 inline-block">Subject:</label>
            <input 
              type="text" 
              name="subject" 
              id="subject"
              value={composeData.subject}
              onChange={handleChange}
              placeholder="Email subject"
              className="flex-grow bg-transparent focus:outline-none text-brand-text"
            />
          </div>
        </div>
      </div>
      
      {/* AI Prompt Section */}
      <div className="flex-shrink-0 mb-4 space-y-2">
        <label htmlFor="ai-prompt" className="text-sm font-medium text-brand-text-secondary">AI Instruction</label>
        <textarea
            id="ai-prompt"
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder="e.g., Draft a follow-up email about the merger agreement..."
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
              name="body"
              value={composeData.body}
              onChange={handleChange}
              placeholder="Your AI-generated draft will appear here..."
              className="flex-grow w-full bg-brand-secondary border border-slate-600 rounded-lg p-4 text-base text-brand-text focus:ring-brand-accent focus:border-brand-accent resize-none"
            />
          )}
      </div>

       {/* Refinement Toolbar */}
      {composeData.body && !isGeneratingDraft && (
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
    </div>
  );
};

export default ComposeView;
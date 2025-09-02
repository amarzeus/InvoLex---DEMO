import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BillableEntry, Email, InvoLexPanelView, ModalView, BillableEntryStatus, AIPreview, Correction, Matter, ActionItem, SuggestedEntry, EmailTriageResult, TriageStatus, AlternativeMatterSuggestion, NotificationType } from '../types';
import BillableEntryCard from './BillableEntryCard';
import SuggestedEntryCard from './SuggestedEntryCard';
import { aiService } from '../services/aiService';
import Spinner from './ui/Spinner';
import { useNotification } from '../contexts/NotificationContext';
import { 
  SparklesIcon, 
  ClockRewindIcon, 
  Cog6ToothIcon, 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  ClipboardDocumentListIcon,
  LightBulbIcon,
  ArrowPathIcon,
  InvoLexLogo,
  PaperAirplaneIcon,
  PencilIcon,
  XMarkIcon,
  PlusCircleIcon,
  HomeIcon,
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  WandIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  ArrowUpOnSquareIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
} from './icons/Icons';
import ToggleSwitch from './ui/ToggleSwitch';
import ConfidenceMeter from './ui/ConfidenceMeter';

interface InvoLexPanelProps {
  emails: Email[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedEmail: Email | null;
  onSelectEmail: (email: Email | null) => void;
  allEntries: BillableEntry[];
  onCreateEntry: (data: { emailIds: string[]; description: string; hours: number; matter: string; actionItems?: string[]; detailedBreakdown?: string[] }, asDraft?: boolean) => void;
  onCreateAndSyncEntry: (data: { emailIds: string[]; description: string; hours: number; matter: string; actionItems?: string[], detailedBreakdown?: string[] }) => void;
  onUpdateEntry: (originalEntry: BillableEntry, updatedEntry: BillableEntry) => void;
  onSyncEntry: (id: string) => Promise<void>;
  onViewEmail: (emailId: string) => void;
  onOpenModal: (view: ModalView) => void;
  onOpenManualEntry: () => void;
  matters: Matter[];
  selectedIds: Set<string>;
  onToggleSelection: (id:string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onBulkSyncAutoPilot: () => void;
  isPersonalizationEnabled: boolean;
  corrections: Correction[];
  onToggleActionItem: (entryId: string, actionItemId: string) => void;
  suggestedEntries: SuggestedEntry[];
  onDismissSuggestion: (emailIds: string[]) => void;
  onScanForSuggestions: () => void;
  onUseAsTemplate: (entry: BillableEntry) => void;
  templateForGen: BillableEntry | null;
  setTemplateForGen: (template: BillableEntry | null) => void;
  todaysBillableHours: number;
  onQuickAddSuggestion: (suggestion: SuggestedEntry) => void;
  processingSuggestionId: string | null;
  triageResult: EmailTriageResult | null;
  onMarkAsProcessedAndNext: (emailId: string) => void;
  onSyncEntries: (ids: string[]) => Promise<void>;
  onBulkSyncAllPending: () => void;
  onSetArchiveStatus: (ids: string[], isArchived: boolean) => void;
  reviewingSuggestion: SuggestedEntry | null;
  setReviewingSuggestion: (suggestion: SuggestedEntry | null) => void;
  replyingToEmail: Email | null;
  replyText: string;
  onFinishReply: () => void;
  isComposing: boolean;
  composeData: { to: string, subject: string, body: string };
  onStartCompose: () => void;
  onFinishCompose: () => void;
  setReplyText: (text: string) => void;
  setComposeData: (data: { to: string, subject: string, body: string }) => void;
}

const InvoLexPanel: React.FC<InvoLexPanelProps> = (props) => {
  const { 
      emails, isCollapsed, onToggleCollapse, selectedEmail, onSelectEmail, allEntries, 
      onCreateEntry, onCreateAndSyncEntry, onUpdateEntry, onViewEmail, onOpenModal, 
      onOpenManualEntry, matters, selectedIds, onToggleSelection, onToggleSelectAll, 
      onBulkSyncAutoPilot, isPersonalizationEnabled, corrections, onToggleActionItem, 
      suggestedEntries, onDismissSuggestion, onScanForSuggestions, onUseAsTemplate, templateForGen, 
      setTemplateForGen, todaysBillableHours, onQuickAddSuggestion, processingSuggestionId, 
      triageResult, onMarkAsProcessedAndNext, onSyncEntry, onSyncEntries, onBulkSyncAllPending,
      onSetArchiveStatus, reviewingSuggestion, setReviewingSuggestion,
      replyingToEmail, replyText, onFinishReply,
      isComposing, composeData, onStartCompose, onFinishCompose,
      setReplyText, setComposeData,
  } = props;

  const [activeView, setActiveView] = useState<InvoLexPanelView>(InvoLexPanelView.Dashboard);
  const { addNotification } = useNotification();
  
  // Triage View State
  const [triageFormData, setTriageFormData] = useState<Partial<AIPreview>>({});
  const [justification, setJustification] = useState<AIPreview['justification'] | null>(null);
  const [overrideTriage, setOverrideTriage] = useState(false);
  const [alternativeMatters, setAlternativeMatters] = useState<AlternativeMatterSuggestion[]>([]);
  const [isFetchingAltMatters, setIsFetchingAltMatters] = useState(false);
  
  // Live Billing State
  const [livePreview, setLivePreview] = useState<AIPreview | null>(null);
  const [isGeneratingLive, setIsGeneratingLive] = useState(false);
  
  // History View State
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Tasks View State
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'completed'>('open');

  const unseenSuggestions = useMemo(() => {
    const entryEmailIds = new Set(allEntries.flatMap(e => e.emailIds || []));
    return suggestedEntries.filter(s => !s.emailIds.some(id => entryEmailIds.has(id)));
  }, [suggestedEntries, allEntries]);

  const resetTriageForm = useCallback((isNewSelection = false) => {
    setTriageFormData({
      description: '',
      suggestedHours: 0.2,
      suggestedMatter: matters.length > 0 ? matters[0].name : '',
      actionItems: [],
      detailedBreakdown: [],
    });
    setJustification(null);
    setAlternativeMatters([]);
    if (isNewSelection) {
      setOverrideTriage(false);
    }
  }, [matters]);
  
  // Populate form from triage result or template or reviewed suggestion
  useEffect(() => {
     if (reviewingSuggestion) {
      onSelectEmail(reviewingSuggestion.emails[0]);
      setTriageFormData(reviewingSuggestion.preview);
      setJustification(reviewingSuggestion.preview.justification || null);
      setOverrideTriage(true); // Always treat as an override to show form directly
      setReviewingSuggestion(null); // Consume it
      return; // Prioritize reviewing suggestion
    }
    
    if (triageResult?.status === TriageStatus.BILLABLE && triageResult.preview) {
        setTriageFormData(triageResult.preview);
        setJustification(triageResult.preview.justification || null);
    } else if (triageResult?.status === TriageStatus.NOT_BILLABLE || triageResult?.status === TriageStatus.ANALYZING || triageResult?.status === TriageStatus.DUPLICATE_SUSPECTED) {
        resetTriageForm();
    }

    if (templateForGen && selectedEmail) {
      setTriageFormData({
        description: templateForGen.description,
        suggestedHours: templateForGen.hours,
        suggestedMatter: templateForGen.matter,
        actionItems: templateForGen.actionItems?.map(ai => ai.text) || [],
        detailedBreakdown: templateForGen.detailedBreakdown || [],
      });
      setJustification(null);
      setActiveView(InvoLexPanelView.Action);
      setTemplateForGen(null);
      setOverrideTriage(true);
    }
  }, [triageResult, templateForGen, selectedEmail, setTemplateForGen, resetTriageForm, reviewingSuggestion, onSelectEmail, setReviewingSuggestion]);

  // Reset override and form when selected email changes
  useEffect(() => {
      // Don't reset if we're actively populating from a reviewingSuggestion
      if (!reviewingSuggestion) {
         resetTriageForm(true);
      }
  }, [selectedEmail, resetTriageForm, reviewingSuggestion]);
  
  // Live billing effect for Reply and Compose
  useEffect(() => {
    const isLiveBillingActive = replyingToEmail || isComposing;
    const textToAnalyze = isComposing ? composeData.body : replyText;
    const contextEmailBody = replyingToEmail ? replyingToEmail.body : '';
    
    if (!isLiveBillingActive || !textToAnalyze.trim()) {
        setLivePreview(null);
        return;
    }

    const handler = setTimeout(() => {
      setIsGeneratingLive(true);
      aiService.generateLiveBillableEntry(contextEmailBody, textToAnalyze, matters)
        .then(preview => setLivePreview(prev => ({...(prev || {}), ...preview}))) // merge with user edits
        .catch(console.error)
        .finally(() => setIsGeneratingLive(false));
    }, 750); // 750ms debounce

    return () => clearTimeout(handler);
  }, [replyText, replyingToEmail, composeData.body, isComposing, matters]);
  
  // Sync livePreview state with form data
  useEffect(() => {
    const isLiveBillingActive = replyingToEmail || isComposing;
    if (isLiveBillingActive && livePreview) {
      setTriageFormData(livePreview);
    }
  }, [livePreview, replyingToEmail, isComposing]);

  const handleRefineDescription = useCallback(async (entryId: string, instruction: string) => {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry || !entry.emailIds?.[0]) {
      addNotification("Cannot refine: Source email not found for this entry.", NotificationType.Error);
      return;
    }
    const email = emails.find(e => e.id === entry.emailIds![0]);
    if (!email) {
      addNotification("Cannot refine: Source email data is missing.", NotificationType.Error);
      return;
    }
    
    try {
      const refinedDescription = await aiService.refineDescriptionWithAI(entry.description, instruction, email.body);
      onUpdateEntry(entry, { ...entry, description: refinedDescription });
      addNotification("Description successfully refined by AI.", NotificationType.Info);
    } catch (error) {
      console.error("AI refinement failed:", error);
      addNotification("An error occurred during AI refinement.", NotificationType.Error);
    }
  }, [allEntries, onUpdateEntry, addNotification, emails]);
  

  const handleSubmit = (sync: boolean) => {
    if (!selectedEmail || !triageFormData.description || !triageFormData.suggestedMatter) {
      alert("Please ensure an email is selected and description/matter are filled.");
      return;
    }
    
    const entryEmailIds = allEntries.find(e => e.emailIds?.includes(selectedEmail.id))?.emailIds || [selectedEmail.id];

    const data = {
      emailIds: entryEmailIds,
      description: triageFormData.description,
      hours: triageFormData.suggestedHours || 0,
      matter: triageFormData.suggestedMatter,
      actionItems: triageFormData.actionItems,
      detailedBreakdown: triageFormData.detailedBreakdown,
    };
    if (sync) {
      onCreateAndSyncEntry(data);
    } else {
      onCreateEntry(data);
    }
    onSelectEmail(null);
    resetTriageForm(true);
  };
  
  const handleSuggestAltMatters = useCallback(async () => {
    if (!selectedEmail || !triageFormData.suggestedMatter) return;
    setIsFetchingAltMatters(true);
    setAlternativeMatters([]);
    try {
        const result = await aiService.suggestAlternativeMatters(selectedEmail.body, matters, triageFormData.suggestedMatter);
        setAlternativeMatters(result.suggestions);
    } catch (e) {
        console.error("Failed to fetch alternative matters", e);
    } finally {
        setIsFetchingAltMatters(false);
    }
  }, [selectedEmail, matters, triageFormData.suggestedMatter]);

  const handleFormChange = (field: keyof AIPreview, value: any) => {
    setTriageFormData(prev => ({...prev, [field]: value}));
    if(replyingToEmail || isComposing) {
      setLivePreview(prev => prev ? ({...prev, [field]: value}) : null);
    }
    if (field === 'suggestedMatter') {
      setAlternativeMatters([]); // Clear suggestions when user manually changes matter
    }
  };
  
  const pendingEntries = useMemo(() => allEntries.filter(e => e.status === BillableEntryStatus.Pending), [allEntries]);
  const processedEntries = useMemo(() => allEntries.filter(e => e.status !== BillableEntryStatus.Pending && e.status !== BillableEntryStatus.Generating), [allEntries]);

  const filteredHistory = useMemo(() => {
    return processedEntries.filter(entry => 
      (showArchived ? entry.isArchived === true : !entry.isArchived) &&
      (entry.description.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      entry.matter.toLowerCase().includes(historySearchTerm.toLowerCase()))
    );
  }, [processedEntries, historySearchTerm, showArchived]);
  
  const allTasks = useMemo(() => {
    const tasks: (ActionItem & { entry: BillableEntry })[] = [];
    allEntries.forEach(entry => {
      if(entry.actionItems) {
        entry.actionItems.forEach(item => {
          tasks.push({ ...item, entry });
        });
      }
    });
    return tasks.sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [allEntries]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'open') return allTasks.filter(task => !task.completed);
    if (taskFilter === 'completed') return allTasks.filter(task => task.completed);
    return allTasks;
  }, [allTasks, taskFilter]);
  
  const NavButton = ({ view, icon, label, badgeCount }: { view: InvoLexPanelView; icon: React.ReactNode; label: string; badgeCount?: number; }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`relative flex flex-col items-center justify-center gap-1 w-full py-2 rounded-lg transition-colors duration-200 ${activeView === view ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-slate-600'}`}
      aria-current={activeView === view}
    >
      <div className="h-6 w-6">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
      {badgeCount && badgeCount > 0 && (
          <span className="absolute top-1 right-1/2 translate-x-4 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-brand-secondary rounded-full">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
      )}
    </button>
  );

  const renderDashboardView = () => {
    const openTasksCount = allTasks.filter(t => !t.completed).length;
    const nextSuggestion = unseenSuggestions[0];
    
    return (
      <div className="p-4 flex flex-col h-full overflow-y-auto space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Dashboard</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={onStartCompose}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors"
              title="Compose and Bill New Email"
            >
              <PencilIcon className="h-5 w-5" />
              Compose
            </button>
            <button 
              onClick={onOpenManualEntry}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors"
              title="Add Manual Time Entry"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add Time
            </button>
          </div>
        </div>
  
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-brand-primary p-3 rounded-lg">
            <p className="text-2xl font-bold text-brand-accent">{todaysBillableHours.toFixed(1)}</p>
            <p className="text-xs text-brand-text-secondary">Hours Today</p>
          </div>
          <div className="bg-brand-primary p-3 rounded-lg">
            <p className="text-2xl font-bold">{pendingEntries.length}</p>
            <p className="text-xs text-brand-text-secondary">For Review</p>
          </div>
          <div className="bg-brand-primary p-3 rounded-lg">
            <p className="text-2xl font-bold">{openTasksCount}</p>
            <p className="text-xs text-brand-text-secondary">Open Tasks</p>
          </div>
        </div>
        
        {nextSuggestion && (
          <div className="bg-brand-primary p-3 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-sm mb-2 text-brand-text">Up Next</h4>
            <div className="bg-brand-secondary p-3 rounded-md">
              <p className="text-sm font-medium truncate">{nextSuggestion.emails[0].subject}</p>
              <p className="text-xs text-brand-text-secondary truncate">{nextSuggestion.emails.length} emails from: {nextSuggestion.emails[0].sender}</p>
               <p className="text-xs italic text-cyan-400 mt-2 border-t border-slate-700 pt-2">
                 <SparklesIcon className="h-3 w-3 inline-block mr-1" />
                 {nextSuggestion.preview.description}
               </p>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onDismissSuggestion(nextSuggestion.emailIds)} className="w-full text-center text-sm font-semibold px-3 py-1.5 rounded-md transition-colors bg-slate-600 hover:bg-slate-500 text-white">Dismiss</button>
              <button onClick={() => { setReviewingSuggestion(nextSuggestion); setActiveView(InvoLexPanelView.Action); }} className="w-full text-center text-sm font-semibold px-3 py-1.5 rounded-md transition-colors bg-brand-accent hover:bg-brand-accent-hover text-white">Triage</button>
            </div>
          </div>
        )}

        {pendingEntries.length > 0 && (
          <div className="bg-brand-primary p-3 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-2">
               <h4 className="font-semibold text-sm text-brand-text flex items-center gap-2"><PencilIcon className="h-5 w-5 text-blue-400"/> Items to Review</h4>
               <span className="text-xs font-bold bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full">{pendingEntries.length}</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {pendingEntries.slice(0,5).map(entry => (
                <div key={entry.id} className="text-xs bg-brand-secondary p-2 rounded-md">
                  <p className="truncate">{entry.description}</p>
                  <p className="text-brand-text-secondary">{entry.matter} - {entry.hours.toFixed(1)}h</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveView(InvoLexPanelView.Review)} className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Review All
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSuggestionsView = () => (
    <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">AI Suggestions</h3>
            <button onClick={onScanForSuggestions} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-brand-primary hover:bg-slate-600 border border-slate-600 text-brand-text-secondary transition-colors" title="Scan for new suggestions">
                <ArrowPathIcon className="h-5 w-5"/>
                Scan
            </button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {unseenSuggestions.length > 0 ? (
                unseenSuggestions.map(suggestion => (
                    <SuggestedEntryCard 
                        key={suggestion.emailIds.join('-')}
                        suggestion={suggestion}
                        onDismiss={onDismissSuggestion}
                        onReview={(s) => {
                           setReviewingSuggestion(s);
                           setActiveView(InvoLexPanelView.Action);
                        }}
                        onQuickAdd={onQuickAddSuggestion}
                        isProcessing={processingSuggestionId === suggestion.emailIds.join(',')}
                    />
                ))
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-brand-text-secondary" />
                    <h4 className="font-semibold text-brand-text text-lg">All caught up!</h4>
                    <p className="text-sm mt-2 text-brand-text-secondary">No new suggestions found. Try scanning again.</p>
                </div>
            )}
        </div>
    </div>
  );
  
  const renderLiveBillingView = () => {
    const isReplying = !!replyingToEmail;
    if (!isReplying && !isComposing) return null;

    const subject = isReplying ? (replyingToEmail.subject.startsWith("Re:") ? replyingToEmail.subject : `Re: ${replyingToEmail.subject}`) : composeData.subject;
    const recipient = isReplying ? replyingToEmail.sender : composeData.to;

    const handleSendAndBill = () => {
        if (!triageFormData.description || !triageFormData.suggestedMatter) {
             addNotification('Please ensure description and matter are filled out.', NotificationType.Error);
             return;
        }

        const baseDescription = isReplying 
            ? `Replied to email re: ${replyingToEmail.subject}` 
            : `Drafted email re: ${composeData.subject}`;
        
        const data = {
          emailIds: isReplying ? [replyingToEmail.id] : [],
          description: `${baseDescription}. ${triageFormData.description}`,
          hours: triageFormData.suggestedHours || 0.2,
          matter: triageFormData.suggestedMatter,
        };
        onCreateEntry(data, true); // Save as draft
        isReplying ? onFinishReply() : onFinishCompose();
    };

    const handleCancel = isReplying ? onFinishReply : onFinishCompose;
    const sendButtonText = isReplying ? 'Approve & Send' : 'Save Draft & Send';
    
    return (
        <div className="p-4 flex flex-col h-full">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Live Billing Draft
            </h3>
            <div className="bg-brand-primary p-3 rounded-lg border border-slate-700 my-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-text truncate">{recipient || 'No Recipient'}</p>
                  <p className="text-sm text-brand-text-secondary">{subject || 'No Subject'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-medium text-brand-text-secondary flex items-center gap-2">
                  {isGeneratingLive ? <Spinner size="small" /> : <SparklesIcon className="h-4 w-4 text-purple-400" />}
                  AI Generated Description
                </label>
                <textarea 
                  value={triageFormData.description || ''}
                  onChange={e => handleFormChange('description', e.target.value)}
                  placeholder={isGeneratingLive ? "Generating..." : "AI suggestion will appear here"}
                  className="mt-1 w-full bg-brand-primary border border-slate-700 rounded-md p-2 text-sm h-28"
                />
              </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary">Hours</label>
                    <input type="number" step="0.1" value={triageFormData.suggestedHours || 0} onChange={e => handleFormChange('suggestedHours', parseFloat(e.target.value))} className="mt-1 w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary">Matter</label>
                    <select value={triageFormData.suggestedMatter || ''} onChange={e => handleFormChange('suggestedMatter', e.target.value)} className="mt-1 w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm">
                      {matters.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                      {triageFormData.suggestedMatter && !matters.some(m => m.name === triageFormData.suggestedMatter) && <option value={triageFormData.suggestedMatter}>{triageFormData.suggestedMatter}</option>}
                    </select>
                  </div>
               </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={handleCancel} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-white transition-colors">
                  Send without Bill
                </button>
                <button onClick={handleSendAndBill} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {sendButtonText}
                </button>
              </div>
            </div>
        </div>
    );
  }

  const renderTriageView = () => {
    if (replyingToEmail || isComposing) {
        return renderLiveBillingView();
    }
      
    if (!selectedEmail) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <PencilIcon className="h-12 w-12 mx-auto mb-4 text-brand-text-secondary" />
            <h4 className="font-semibold text-brand-text text-lg">Triage Email</h4>
            <p className="text-sm mt-2 text-brand-text-secondary max-w-xs">Select an email from your inbox to have the AI analyze it for billable work.</p>
        </div>
      );
    }
    
    if (!triageResult || triageResult.status === TriageStatus.ANALYZING) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary">
          <Spinner />
          <p className="mt-4">Analyzing email...</p>
        </div>
      );
    }

    if (triageResult.status === TriageStatus.DUPLICATE_SUSPECTED && !overrideTriage) {
        return (
            <div className="p-4 flex flex-col h-full items-center justify-center text-center">
                <div className="bg-brand-primary p-6 rounded-lg border border-yellow-500/50 w-full">
                    <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-text">Potential Duplicate</h3>
                    <p className="text-sm text-brand-text-secondary mt-2 mb-4 italic">"{triageResult.reason}"</p>
                    <div className="space-y-3">
                         <button onClick={() => onMarkAsProcessedAndNext(selectedEmail.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">
                            Mark as Processed & Next
                            <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setOverrideTriage(true)} className="w-full px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-white transition-colors">
                            Create Entry Anyway
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    
    if (triageResult.status === TriageStatus.NOT_BILLABLE && !overrideTriage) {
        return (
            <div className="p-4 flex flex-col h-full items-center justify-center text-center">
                <div className="bg-brand-primary p-6 rounded-lg border border-slate-700 w-full">
                    <ShieldCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-text">AI Suggests No Billable Work</h3>
                    <p className="text-sm text-brand-text-secondary mt-2 mb-4 italic">"{triageResult.reason}"</p>
                    <div className="space-y-3">
                         <button onClick={() => onMarkAsProcessedAndNext(selectedEmail.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">
                            Mark as Processed & Next
                            <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setOverrideTriage(true)} className="w-full px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-white transition-colors">
                            Create Entry Manually
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (triageResult.status === TriageStatus.AUTO_PROCESSED) {
        return (
            <div className="p-4 flex flex-col h-full items-center justify-center text-center">
                <div className="bg-brand-primary p-6 rounded-lg border border-slate-700 w-full">
                    <CpuChipIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-text">Entry Auto-Processed</h3>
                    <p className="text-sm text-brand-text-secondary mt-2 mb-4 italic">"{triageResult.reason}"</p>
                </div>
            </div>
        )
    }

    // Render billable form (if status is BILLABLE or override is true)
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="bg-brand-primary p-3 rounded-lg border border-slate-700 mb-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-text truncate">{selectedEmail.sender}</p>
              <p className="text-sm text-brand-text-secondary">{selectedEmail.subject}</p>
            </div>
            <button onClick={() => onViewEmail(selectedEmail.id)} className="text-xs text-brand-accent hover:underline flex-shrink-0">View Email</button>
          </div>
        </div>

        <div className="space-y-3 flex-grow overflow-y-auto pr-1">
          {triageResult.preview?.confidenceScore && (
              <ConfidenceMeter 
                  score={triageResult.preview.confidenceScore} 
                  justification={triageResult.preview.confidenceJustification || 'No justification provided.'} 
              />
          )}
          {justification?.ruleAppliedMessage && (
              <div className="bg-purple-900/50 p-3 rounded-lg border border-purple-500/50 text-purple-300 text-sm flex items-center gap-2">
                  <CpuChipIcon className="h-5 h-5 flex-shrink-0"/>
                  <span>{justification.ruleAppliedMessage}</span>
              </div>
          )}
          <div>
            <label className="text-xs font-medium text-brand-text-secondary">Description</label>
            <textarea value={triageFormData.description} onChange={e => handleFormChange('description', e.target.value)} className="mt-1 w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm h-28 resize-none" />
          </div>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-text-secondary">Hours</label>
                <input type="number" step="0.1" value={triageFormData.suggestedHours} onChange={e => handleFormChange('suggestedHours', parseFloat(e.target.value))} className="mt-1 w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm" />
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-brand-text-secondary">Matter</label>
                <select value={triageFormData.suggestedMatter} onChange={e => handleFormChange('suggestedMatter', e.target.value)} className="mt-1 w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm appearance-none pr-8">
                  {matters.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  {!matters.some(m => m.name === triageFormData.suggestedMatter) && <option value={triageFormData.suggestedMatter}>{triageFormData.suggestedMatter}</option>}
                </select>
                <button onClick={handleSuggestAltMatters} disabled={isFetchingAltMatters} title="Suggest alternative matters" className="absolute right-1 bottom-1 p-1.5 rounded-md hover:bg-slate-600 text-brand-text-secondary transition-colors disabled:opacity-50">
                    {isFetchingAltMatters ? <Spinner size="small" /> : <WandIcon className="h-4 w-4 text-purple-400" />}
                </button>
              </div>
           </div>
           {alternativeMatters.length > 0 && (
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                 <h4 className="font-semibold text-sm text-brand-text mb-2 flex items-center"><LightBulbIcon className="h-4 w-4 mr-2 text-yellow-400" /> AI Matter Suggestions</h4>
                 <div className="space-y-2">
                    {alternativeMatters.map(alt => (
                        <button key={alt.matter} onClick={() => handleFormChange('suggestedMatter', alt.matter)} className="w-full text-left p-2 rounded-md bg-brand-primary hover:bg-brand-accent/20 border border-slate-600 hover:border-brand-accent transition-colors">
                            <div className="flex justify-between items-center">
                               <p className="font-semibold text-sm">{alt.matter}</p>
                               <span className={`text-xs px-2 py-0.5 rounded-full ${alt.confidence === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{alt.confidence}</span>
                            </div>
                            <p className="text-xs text-brand-text-secondary italic mt-1">{alt.justification}</p>
                        </button>
                    ))}
                 </div>
            </div>
           )}
            {(triageFormData.detailedBreakdown?.length ?? 0) > 0 && (
                 <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <label className="text-xs font-bold text-brand-text-secondary flex items-center gap-2 mb-2"><ClipboardDocumentListIcon className="h-4 w-4" /> AI-Generated Work Breakdown</label>
                    <ul className="mt-1 space-y-1 text-sm text-brand-text-secondary list-disc list-inside pl-2">
                        {triageFormData.detailedBreakdown?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                 </div>
            )}
             {justification && !overrideTriage && !justification.ruleAppliedMessage && (
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-sm text-brand-text mb-2 flex items-center"><LightBulbIcon className="h-4 w-4 mr-2 text-yellow-400" /> AI Reasoning</h4>
                <ul className="space-y-1.5 text-xs text-brand-text-secondary list-disc list-inside">
                  <li><strong>Matter:</strong> {justification.matter}</li>
                  <li><strong>Summary:</strong> {justification.description}</li>
                </ul>
              </div>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => onSelectEmail(null)} className="p-2.5 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors" title="Cancel">
              <XMarkIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleSubmit(false)} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-slate-600 text-white transition-colors">
              Save Draft
            </button>
            <button onClick={() => handleSubmit(true)} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">
              <PaperAirplaneIcon className="w-5 h-5" />
              Approve & Sync
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTasksView = () => (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-lg font-bold mb-3">Action Items ({filteredTasks.length}/{allTasks.length})</h3>
      <div className="flex space-x-1 bg-brand-primary p-1 rounded-lg mb-4">
        {(['open', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setTaskFilter(f)} className={`w-full text-center text-sm font-semibold capitalize px-3 py-1.5 rounded-md transition-colors ${taskFilter === f ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-slate-600'}`}>{f}</button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {filteredTasks.length > 0 ? filteredTasks.map(task => (
          <div key={task.id} className="bg-brand-primary p-3 rounded-lg flex items-start gap-3">
             <input type="checkbox" checked={task.completed} onChange={() => onToggleActionItem(task.entry.id, task.id)} className="mt-1 h-4 w-4 rounded bg-brand-secondary border-slate-600 text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-primary" />
             <div className="flex-1">
              <p className={`text-sm ${task.completed ? 'line-through text-brand-text-secondary' : 'text-brand-text'}`}>{task.text}</p>
              {task.entry.emailIds && task.entry.emailIds.length > 0 && <button onClick={() => onViewEmail(task.entry.emailIds![0])} className="text-xs text-brand-accent hover:underline mt-1">From: {task.entry.matter}</button>}
             </div>
          </div>
        )) : <p className="text-brand-text-secondary text-sm text-center pt-8">No tasks found for this filter.</p>}
      </div>
    </div>
  );

  const renderReviewView = () => (
    <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-3">
             <h3 className="text-lg font-bold">Review & Approve</h3>
              {pendingEntries.length > 0 && (
                <button onClick={onBulkSyncAllPending} className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">
                    Approve All ({pendingEntries.length})
                </button>
              )}
        </div>
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {pendingEntries.length > 0 ? pendingEntries.map(entry => (
          <BillableEntryCard 
            key={entry.id} 
            entry={entry} 
            onUpdate={onUpdateEntry} 
            matters={matters} 
            onViewEmail={onViewEmail} 
            onToggleActionItem={onToggleActionItem} 
            onSync={onSyncEntry}
            onRefineDescription={handleRefineDescription}
          />
        )) : 
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h4 className="font-semibold text-brand-text text-lg">All entries approved!</h4>
            <p className="text-sm mt-2 text-brand-text-secondary">Your history log is up to date.</p>
        </div>
        }
      </div>
    </div>
  );
  
  const renderHistoryView = () => {
      const historyIds = filteredHistory.map(e => e.id);
      const selectedHistoryIds = Array.from(selectedIds).filter(id => historyIds.includes(id));
      
      return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-lg font-bold">History Log</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-text-secondary">Show Archived</span>
                    <ToggleSwitch enabled={showArchived} setEnabled={setShowArchived} />
                 </div>
            </div>
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
            <input type="text" placeholder="Search history..." value={historySearchTerm} onChange={e => setHistorySearchTerm(e.target.value)} className="w-full bg-brand-primary border border-slate-600 rounded-md py-2 pl-10 pr-4 text-sm" />
          </div>
          
          {selectedHistoryIds.length > 0 && (
            <div className="mb-4 flex gap-2">
                <button onClick={() => onSetArchiveStatus(selectedHistoryIds, !showArchived)}
                    className="flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors">
                    {showArchived ? <ArrowUpOnSquareIcon className="h-5 w-5"/> : <ArchiveBoxIcon className="h-5 w-5"/>}
                    {showArchived ? 'Unarchive' : 'Archive'} ({selectedHistoryIds.length})
                </button>
            </div>
          )}

          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {filteredHistory.length > 0 ? (
                <div>
                     <div className="flex items-center px-3 py-2 border-b border-slate-700 mb-2">
                          <input type="checkbox"
                            className="h-4 w-4 rounded bg-brand-secondary border-slate-600 text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-secondary"
                            checked={historyIds.length > 0 && selectedHistoryIds.length === historyIds.length}
                            onChange={() => onToggleSelectAll(historyIds)}
                            aria-label="Select all"
                          />
                          <span className="ml-3 text-xs font-semibold text-brand-text-secondary">Select All</span>
                     </div>
                    {filteredHistory.map(entry => (
                      <div key={entry.id} className="flex gap-3 items-start p-1 hover:bg-brand-primary/50 rounded-lg">
                           <input type="checkbox"
                            className="h-4 w-4 mt-3 ml-2 rounded bg-brand-secondary border-slate-600 text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-secondary flex-shrink-0"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => onToggleSelection(entry.id)}
                            aria-labelledby={`entry-desc-${entry.id}`}
                           />
                           <div id={`entry-desc-${entry.id}`} className="flex-grow">
                             <BillableEntryCard 
                                entry={entry} 
                                onUpdate={onUpdateEntry} 
                                matters={matters} 
                                onViewEmail={onViewEmail} 
                                onToggleActionItem={onToggleActionItem} 
                                onUseAsTemplate={onUseAsTemplate} 
                                onSync={onSyncEntry}
                                onRefineDescription={handleRefineDescription}
                             />
                           </div>
                      </div>
                    ))}
                </div>
            ) : <p className="text-brand-text-secondary text-sm text-center pt-8">No processed entries found.</p>}
          </div>
        </div>
      );
  }

  const renderContent = () => {
    switch (activeView) {
      case InvoLexPanelView.Dashboard: return renderDashboardView();
      case InvoLexPanelView.Suggestions: return renderSuggestionsView();
      case InvoLexPanelView.Action: return renderTriageView();
      case InvoLexPanelView.Review: return renderReviewView();
      case InvoLexPanelView.Tasks: return renderTasksView();
      case InvoLexPanelView.History: return renderHistoryView();
      default: return renderDashboardView();
    }
  };

  const navOrder: InvoLexPanelView[] = [
    InvoLexPanelView.Dashboard,
    InvoLexPanelView.Suggestions,
    InvoLexPanelView.Action,
    InvoLexPanelView.Review,
    InvoLexPanelView.History,
  ];

  const navItems = {
      [InvoLexPanelView.Dashboard]: { icon: <HomeIcon />, label: "Dashboard", badge: 0 },
      [InvoLexPanelView.Suggestions]: { icon: <LightBulbIcon />, label: "Suggestions", badge: unseenSuggestions.length },
      [InvoLexPanelView.Action]: { icon: <PencilIcon />, label: "Triage", badge: 0 },
      [InvoLexPanelView.Review]: { icon: <ClipboardDocumentListIcon />, label: "Review", badge: pendingEntries.length },
      [InvoLexPanelView.History]: { icon: <ClockRewindIcon />, label: "History", badge: 0 },
      [InvoLexPanelView.Tasks]: { icon: <ClipboardDocumentCheckIcon />, label: "Tasks", badge: 0 } // Not in main nav for now
  }

  return (
    <div className="h-full flex flex-col bg-brand-secondary text-brand-text font-sans">
      <header className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          {!isCollapsed && <InvoLexLogo className="h-8 w-8 text-brand-accent"/>}
          {!isCollapsed && <h2 className="text-lg font-bold">InvoLex</h2>}
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && <button onClick={() => onOpenModal(ModalView.Analytics)} className="p-2 rounded-full hover:bg-slate-600 transition-colors" title="Analytics"><ChartBarIcon className="h-5 w-5" /></button>}
          {!isCollapsed && <button onClick={() => onOpenModal(ModalView.Settings)} className="p-2 rounded-full hover:bg-slate-600 transition-colors" title="Settings"><Cog6ToothIcon className="h-5 w-5" /></button>}
          
          <button onClick={onToggleCollapse} className="p-2 rounded-full hover:bg-slate-600 transition-colors" title={isCollapsed ? 'Expand panel' : 'Collapse panel'}>
            {isCollapsed ? <ChevronDoubleLeftIcon className="h-5 w-5" /> : <ChevronDoubleRightIcon className="h-5 w-5" />}
          </button>
        </div>
      </header>
      
      <main className={`flex-grow flex flex-col overflow-hidden ${isCollapsed ? 'hidden' : ''}`}>
        {renderContent()}
      </main>

      <nav className={`flex items-center justify-around p-2 border-t border-slate-700 bg-brand-secondary flex-shrink-0 ${isCollapsed ? 'hidden' : ''}`}>
        {navOrder.map(view => (
            <NavButton key={view} view={view} icon={navItems[view].icon} label={navItems[view].label} badgeCount={navItems[view].badge} />
        ))}
      </nav>
    </div>
  );
};

export default InvoLexPanel;

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BillableEntry, BillableEntryStatus, PracticeManagementTool, Email, NotificationType, ModalView, Correction, AIPreview, Matter, ActionItem, SuggestedEntry, User, EmailTriageResult, TriageStatus, InvoLexPanelView, BillingRule, BillingRuleCondition, BillingRuleActionType, BillingRuleConditionType, Notification, AIPersona } from './types';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import EmailDetailModal from './components/ui/EmailDetailModal';
import ManualTimeEntryModal from './components/ui/ManualTimeEntryModal';
import { supabaseClient } from './services/supabase';
import { aiService } from './services/aiService';
import { emailService } from './services/emailService';
import { useNotification, NotificationProvider } from './contexts/NotificationContext';
import { EnvelopeIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ArrowUturnLeftIcon } from './components/icons/Icons';
import InvoLexPanel from './components/InvoLexPanel';
import Modal from './components/ui/Modal';
import { useAuth } from './contexts/AuthProvider';
import AuthPage from './components/auth/AuthPage';
import Spinner from './components/ui/Spinner';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import TwoFactorChallengePage from './components/auth/TwoFactorChallengePage';
import Sidebar from './components/Sidebar';
import ReplyView from './components/ReplyView';
import ComposeView from './components/ComposeView';

const Resizer: React.FC<{ onMouseDown: (event: React.MouseEvent) => void; className?: string;}> = ({ onMouseDown, className = '' }) => (
  <div className={`w-1.5 cursor-col-resize transition-colors duration-200 flex-shrink-0 ${className}`} onMouseDown={onMouseDown} />
);

const AppContent: React.FC = () => {
  const { session, user, loading, userState } = useAuth();
  const { addNotification } = useNotification();
  const [dataLoading, setDataLoading] = useState(true);

  // App State
  const [billableEntries, setBillableEntries] = useState<BillableEntry[]>([]);
  const [externalEntries, setExternalEntries] = useState<BillableEntry[]>([]);
  const [activeIntegration, setActiveIntegration] = useState<PracticeManagementTool | null>(PracticeManagementTool.Clio);
  const [isAutoPilotEnabled, setIsAutoPilotEnabled] = useState(false);
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState(true);
  const [autoSyncThreshold, setAutoSyncThreshold] = useState(0.95);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [defaultRate, setDefaultRate] = useState(350);
  const [aiPersona, setAiPersona] = useState<AIPersona>(AIPersona.NeutralAssociate);
  const [emailProvider, setEmailProvider] = useState<'mock' | 'gmail' | 'outlook'>('mock');
  const [emails, setEmails] = useState<Email[]>([]);
  
  // UI State
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [modalView, setModalView] = useState<ModalView>(ModalView.None);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [selectedEmailForDetail, setSelectedEmailForDetail] = useState<Email | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set<string>());
  const [suggestedEntries, setSuggestedEntries] = useState<SuggestedEntry[]>([]);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(new Set<string>());
  const [templateForGen, setTemplateForGen] = useState<BillableEntry | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<EmailTriageResult | null>(null);
  const [processedEmailIds, setProcessedEmailIds] = useState(new Set<string>());
  const [reviewingSuggestion, setReviewingSuggestion] = useState<SuggestedEntry | null>(null);
  
  // Reply & Compose State
  const [replyingToEmail, setReplyingToEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // AI Rule Suggestion State
  const [ruleSuggestionForEdit, setRuleSuggestionForEdit] = useState<{ rule: BillingRule; matterName: string } | null>(null);
  const [lastRuleSuggestion, setLastRuleSuggestion] = useState<string | null>(null);
  
  // Panel resizing state
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [invoLexPanelWidth, setInvoLexPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState<'sidebar' | 'invoLex' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInvoLexPanelCollapsed, setIsInvoLexPanelCollapsed] = useState(false);
  
  const SIDEBAR_COLLAPSED_WIDTH = 68;
  const INVOLEX_PANEL_COLLAPSED_WIDTH = 68;

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);
  const toggleInvoLexPanel = useCallback(() => setIsInvoLexPanelCollapsed(prev => !prev), []);

  const allEntries = useMemo(() => {
    return [...billableEntries, ...externalEntries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [billableEntries, externalEntries]);

  // Data loading effect
  useEffect(() => {
    async function loadUserData() {
      if (user) {
        setDataLoading(true);
        const [
          userEntries,
          userExternalEntries,
          userMatters,
          userCorrections,
          userSettings
        ] = await Promise.all([
          supabaseClient.data.getBillableEntries(user.id),
          supabaseClient.data.fetchExternalEntries(user.id, activeIntegration || PracticeManagementTool.Clio),
          supabaseClient.data.getMatters(user.id),
          supabaseClient.data.getCorrections(user.id),
          supabaseClient.data.getSettings(user.id)
        ]);
        
        setBillableEntries(userEntries);
        setExternalEntries(userExternalEntries);
        setMatters(userMatters);
        setCorrections(userCorrections);

        if (userSettings) {
          setActiveIntegration(userSettings.activeIntegration);
          setIsAutoPilotEnabled(userSettings.isAutoPilotEnabled);
          setIsPersonalizationEnabled(userSettings.isPersonalizationEnabled);
          setDefaultRate(userSettings.defaultRate);
          setAutoSyncThreshold(userSettings.autoSyncThreshold ?? 0.95);
          setAiPersona(userSettings.aiPersona || AIPersona.NeutralAssociate);
          setEmailProvider(userSettings.emailProvider || 'mock');
        }
        setDataLoading(false);
      }
    }
    if (userState === 'authenticated') {
      loadUserData();
    } else {
      setDataLoading(false);
    }
  }, [user, userState, activeIntegration]);

  // Fetch emails when provider changes
  useEffect(() => {
    async function getEmails() {
        setDataLoading(true);
        const fetchedEmails = await emailService.fetchEmails(emailProvider);
        setEmails(fetchedEmails);
        if (!selectedEmail || !fetchedEmails.some(e => e.id === selectedEmail.id)) {
            setSelectedEmail(fetchedEmails.length > 0 ? fetchedEmails[0] : null);
        }
        setDataLoading(false);
    }
    if (userState === 'authenticated') {
       getEmails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailProvider, userState]);
  
  // Persist settings changes
  const handleSetSettings = useCallback(async (setter: Function, value: any, fieldName: string) => {
    if (!user) return;
    setter(value);
    
    const settingsUpdate = {
        activeIntegration,
        isAutoPilotEnabled,
        isPersonalizationEnabled,
        defaultRate,
        autoSyncThreshold,
        aiPersona,
        emailProvider,
        [fieldName]: value
    };

    setTimeout(async () => {
        if (!user) return;
        await supabaseClient.data.saveSettings(user.id, settingsUpdate);
        addNotification('Settings saved.', NotificationType.Success);
    }, 1000); // Debounce saving
  }, [user, activeIntegration, isAutoPilotEnabled, isPersonalizationEnabled, defaultRate, autoSyncThreshold, aiPersona, emailProvider, addNotification]);


  const pendingEntries = useMemo(() => allEntries.filter(e => e.status === BillableEntryStatus.Pending), [allEntries]);

  const todaysBillableHours = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allEntries
      .filter(entry => entry.date.startsWith(today) && entry.status === BillableEntryStatus.Synced)
      .reduce((total, entry) => total + entry.hours, 0);
  }, [allEntries]);

  const getRateForMatter = useCallback((matterName: string): number => {
    const matter = matters.find(m => m.name === matterName);
    return matter ? matter.rate : defaultRate;
  }, [matters, defaultRate]);
  
  const handleSyncEntries = useCallback(async (entryIds: string[]): Promise<void> => {
    if (!user || entryIds.length === 0) return;
    
    if (!activeIntegration) {
      addNotification('Please connect to a Practice Management software in Settings first.', NotificationType.Error);
      return;
    }

    setBillableEntries(prev => prev.map(entry => 
      entryIds.includes(entry.id) ? { ...entry, status: BillableEntryStatus.Generating } : entry
    ));

    const syncPromises = entryIds.map(id => supabaseClient.data.syncEntry(user.id, id, activeIntegration));
    const results = await Promise.all(syncPromises);

    const successfulSyncs = results.filter(e => e.status === BillableEntryStatus.Synced);
    const failedSyncs = results.filter(e => e.status === BillableEntryStatus.Error);

    setBillableEntries(prev => {
        const entryMap = new Map(prev.map(e => [e.id, e]));
        results.forEach(res => entryMap.set(res.id, res));
        return Array.from(entryMap.values());
    });
    
    if (successfulSyncs.length > 0) {
        const message = successfulSyncs.length === 1 
            ? `Entry successfully synced to ${activeIntegration}.`
            : `${successfulSyncs.length} entries successfully synced to ${activeIntegration}.`;
        addNotification(message, NotificationType.Success);
    }
    
    if (failedSyncs.length > 0) {
        const message = failedSyncs.length === 1
            ? `1 entry failed to sync.`
            : `${failedSyncs.length} entries failed to sync.`;
        addNotification(message, NotificationType.Error);
    }

  }, [activeIntegration, addNotification, user]);


  const handleCreateEntryFromForm = useCallback(async (formData: { emailIds: string[]; description: string; hours: number; matter: string; actionItems?: string[]; detailedBreakdown?: string[]; }, asDraft: boolean = true): Promise<BillableEntry | null> => {
    if (!user) return null;
    const { emailIds, description, hours, matter, actionItems, detailedBreakdown } = formData;
    
    if (emailIds && emailIds.length > 0) {
        const existingEntry = billableEntries.find(entry => entry.emailIds?.some(id => emailIds.includes(id)));
        if (existingEntry) {
          addNotification('An entry for one of these emails already exists.', NotificationType.Info);
          return null;
        }
    }
    
    const newEntryData = {
      emailIds,
      description,
      hours,
      matter,
      actionItems,
      detailedBreakdown,
    };
    
    const newEntry = await supabaseClient.data.addBillableEntry(user.id, newEntryData, getRateForMatter(matter), activeIntegration || PracticeManagementTool.Clio);
    
    setBillableEntries(prev => [newEntry, ...prev]);
    if(asDraft) {
      addNotification('Billable entry saved as draft.', NotificationType.Success);
    }
    return newEntry;
  }, [billableEntries, activeIntegration, addNotification, getRateForMatter, user]);
  
  const handleCreateAndSyncEntry = useCallback(async (formData: { emailIds: string[]; description: string; hours: number; matter: string; actionItems?: string[]; detailedBreakdown?: string[]; }) => {
    if (!activeIntegration) {
      addNotification('Please connect to a Practice Management software in Settings first.', NotificationType.Error);
      return;
    }
    const newEntry = await handleCreateEntryFromForm(formData, false);
    if (newEntry) {
        addNotification(`Entry for "${newEntry.matter}" created. Syncing...`, NotificationType.Info);
        await handleSyncEntries([newEntry.id]);
    }
  }, [activeIntegration, handleCreateEntryFromForm, handleSyncEntries, addNotification]);

  const handleCreateManualEntry = useCallback(async (formData: { description: string; hours: number; matter: string; date: string; }) => {
    if (!user) return null;
    const { description, hours, matter, date } = formData;
    
    const newEntryData = {
      description,
      hours,
      matter,
      date,
    };
    
    const newEntry = await supabaseClient.data.addBillableEntry(user.id, newEntryData, getRateForMatter(matter), activeIntegration || PracticeManagementTool.Clio);
    
    setBillableEntries(prev => [newEntry, ...prev]);
    addNotification('Manual entry saved as draft.', NotificationType.Success);
    setIsManualEntryModalOpen(false); // Close modal on success
    return newEntry;
  }, [activeIntegration, addNotification, getRateForMatter, user]);

  const handleAutoScan = useCallback(async () => {
    if (!user) return;
    console.log("Auto-pilot: Scanning for new billable entries...");
    const currentProcessedIds = new Set([
        ...billableEntries.flatMap(e => e.emailIds || []),
        ...Array.from(processedEmailIds),
    ]);
    const emailsToScan = emails.filter(e => !currentProcessedIds.has(e.id));
    
    if (emailsToScan.length === 0) return;

    try {
        const newEntriesData = await aiService.generateBillableEntriesFromEmails(emailsToScan, matters, isPersonalizationEnabled ? corrections : []);
        if (newEntriesData.length === 0) return;

        const newEntries = await Promise.all(newEntriesData.map(entryInfo =>
            supabaseClient.data.addBillableEntry(user!.id, { ...entryInfo, emailIds: [entryInfo.emailId] }, getRateForMatter(entryInfo.suggestedMatter), activeIntegration || PracticeManagementTool.Clio, true)
        ));
        
        setBillableEntries(prev => [...newEntries, ...prev]);
        setProcessedEmailIds(prev => new Set([...Array.from(prev), ...newEntries.flatMap(e => e.emailIds || [])]));

        const entriesToSync = newEntries.filter((entry, index) => {
            const score = newEntriesData[index].confidenceScore;
            return isAutoPilotEnabled && score && score >= autoSyncThreshold;
        });

        const draftedCount = newEntries.length - entriesToSync.length;

        if (draftedCount > 0) {
            addNotification(`Auto-Pilot created ${draftedCount} new draft${draftedCount > 1 ? 's' : ''}.`, NotificationType.Info);
        }

        if (entriesToSync.length > 0) {
            addNotification(`Auto-Pilot is syncing ${entriesToSync.length} high-confidence entr${entriesToSync.length > 1 ? 'ies' : 'y'}.`, NotificationType.Info);
            await handleSyncEntries(entriesToSync.map(e => e.id));
        }
    } catch (error) {
        console.error("Auto-pilot scan failed:", error);
    }
  }, [user, billableEntries, processedEmailIds, matters, isPersonalizationEnabled, corrections, getRateForMatter, activeIntegration, addNotification, isAutoPilotEnabled, autoSyncThreshold, handleSyncEntries, emails]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isAutoPilotEnabled && user) {
      handleAutoScan();
      intervalId = window.setInterval(handleAutoScan, 30000); 
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoPilotEnabled, handleAutoScan, user]);
  
  const checkForRuleSuggestions = useCallback(async (currentCorrections: Correction[]) => {
    if (currentCorrections.length < 3) return; // Don't bother calling the AI

    const allRules = matters.flatMap(m => m.billingRules || []);
    const suggestion = await aiService.analyzeCorrectionsForRules(currentCorrections, allRules, matters);

    if (suggestion) {
      // Avoid re-notifying about the same rule suggestion
      const suggestionKey = JSON.stringify(suggestion.rule);
      if (suggestionKey === lastRuleSuggestion) return;
      setLastRuleSuggestion(suggestionKey);

      addNotification(suggestion.justification, NotificationType.Info, {
        label: "Create Rule",
        onClick: () => {
          setRuleSuggestionForEdit({ rule: suggestion.rule, matterName: suggestion.targetMatterName });
          setModalView(ModalView.Settings);
        },
      });
    }
  }, [matters, addNotification, lastRuleSuggestion]);

  const handleUpdateEntry = useCallback(async (originalEntry: BillableEntry, updatedEntryData: BillableEntry) => {
    if (!user) return;
    let finalEntry = { ...updatedEntryData };
    
    if (originalEntry.matter !== finalEntry.matter) {
      finalEntry.rate = getRateForMatter(finalEntry.matter);
    }
    
    let sourceEmailBody: string | null = null;
    if (originalEntry.emailIds && originalEntry.emailIds.length > 0) {
        const sourceEmail = emails.find(e => e.id === originalEntry.emailIds![0]);
        if (sourceEmail) {
            sourceEmailBody = sourceEmail.body;
        }
    }

    const updatedEntry = await supabaseClient.data.updateBillableEntry(
        user.id, 
        finalEntry, 
        originalEntry.description,
        sourceEmailBody
    );

    setBillableEntries(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
    
    if (isPersonalizationEnabled && originalEntry.description !== updatedEntry.description) {
        addNotification("Thanks for the feedback! I'll learn from that.", NotificationType.Info);
        const newCorrections = await supabaseClient.data.getCorrections(user.id);
        setCorrections(newCorrections);
        checkForRuleSuggestions(newCorrections);
    }
  }, [user, getRateForMatter, emails, isPersonalizationEnabled, addNotification, checkForRuleSuggestions]);
  
  const handleToggleActionItem = useCallback(async (entryId: string, actionItemId: string) => {
    if (!user) return;
    const entry = billableEntries.find(e => e.id === entryId);
    if (!entry) return;

    const newActionItems = entry.actionItems?.map(item =>
        item.id === actionItemId ? { ...item, completed: !item.completed } : item
    );
    const updatedEntry = await supabaseClient.data.updateBillableEntry(user.id, {...entry, actionItems: newActionItems});
    setBillableEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  }, [user, billableEntries]);


  const handleViewEmail = useCallback((emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (email) setSelectedEmailForDetail(email);
  }, [emails]);
  
  const handleBulkSyncAllPending = useCallback(async () => {
    const idsToSync = pendingEntries.map(e => e.id);
    if (idsToSync.length > 0) {
      await handleSyncEntries(idsToSync);
    } else {
      addNotification("No pending entries to sync.", NotificationType.Info);
    }
  }, [pendingEntries, handleSyncEntries, addNotification]);


  const handleBulkSyncAutoPilot = useCallback(async () => {
    if (!activeIntegration) {
      addNotification('Please connect to a Practice Management software in Settings first.', NotificationType.Error);
      return;
    }
    const autoPilotEntriesToSync = pendingEntries.filter(e => e.autoGenerated);
    const idsToSync = autoPilotEntriesToSync.map(e => e.id);
    
    if (idsToSync.length === 0) {
        addNotification('No Auto-Pilot entries to sync.', NotificationType.Info);
        return;
    }

    await handleSyncEntries(idsToSync);
  }, [pendingEntries, handleSyncEntries, addNotification, activeIntegration]);
  

  const applyBillingRules = useCallback((preview: AIPreview, sourceEmails: Email[], matters: Matter[]): { modifiedPreview: AIPreview, action: 'AUTO_SYNC' | 'IGNORE' | 'STANDARD' } => {
    const matter = matters.find(m => m.name === preview.suggestedMatter);
    if (!matter || !matter.billingRules || matter.billingRules.length === 0) {
        return { modifiedPreview: preview, action: 'STANDARD' };
    }

    let modifiedPreview = { ...preview };
    let action: 'AUTO_SYNC' | 'IGNORE' | 'STANDARD' = 'STANDARD';

    const checkCondition = (condition: BillingRuleCondition): boolean => {
        const value = condition.value.toLowerCase();
        return sourceEmails.some(email => {
            switch (condition.type) {
                case BillingRuleConditionType.SENDER_DOMAIN_IS:
                    const domain = email.sender.split('@')[1]?.replace('>', '');
                    return domain?.toLowerCase() === value;
                case BillingRuleConditionType.SUBJECT_CONTAINS:
                    return email.subject.toLowerCase().includes(value);
                case BillingRuleConditionType.BODY_CONTAINS:
                    return email.body.toLowerCase().includes(value);
                default:
                    return false;
            }
        });
    };

    // Find the first rule where all conditions are met
    const matchedRule = matter.billingRules.find(rule => 
        rule.conditions.every(checkCondition)
    );

    if (matchedRule) {
        const justification = {
            ...(modifiedPreview.justification || { matter: '', description: '' })
        };
        
        switch (matchedRule.actionType) {
            case BillingRuleActionType.IGNORE_SENDER_DOMAIN:
                 justification.ruleAppliedMessage = `Ignored based on domain rule: ${matchedRule.actionValue}`;
                 action = 'IGNORE';
                 break;
            case BillingRuleActionType.ROUND_UP_HOURS:
                const increment = Number(matchedRule.actionValue);
                if (modifiedPreview.suggestedHours && increment > 0) {
                    modifiedPreview.suggestedHours = Math.ceil(modifiedPreview.suggestedHours / increment) * increment;
                    justification.ruleAppliedMessage = `Hours rounded up to nearest ${increment} by rule.`;
                }
                break;
            case BillingRuleActionType.SET_FIXED_HOURS:
                const fixedHours = Number(matchedRule.actionValue);
                if (fixedHours > 0) {
                    modifiedPreview.suggestedHours = fixedHours;
                    justification.ruleAppliedMessage = `Hours set to ${fixedHours} by rule.`;
                }
                break;
            case BillingRuleActionType.AUTO_APPROVE_SYNC:
                justification.ruleAppliedMessage = `This entry will be automatically approved and synced based on your rules.`;
                action = 'AUTO_SYNC';
                break;
        }
        modifiedPreview.justification = justification;
    }

    return { modifiedPreview, action };
  }, []);


  const handleScanForSuggestions = useCallback(async () => {
    if (!user) return;
    const currentProcessedIds = new Set([
        ...allEntries.flatMap(e => e.emailIds || []),
        ...Array.from(dismissedSuggestionIds),
        ...Array.from(processedEmailIds),
    ]);

    const emailsToScan = emails.filter(e => !currentProcessedIds.has(e.id));
    if (emailsToScan.length === 0) {
        if (suggestedEntries.length === 0) {
           addNotification('No new billable email suggestions found.', NotificationType.Info);
        }
        return;
    }

    const results = await aiService.groupAndSummarizeEmails(emailsToScan, matters, corrections, externalEntries);

    const newSuggestions: SuggestedEntry[] = [];
    const autoSyncedEntries: BillableEntry[] = [];
    let ignoredCount = 0;

    for (const result of results) {
        const sourceEmails = result.emailIds.map(id => emails.find(e => e.id === id)).filter((e): e is Email => e !== undefined);
        if (sourceEmails.length === 0) continue;
        
        const { modifiedPreview, action } = applyBillingRules(result.preview, sourceEmails, matters);
        
        const entryData = {
            emailIds: result.emailIds,
            description: modifiedPreview.description,
            hours: modifiedPreview.suggestedHours || 0.3,
            matter: modifiedPreview.suggestedMatter,
            actionItems: modifiedPreview.actionItems || [],
            detailedBreakdown: modifiedPreview.detailedBreakdown || [],
        };
        
        let processed = false;

        if (action === 'AUTO_SYNC') {
            const newEntry = await supabaseClient.data.addBillableEntry(user.id, entryData, getRateForMatter(entryData.matter), activeIntegration || PracticeManagementTool.Clio);
            autoSyncedEntries.push(newEntry);
            addNotification(`Entry for "${entryData.matter}" auto-synced by rule.`, NotificationType.Success);
            processed = true;
        } else if (action === 'IGNORE') {
            ignoredCount++;
            setDismissedSuggestionIds(prev => new Set([...Array.from(prev), ...result.emailIds]));
            processed = true;
        } else if (isAutoPilotEnabled && modifiedPreview.confidenceScore && modifiedPreview.confidenceScore >= autoSyncThreshold) {
            const newEntry = await supabaseClient.data.addBillableEntry(user.id, entryData, getRateForMatter(entryData.matter), activeIntegration || PracticeManagementTool.Clio);
            autoSyncedEntries.push(newEntry);
            const confidencePercent = Math.round(modifiedPreview.confidenceScore * 100);
            addNotification(`Entry for "${entryData.matter}" auto-synced by high AI confidence (${confidencePercent}%).`, NotificationType.Success);
            processed = true;
        }

        if (processed) {
            setProcessedEmailIds(prev => new Set([...Array.from(prev), ...result.emailIds]));
        } else {
            newSuggestions.push({ ...result, emails: sourceEmails, preview: modifiedPreview });
        }
    }

    if (autoSyncedEntries.length > 0) {
        setBillableEntries(prev => [...autoSyncedEntries, ...prev]);
        await handleSyncEntries(autoSyncedEntries.map(e => e.id));
    }

    if (newSuggestions.length > 0) {
      setSuggestedEntries(prev => [...newSuggestions, ...prev]);
      addNotification(`Found ${newSuggestions.length} new suggestion group${newSuggestions.length > 1 ? 's' : ''}.`, NotificationType.Info);
    } else if(autoSyncedEntries.length === 0 && ignoredCount === 0) {
      addNotification('No new billable email suggestions found.', NotificationType.Info);
    }
  }, [user, allEntries, dismissedSuggestionIds, addNotification, suggestedEntries.length, processedEmailIds, matters, corrections, applyBillingRules, getRateForMatter, activeIntegration, handleSyncEntries, isAutoPilotEnabled, autoSyncThreshold, externalEntries, emails]);
  
  // Initial scan on load
  useEffect(() => {
    if (userState === 'authenticated' && !dataLoading && emails.length > 0) {
      handleScanForSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState, dataLoading, emails]);
  
  const handleDismissSuggestion = useCallback((emailIds: string[]) => {
    setDismissedSuggestionIds(prev => new Set([...Array.from(prev), ...emailIds]));
    setSuggestedEntries(prev => prev.filter(s => !s.emailIds.some(id => emailIds.includes(id))));
    addNotification('Suggestion dismissed.', NotificationType.Info);
  }, [addNotification]);

  const handleQuickAddSuggestion = useCallback(async (suggestion: SuggestedEntry) => {
    if (!user || processingSuggestionId) return;

    const keyId = suggestion.emailIds.join(',');
    setProcessingSuggestionId(keyId);

    try {
        const newEntryData = {
            emailIds: suggestion.emailIds,
            description: suggestion.preview.description,
            hours: suggestion.preview.suggestedHours || 0.3,
            matter: suggestion.preview.suggestedMatter || (matters.length > 0 ? matters[0].name : 'Uncategorized'),
            actionItems: suggestion.preview.actionItems || [],
            detailedBreakdown: suggestion.preview.detailedBreakdown || [],
        };

        const newEntry = await supabaseClient.data.addBillableEntry(user.id, newEntryData, getRateForMatter(newEntryData.matter), activeIntegration || PracticeManagementTool.Clio);
        setBillableEntries(prev => [newEntry, ...prev]);
        
        handleDismissSuggestion(suggestion.emailIds);
        addNotification(`Draft created for "${newEntry.matter}".`, NotificationType.Success);
    } catch (error) {
        console.error("Quick add failed:", error);
        addNotification("Failed to create draft from suggestion.", NotificationType.Error);
    } finally {
        setProcessingSuggestionId(null);
    }
  }, [user, processingSuggestionId, matters, addNotification, getRateForMatter, activeIntegration, handleDismissSuggestion]);
  
  const handleUseAsTemplate = useCallback((entry: BillableEntry) => {
    if (!selectedEmail) {
        const availableEmail = emails.find(e => !allEntries.some(be => be.emailIds?.includes(e.id)));
        setSelectedEmail(availableEmail || (emails.length > 0 ? emails[0] : null));
    }
    setTemplateForGen(entry);
    addNotification(`Using entry for "${entry.matter}" as a template.`, NotificationType.Info);
  }, [selectedEmail, addNotification, allEntries, emails]);

  const handleMarkAsProcessedAndNext = useCallback((emailId: string) => {
    const newProcessedIds = new Set(processedEmailIds).add(emailId);
    setProcessedEmailIds(newProcessedIds);

    const currentEntryEmailIds = new Set(allEntries.flatMap(e => e.emailIds || []));
    const allProcessedIds = new Set([...newProcessedIds, ...currentEntryEmailIds]);

    const currentIndex = emails.findIndex(e => e.id === emailId);
    let nextEmail: Email | null = null;

    // Search after current index
    for (let i = currentIndex + 1; i < emails.length; i++) {
        if (!allProcessedIds.has(emails[i].id)) {
            nextEmail = emails[i];
            break;
        }
    }
    // If not found, search from the beginning
    if (!nextEmail) {
        for (let i = 0; i < currentIndex; i++) {
            if (!allProcessedIds.has(emails[i].id)) {
                nextEmail = emails[i];
                break;
            }
        }
    }
    setSelectedEmail(nextEmail);
    if (!nextEmail) {
        addNotification("Inbox processed!", NotificationType.Success);
    }
  }, [processedEmailIds, allEntries, addNotification, emails]);

  // AI Triage Effect
  useEffect(() => {
    const handleTriage = async () => {
        if (!selectedEmail || !user || replyingToEmail || isComposing) { // Don't triage if replying or composing
            setTriageResult(null);
            return;
        }

        const existingEntry = billableEntries.find(entry => entry.emailIds?.includes(selectedEmail.id));
        if (existingEntry) {
            setTriageResult(null); // Don't triage if an entry exists
            return;
        }

        setTriageResult({ status: TriageStatus.ANALYZING });
        try {
            const aiResult = await aiService.triageEmail(selectedEmail.body, matters, isPersonalizationEnabled ? corrections : [], externalEntries);
            
            if (aiResult.status === TriageStatus.BILLABLE && aiResult.preview) {
                const { modifiedPreview, action } = applyBillingRules(aiResult.preview, [selectedEmail], matters);
                
                const entryData = {
                  emailIds: [selectedEmail.id], description: modifiedPreview.description, hours: modifiedPreview.suggestedHours || 0.2,
                  matter: modifiedPreview.suggestedMatter, actionItems: modifiedPreview.actionItems, detailedBreakdown: modifiedPreview.detailedBreakdown,
                };

                if (action === 'AUTO_SYNC') {
                    await handleCreateAndSyncEntry(entryData);
                    setTriageResult({ status: TriageStatus.AUTO_PROCESSED, reason: `Entry auto-synced by rule: ${modifiedPreview.justification?.ruleAppliedMessage}` });
                    handleMarkAsProcessedAndNext(selectedEmail.id);
                    return;
                } else if (action === 'IGNORE') {
                    setTriageResult({ status: TriageStatus.NOT_BILLABLE, reason: `Ignored by rule: ${modifiedPreview.justification?.ruleAppliedMessage}` });
                    return;
                } else if (isAutoPilotEnabled && modifiedPreview.confidenceScore && modifiedPreview.confidenceScore >= autoSyncThreshold) {
                    await handleCreateAndSyncEntry(entryData);
                    const confidencePercent = Math.round(modifiedPreview.confidenceScore * 100);
                    const thresholdPercent = Math.round(autoSyncThreshold * 100);
                    setTriageResult({ status: TriageStatus.AUTO_PROCESSED, reason: `Entry auto-synced by AI confidence (${confidencePercent}% > ${thresholdPercent}%).` });
                    handleMarkAsProcessedAndNext(selectedEmail.id);
                    return;
                }

                setTriageResult({ ...aiResult, preview: modifiedPreview });
            } else {
                setTriageResult(aiResult);
            }
        } catch (error) {
            console.error("Error during email triage:", error);
            addNotification("Could not analyze email.", NotificationType.Error);
            setTriageResult({ status: TriageStatus.NOT_BILLABLE, reason: "An error occurred during analysis." });
        }
    };

    if (reviewingSuggestion) {
      // Don't run triage if we're reviewing a pre-analyzed suggestion
      return;
    }

    handleTriage();
  }, [selectedEmail, billableEntries, user, matters, isPersonalizationEnabled, corrections, addNotification, reviewingSuggestion, applyBillingRules, handleCreateAndSyncEntry, handleMarkAsProcessedAndNext, replyingToEmail, isComposing, isAutoPilotEnabled, autoSyncThreshold, externalEntries]);
  
    const handleToggleSelection = useCallback((id: string) => {
        setSelectedEntryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleToggleSelectAll = useCallback((entryIds: string[]) => {
        setSelectedEntryIds(prev => {
            const currentSelectedInView = Array.from(prev).filter(id => entryIds.includes(id));
            if (currentSelectedInView.length === entryIds.length) {
                // Deselect all visible
                const newSet = new Set(prev);
                entryIds.forEach(id => newSet.delete(id));
                return newSet;
            } else {
                // Select all visible
                return new Set([...prev, ...entryIds]);
            }
        });
    }, []);
    
    const handleSetArchiveStatus = useCallback(async (entryIds: string[], isArchived: boolean) => {
        if (!user || entryIds.length === 0) return;

        const updatedEntries = await supabaseClient.data.setArchiveStatus(user.id, entryIds, isArchived);

        setBillableEntries(prev => {
            const entryMap = new Map(prev.map(e => [e.id, e]));
            updatedEntries.forEach(res => entryMap.set(res.id, res));
            return Array.from(entryMap.values());
        });
        
        setSelectedEntryIds(prev => {
            const newSet = new Set(prev);
            entryIds.forEach(id => newSet.delete(id));
            return newSet;
        });
        
        const message = isArchived ? 'archived' : 'unarchived';
        addNotification(`${entryIds.length} entr${entryIds.length > 1 ? 'ies' : 'y'} ${message}.`, NotificationType.Info);
    }, [user, addNotification]);

  // --- Reply & Compose Logic ---
  const handleStartReply = useCallback((email: Email) => {
    setIsComposing(false); // Ensure compose mode is off
    setSelectedEmail(email);
    setReplyingToEmail(email);
    setReplyText(''); // Clear old reply text
  }, []);

  const handleFinishReply = useCallback(() => {
    setReplyText('');
    setReplyingToEmail(null);
  }, []);
  
  const handleStartCompose = useCallback(() => {
    setSelectedEmail(null);
    setReplyingToEmail(null);
    setIsComposing(true);
    setComposeData({ to: '', subject: '', body: '' });
  }, []);

  const handleFinishCompose = useCallback(() => {
    setIsComposing(false);
    setComposeData({ to: '', subject: '', body: '' });
  }, []);
  
  const handleAiEmailAction = useCallback(async (
    action: 'draft' | 'refine',
    instruction: string,
    context: { emailBody: string | null, currentDraft: string | null }
  ) => {
    setIsGeneratingDraft(true);
    try {
        const draft = await aiService.generateOrRefineEmailDraft({
            action,
            instruction,
            persona: aiPersona,
            emailBody: context.emailBody,
            currentDraft: context.currentDraft,
            matters,
        });
        if (replyingToEmail) {
            setReplyText(draft);
        } else if (isComposing) {
            setComposeData(prev => ({...prev, body: draft}));
        }
    } catch (error) {
        console.error("Failed AI email action:", error);
        addNotification("Could not perform AI email action.", NotificationType.Error);
    } finally {
        setIsGeneratingDraft(false);
    }
  }, [matters, replyingToEmail, isComposing, addNotification, aiPersona]);


  // Resizing logic
  const handleResizeStart = useCallback((resizer: 'sidebar' | 'invoLex') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(resizer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      if (isResizing === 'sidebar') setSidebarWidth(Math.max(200, Math.min(e.clientX, 400)));
      else if (isResizing === 'invoLex') setInvoLexPanelWidth(Math.max(350, Math.min(window.innerWidth - e.clientX, 800)));
    };
    const handleMouseUp = () => setIsResizing(null);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  // Render loading states
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-brand-primary"><Spinner size="large" /></div>;
  }
  
  if (userState === 'unauthenticated') {
    return <AuthPage />;
  }
  
  if (userState === 'unverified') {
    return <VerifyEmailPage />;
  }

  if (userState === 'awaiting-2fa') {
    return <TwoFactorChallengePage />;
  }

  if (dataLoading) {
    return <div className="flex items-center justify-center h-screen bg-brand-primary"><Spinner size="large" /></div>;
  }

  const renderModalContent = () => {
    switch (modalView) {
      case ModalView.Analytics:
        return <AnalyticsView billableEntries={allEntries} />;
      case ModalView.Settings:
        return <SettingsView 
                 user={user!}
                 session={session!}
                 activeIntegration={activeIntegration} 
                 setActiveIntegration={(val) => handleSetSettings(setActiveIntegration, val, 'activeIntegration')}
                 isAutoPilotEnabled={isAutoPilotEnabled}
                 setIsAutoPilotEnabled={(val) => handleSetSettings(setIsAutoPilotEnabled, val, 'isAutoPilotEnabled')}
                 isPersonalizationEnabled={isPersonalizationEnabled}
                 setIsPersonalizationEnabled={(val) => handleSetSettings(setIsPersonalizationEnabled, val, 'isPersonalizationEnabled')}
                 autoSyncThreshold={autoSyncThreshold}
                 setAutoSyncThreshold={(val) => handleSetSettings(setAutoSyncThreshold, val, 'autoSyncThreshold')}
                 aiPersona={aiPersona}
                 setAiPersona={(val) => handleSetSettings(setAiPersona, val, 'aiPersona')}
                 emailProvider={emailProvider}
                 setEmailProvider={(val) => handleSetSettings(setEmailProvider, val, 'emailProvider')}
                 matters={matters}
                 setMatters={(val) => {
                    if(!user) return;
                    const newMatters = typeof val === 'function' ? val(matters) : val;
                    setMatters(newMatters);
                    supabaseClient.data.saveMatters(user.id, newMatters);
                 }}
                 defaultRate={defaultRate}
                 setDefaultRate={(val) => handleSetSettings(setDefaultRate, val, 'defaultRate')}
                 initialRuleToEdit={ruleSuggestionForEdit}
                 onClearInitialRule={() => setRuleSuggestionForEdit(null)}
               />;
      default: return null;
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds > 86400) return new Date(date).toLocaleDateString();
    if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds > 60) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds)}s ago`;
  };

  const isEmailProcessed = (emailId: string) => {
    return processedEmailIds.has(emailId) || allEntries.some(e => e.emailIds?.includes(emailId));
  }

  const getEmailUIState = (email: Email) => {
      if (isEmailProcessed(email.id)) return 'processed';
      if (selectedEmail?.id === email.id && triageResult?.status === TriageStatus.DUPLICATE_SUSPECTED) return 'duplicate';
      return 'default';
  }

  return (
    <div className="flex h-screen bg-slate-800 text-brand-text font-sans">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        width={sidebarWidth} 
        onToggle={toggleSidebar}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        onStartCompose={handleStartCompose}
      />
      
      {!isSidebarCollapsed && <Resizer onMouseDown={handleResizeStart('sidebar')} className="bg-slate-300 hover:bg-brand-accent" />}

      <div className="flex-1 flex overflow-hidden">
        {replyingToEmail ? (
          <ReplyView
            email={replyingToEmail}
            replyText={replyText}
            setReplyText={setReplyText}
            onCancel={handleFinishReply}
            isGeneratingDraft={isGeneratingDraft}
            onAiEmailAction={handleAiEmailAction}
          />
        ) : isComposing ? (
          <ComposeView 
            composeData={composeData}
            setComposeData={setComposeData}
            onCancel={handleFinishCompose}
            isGeneratingDraft={isGeneratingDraft}
            onAiEmailAction={handleAiEmailAction}
          />
        ) : (
          <div className="flex-1 overflow-y-auto border-r border-slate-700 bg-brand-primary">
            <div className="p-4 border-b border-slate-700"><h2 className="text-xl font-bold">Inbox</h2></div>
            <ul>
              {emails.map(email => {
                const uiState = getEmailUIState(email);
                const baseClasses = "flex items-stretch border-l-4 group transition-colors duration-200";
                const stateClasses = {
                    processed: 'opacity-50',
                    duplicate: 'bg-yellow-900/30 border-yellow-500 hover:bg-yellow-900/40',
                    default: 'border-transparent hover:bg-brand-secondary/50'
                };
                const selectedClass = selectedEmail?.id === email.id && uiState !== 'duplicate' ? 'bg-brand-accent/20 border-brand-accent' : '';
                
                return (
                    <li key={email.id} className={`${baseClasses} ${stateClasses[uiState]} ${selectedClass}`}>
                       <div onClick={() => setSelectedEmail(email)} className="flex-grow cursor-pointer p-4">
                          <div className="flex justify-between items-baseline"><p className="font-semibold truncate">{email.sender}</p><p className="text-xs text-brand-text-secondary flex-shrink-0 ml-2">{timeAgo(email.date)}</p></div>
                          <p className="font-medium mt-1 truncate">{email.subject}</p>
                          <p className="text-sm text-brand-text-secondary mt-1 line-clamp-2">{email.body}</p>
                       </div>
                       <div className="flex-shrink-0 flex items-center p-2 border-l border-transparent group-hover:border-slate-700 transition-colors">
                          <button
                              onClick={() => handleStartReply(email)}
                              className="flex items-center gap-1.5 p-2 rounded-md text-sm font-semibold text-brand-text-secondary hover:bg-brand-accent hover:text-white transition-colors"
                              title="Reply and Bill"
                              disabled={uiState !== 'default'}
                          >
                              <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                      </div>
                    </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {!isInvoLexPanelCollapsed && <Resizer onMouseDown={handleResizeStart('invoLex')} className="bg-slate-700 hover:bg-brand-accent" />}
        
        <div style={{width: isInvoLexPanelCollapsed ? INVOLEX_PANEL_COLLAPSED_WIDTH : invoLexPanelWidth}} className="flex-shrink-0 bg-brand-secondary flex flex-col transition-all duration-300">
            <InvoLexPanel
                emails={emails}
                isCollapsed={isInvoLexPanelCollapsed}
                onToggleCollapse={toggleInvoLexPanel}
                selectedEmail={selectedEmail}
                onSelectEmail={setSelectedEmail}
                allEntries={allEntries}
                onCreateEntry={handleCreateEntryFromForm}
                onCreateAndSyncEntry={handleCreateAndSyncEntry}
                onUpdateEntry={handleUpdateEntry}
                onSyncEntry={(id) => handleSyncEntries([id])}
                onViewEmail={handleViewEmail}
                onOpenModal={setModalView}
                onOpenManualEntry={() => setIsManualEntryModalOpen(true)}
                matters={matters}
                selectedIds={selectedEntryIds}
                onToggleSelection={handleToggleSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onBulkSyncAutoPilot={handleBulkSyncAutoPilot}
                isPersonalizationEnabled={isPersonalizationEnabled}
                corrections={corrections}
                onToggleActionItem={handleToggleActionItem}
                suggestedEntries={suggestedEntries}
                onDismissSuggestion={handleDismissSuggestion}
                onScanForSuggestions={handleScanForSuggestions}
                onUseAsTemplate={handleUseAsTemplate}
                templateForGen={templateForGen}
                setTemplateForGen={setTemplateForGen}
                todaysBillableHours={todaysBillableHours}
                onQuickAddSuggestion={handleQuickAddSuggestion}
                processingSuggestionId={processingSuggestionId}
                triageResult={triageResult}
                onMarkAsProcessedAndNext={handleMarkAsProcessedAndNext}
                onSyncEntries={handleSyncEntries}
                onBulkSyncAllPending={handleBulkSyncAllPending}
                onSetArchiveStatus={handleSetArchiveStatus}
                reviewingSuggestion={reviewingSuggestion}
                setReviewingSuggestion={setReviewingSuggestion}
                replyingToEmail={replyingToEmail}
                replyText={replyText}
                onFinishReply={handleFinishReply}
                isComposing={isComposing}
                composeData={composeData}
                onStartCompose={handleStartCompose}
                onFinishCompose={handleFinishCompose}
                setReplyText={setReplyText}
                setComposeData={setComposeData}
            />
        </div>
      </div>

      <ManualTimeEntryModal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
        onSubmit={handleCreateManualEntry}
        matters={matters}
      />

      <EmailDetailModal email={selectedEmailForDetail} onClose={() => setSelectedEmailForDetail(null)} />

      <Modal isOpen={modalView !== ModalView.None} onClose={() => setModalView(ModalView.None)} title={modalView}>
        {renderModalContent()}
      </Modal>
    </div>
  );
};

// Add NotificationContext to window for simulated verification
const AppWithContext: React.FC = () => {
    const notificationContext = useNotification();
    useEffect(() => {
        (window as any).notificationContext = notificationContext;
    }, [notificationContext]);

    return <AppContent />;
}

const App: React.FC = () => (
  <NotificationProvider>
    <AppWithContext />
  </NotificationProvider>
);

export default App;

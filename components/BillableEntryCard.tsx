

import React, { useState, useEffect } from 'react';
import { BillableEntry, BillableEntryStatus, Matter, ActionItem } from '../types';
import Spinner from './ui/Spinner';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PencilIcon, CheckIcon, WandIcon, EnvelopeIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, DocumentDuplicateIcon, ArrowPathIcon, PaperAirplaneIcon, ArchiveBoxIcon, SparklesIcon, ArrowUpRightIcon } from './icons/Icons';

interface BillableEntryCardProps {
  entry: BillableEntry;
  onUpdate: (originalEntry: BillableEntry, updatedEntry: BillableEntry) => void;
  onSync?: (id: string) => void;
  matters: Matter[];
  onViewEmail: (emailId: string) => void;
  onToggleActionItem?: (entryId: string, actionItemId: string) => void;
  onUseAsTemplate?: (entry: BillableEntry) => void;
  onRefineDescription?: (entryId: string, instruction: string) => Promise<void>;
}

const getStatusInfo = (entry: BillableEntry) => ({
  [BillableEntryStatus.Pending]: {
    icon: <ClockIcon className="text-yellow-400" />,
    text: 'For Review',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/50',
  },
  [BillableEntryStatus.Synced]: {
    icon: <CheckCircleIcon className="text-green-400" />,
    text: `Synced to ${entry.syncDetails?.targetSoftware}`,
    color: 'text-green-400',
    bgColor: 'bg-green-900/50',
  },
  [BillableEntryStatus.Error]: {
    icon: <ExclamationTriangleIcon className="text-red-400" />,
    text: 'Sync Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
  },
   [BillableEntryStatus.Generating]: {
    icon: <Spinner size="small" />,
    text: 'Syncing...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
  }
});

const BillableEntryCard: React.FC<BillableEntryCardProps> = ({ entry, onUpdate, onSync, matters, onViewEmail, onToggleActionItem, onUseAsTemplate, onRefineDescription }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableEntry, setEditableEntry] = useState(entry);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setEditableEntry(entry);
    // If the entry is updated from outside (e.g. after AI refinement),
    // and we are in editing mode, we might want to stay in editing mode
    // but with the new data. This handles that.
    if (isEditing) {
      setEditableEntry(prev => ({ ...prev, description: entry.description }));
    }
  }, [entry, isEditing]);
  
  const handleSave = () => {
    onUpdate(entry, editableEntry);
    setIsEditing(false);
  };
  
  const handleRefine = async () => {
    if (!onRefineDescription) return;
    const instruction = prompt("How should the AI refine this description? (e.g., 'Make it more formal', 'Add more detail about the call')");
    if (instruction) {
      setIsRefining(true);
      await onRefineDescription(entry.id, instruction);
      setIsRefining(false);
    }
  };

  const hasActionItems = entry.actionItems && entry.actionItems.length > 0;
  const completedActionItems = entry.actionItems?.filter(item => item.completed).length || 0;
  const allActionItemsCompleted = hasActionItems && completedActionItems === entry.actionItems?.length;
  const hasDetailedBreakdown = entry.detailedBreakdown && entry.detailedBreakdown.length > 0;
  const hasEmail = entry.emailIds && entry.emailIds.length > 0;

  const currentStatus = getStatusInfo(entry)[entry.status];

  return (
    <div className={`relative flex items-start gap-3 bg-brand-primary p-3 rounded-lg border transition-all duration-200 ${entry.source === 'External' ? 'border-dashed border-slate-600' : 'border-slate-700'} ${entry.status === BillableEntryStatus.Error ? 'border-red-500/50' : ''} ${entry.isArchived ? 'opacity-60 bg-slate-800/50' : ''}`}>
      <div className="flex-grow">
          {isEditing ? (
            <div className="flex-grow space-y-2">
                <textarea value={editableEntry.description} onChange={e => setEditableEntry({...editableEntry, description: e.target.value})} className="bg-slate-900 border border-slate-600 rounded-md p-2 text-sm w-full h-24" />
                <div className="flex items-center gap-2">
                    {hasEmail && onRefineDescription && (
                        <button onClick={handleRefine} disabled={isRefining} className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50">
                            {isRefining ? <Spinner size="small" /> : <SparklesIcon className="h-4 w-4" />}
                            Refine with AI
                        </button>
                    )}
                </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div className="flex-grow">
                  {entry.status === BillableEntryStatus.Generating && entry.description === '' ? (
                     <div className="h-5 bg-slate-700 rounded w-full animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-brand-text leading-relaxed text-sm">{entry.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center md:ml-4">
                  <div className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${currentStatus.bgColor} ${currentStatus.color}`}>
                      <span className="h-3 w-3 mr-1">{currentStatus.icon}</span>
                      {currentStatus.text}
                  </div>
                </div>
              </div>
               <div className="flex items-center gap-2 mt-2">
                  {entry.autoGenerated && (
                     <div className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-400 w-fit">
                        <WandIcon className="h-3 w-3 mr-1.5"/>
                        Auto-Generated
                     </div>
                   )}
                   {entry.source === 'External' && (
                     <div className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 w-fit">
                        From {entry.targetSoftware}
                     </div>
                   )}
                    {hasActionItems && (
                     <div className="group relative flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-400 w-fit">
                        {allActionItemsCompleted ? <ClipboardDocumentCheckIcon className="h-3 w-3 mr-1.5"/> : <ClipboardDocumentListIcon className="h-3 w-3 mr-1.5"/>}
                        Tasks: {completedActionItems}/{entry.actionItems?.length}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-brand-text-secondary z-10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
                            <h4 className="font-bold text-sm text-brand-text mb-2">Tasks from Email:</h4>
                            <ul className="space-y-2 text-xs">
                                {entry.actionItems?.map((item) => (
                                  <li key={item.id} className="flex items-center">
                                    <input
                                      id={`action-item-${item.id}`}
                                      type="checkbox"
                                      checked={item.completed}
                                      onChange={() => onToggleActionItem && onToggleActionItem(entry.id, item.id)}
                                      className="h-4 w-4 rounded bg-brand-secondary border-slate-600 text-brand-accent focus:ring-brand-accent focus:ring-offset-slate-900 mr-2"
                                    />
                                    <label htmlFor={`action-item-${item.id}`} className={`flex-1 ${item.completed ? 'line-through text-brand-text-secondary/60' : 'text-brand-text'}`}>{item.text}</label>
                                  </li>
                                ))}
                            </ul>
                            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 transform rotate-45"></div>
                        </div>
                     </div>
                    )}
               </div>
            </>
          )}

          {showBreakdown && hasDetailedBreakdown && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-600">
              <h5 className="text-xs font-semibold text-brand-text-secondary mb-2">Work Breakdown:</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-brand-text-secondary pl-2">
                {entry.detailedBreakdown?.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}

          {entry.status === BillableEntryStatus.Error && entry.syncDetails?.errorMessage && (
            <p className="mt-2 text-xs text-red-400 bg-red-900/30 p-2 rounded-md">
                <strong>Error:</strong> {entry.syncDetails.errorMessage}
            </p>
          )}
          
          <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {isEditing ? (
              <div className="flex-grow grid grid-cols-2 gap-2">
                 <input type="number" step="0.1" value={editableEntry.hours} onChange={e => setEditableEntry({...editableEntry, hours: parseFloat(e.target.value)})} className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs w-full" />
                 <select value={editableEntry.matter} onChange={e => setEditableEntry({...editableEntry, matter: e.target.value})} className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs w-full">
                    {matters.map(matter => (
                      <option key={matter.name} value={matter.name}>{matter.name}</option>
                    ))}
                    {!matters.find(m => m.name === editableEntry.matter) && <option value={editableEntry.matter}>{editableEntry.matter}</option>}
                 </select>
              </div>
            ) : (
              <div className="flex items-center gap-x-3 gap-y-1 text-xs text-brand-text-secondary flex-wrap">
                <span><strong>Hrs:</strong> {entry.hours.toFixed(1)}</span>
                <span className="truncate"><strong>Matter:</strong> {entry.matter}</span>
                <span><strong>Rate:</strong> ${entry.rate.toFixed(2)}</span>
                {entry.status === BillableEntryStatus.Synced && entry.syncDetails && (
                    <span><strong>Synced:</strong> {new Date(entry.syncDetails.syncedAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 flex-shrink-0">
                {hasEmail && <button onClick={() => onViewEmail(entry.emailIds![0])} className="p-1.5 rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors" title="View Source Email"><EnvelopeIcon className="h-4 w-4"/></button>}
                {hasDetailedBreakdown && <button onClick={() => setShowBreakdown(prev => !prev)} className={`p-1.5 rounded-md transition-colors ${showBreakdown ? 'bg-brand-accent/30 text-brand-accent' : 'bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary'}`} title="Show Work Breakdown"><ClipboardDocumentListIcon className="h-4 w-4" /></button>}
                {entry.source === 'External' && entry.syncDetails?.externalUrl && (
                    <a href={entry.syncDetails.externalUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5" title={`View in ${entry.targetSoftware}`}>
                        View in {entry.targetSoftware} <ArrowUpRightIcon className="h-3 w-3" />
                    </a>
                )}

                {isEditing ? (
                     <button onClick={handleSave} className="p-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"><CheckIcon className="h-4 w-4" /></button>
                ) : (
                    entry.source !== 'External' && entry.status !== BillableEntryStatus.Synced && entry.status !== BillableEntryStatus.Generating &&
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors"><PencilIcon className="h-4 w-4" /></button>
                )}
               
                {onSync && entry.source !== 'External' && entry.status === BillableEntryStatus.Pending && (
                    <button onClick={() => onSync(entry.id)} className="px-3 py-1 text-xs font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center gap-1.5">
                        <PaperAirplaneIcon className="h-4 w-4"/>
                        Approve
                    </button>
                )}

                {onSync && entry.source !== 'External' && entry.status === BillableEntryStatus.Error && (
                    <button onClick={() => onSync(entry.id)} className="px-3 py-1 text-xs font-semibold rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-colors flex items-center gap-1.5">
                        <ArrowPathIcon className="h-4 w-4"/>
                        Retry
                    </button>
                )}
                 
                {entry.status === BillableEntryStatus.Generating && (
                   <div className="px-3 py-1 text-xs font-semibold rounded-md bg-brand-accent/50 text-white transition-colors flex items-center justify-center w-[88px]">
                      <Spinner size="small" />
                   </div>
                )}

                {onUseAsTemplate && entry.source !== 'External' && entry.status === BillableEntryStatus.Synced && (
                  <button onClick={() => onUseAsTemplate(entry)} className="p-1.5 rounded-md bg-brand-secondary hover:bg-slate-600 text-brand-text-secondary transition-colors" title="Use as Template">
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                )}
            </div>
          </div>
      </div>
      {entry.isArchived && (
        <div className="absolute top-2 right-2 flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            <ArchiveBoxIcon className="h-3 w-3 mr-1.5"/>
            Archived
        </div>
      )}
    </div>
  );
};

export default BillableEntryCard;
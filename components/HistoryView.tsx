
import React, { useState, useMemo } from 'react';
import { BillableEntry, Matter } from '../types';
import BillableEntryCard from './BillableEntryCard';
import { 
  MagnifyingGlassIcon, 
  ArchiveBoxIcon, 
  ArrowUpOnSquareIcon 
} from './icons/Icons';
import ToggleSwitch from './ui/ToggleSwitch';

interface HistoryViewProps {
  processedEntries: BillableEntry[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onSetArchiveStatus: (ids: string[], isArchived: boolean) => void;
  onUpdateEntry: (originalEntry: BillableEntry, updatedEntry: BillableEntry) => void;
  onSyncEntry: (id: string) => Promise<void>;
  matters: Matter[];
  onViewEmail: (emailId: string) => void;
  onToggleActionItem: (entryId: string, actionItemId: string) => void;
  onUseAsTemplate: (entry: BillableEntry) => void;
  onRefineDescription: (entryId: string, instruction: string) => Promise<void>;
}

const HistoryView: React.FC<HistoryViewProps> = (props) => {
  const {
    processedEntries,
    selectedIds,
    onToggleSelection,
    onToggleSelectAll,
    onSetArchiveStatus,
    onUpdateEntry,
    onSyncEntry,
    matters,
    onViewEmail,
    onToggleActionItem,
    onUseAsTemplate,
    onRefineDescription,
  } = props;

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredHistory = useMemo(() => {
    return processedEntries.filter(entry => 
      (showArchived ? entry.isArchived === true : !entry.isArchived) &&
      (entry.description.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      entry.matter.toLowerCase().includes(historySearchTerm.toLowerCase()))
    );
  }, [processedEntries, historySearchTerm, showArchived]);

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
        <input 
          type="text" 
          placeholder="Search history..." 
          value={historySearchTerm} 
          onChange={e => setHistorySearchTerm(e.target.value)} 
          className="w-full bg-brand-primary border border-slate-600 rounded-md py-2 pl-10 pr-4 text-sm" 
        />
      </div>
      
      {selectedHistoryIds.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button 
            onClick={() => onSetArchiveStatus(selectedHistoryIds, !showArchived)}
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
              <input 
                type="checkbox"
                className="h-4 w-4 rounded bg-brand-secondary border-slate-600 text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-secondary"
                checked={historyIds.length > 0 && selectedHistoryIds.length === historyIds.length}
                onChange={() => onToggleSelectAll(historyIds)}
                aria-label="Select all"
              />
              <span className="ml-3 text-xs font-semibold text-brand-text-secondary">Select All</span>
            </div>
            {filteredHistory.map(entry => (
              <div key={entry.id} className="flex gap-3 items-start p-1 hover:bg-brand-primary/50 rounded-lg">
                <input 
                  type="checkbox"
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
                    onRefineDescription={onRefineDescription}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-brand-text-secondary text-sm text-center pt-8">No processed entries found.</p>}
      </div>
    </div>
  );
};

export default HistoryView;

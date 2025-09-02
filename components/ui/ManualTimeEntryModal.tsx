
import React, { useState } from 'react';
import { Matter } from '../../types';
import { XMarkIcon, PlusCircleIcon, CheckIcon, CalendarIcon } from '../icons/Icons';

interface ManualTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; hours: number; matter: string; date: string; }) => void;
  matters: Matter[];
}

const ManualTimeEntryModal: React.FC<ManualTimeEntryModalProps> = ({ isOpen, onClose, onSubmit, matters }) => {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(0.5);
  const [matter, setMatter] = useState(matters.length > 0 ? matters[0].name : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && matter && hours > 0) {
      onSubmit({ description, hours, matter, date });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-700 transition-transform duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2">
            <PlusCircleIcon className="h-6 w-6 text-brand-accent"/>
            Add Manual Time Entry
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-brand-text-secondary hover:text-white rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label htmlFor="manual-description" className="block text-sm font-medium text-brand-text-secondary mb-1">Description</label>
            <textarea
              id="manual-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="e.g., Phone call with client regarding case strategy..."
              className="w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="manual-hours" className="block text-sm font-medium text-brand-text-secondary mb-1">Hours</label>
              <input
                id="manual-hours"
                type="number"
                step="0.1"
                min="0.1"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                required
                className="w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="manual-matter" className="block text-sm font-medium text-brand-text-secondary mb-1">Matter</label>
              <select
                id="manual-matter"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                required
                className="w-full bg-brand-primary border border-slate-600 rounded-md p-2 text-sm focus:ring-brand-accent focus:border-brand-accent"
              >
                {matters.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="manual-date" className="block text-sm font-medium text-brand-text-secondary mb-1">Date</label>
            <div className="relative">
                 <input
                  id="manual-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-brand-primary border border-slate-600 rounded-md p-2 pl-10 text-sm focus:ring-brand-accent focus:border-brand-accent"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
            </div>
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualTimeEntryModal;

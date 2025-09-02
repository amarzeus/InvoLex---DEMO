
import React from 'react';
import { InformationCircleIcon } from '../icons/Icons';

interface ConfidenceMeterProps {
  score: number;
  justification: string;
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ score, justification }) => {
  const getConfidenceStyle = (s: number) => {
    if (s >= 0.9) return { text: 'High Confidence', color: 'bg-green-500', textColor: 'text-green-400' };
    if (s >= 0.75) return { text: 'Medium Confidence', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    return { text: 'Low Confidence', color: 'bg-red-500', textColor: 'text-red-400' };
  };

  const { text, color, textColor } = getConfidenceStyle(score);
  const widthPercentage = `${Math.max(5, score * 100)}%`; // Ensure a minimum visible width

  return (
    <div className="group relative bg-brand-primary p-2 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <label className={`text-xs font-bold ${textColor}`}>{text}</label>
        <div className="flex items-center gap-1.5">
           <span className="text-xs font-mono text-brand-text-secondary">{`${Math.round(score * 100)}%`}</span>
           <InformationCircleIcon className="h-4 w-4 text-brand-text-secondary" />
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`} 
          style={{ width: widthPercentage }}
        />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-brand-text-secondary z-10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
        <h4 className="font-bold text-sm text-brand-text mb-2">AI Justification:</h4>
        <p className="text-xs">{justification}</p>
        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 transform rotate-45"></div>
      </div>
    </div>
  );
};

export default ConfidenceMeter;

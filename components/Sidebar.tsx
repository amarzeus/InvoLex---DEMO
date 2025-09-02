

import React from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { InvoLexLogo, EnvelopeIcon, ArrowLeftOnRectangleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PencilIcon } from './icons/Icons';

interface SidebarProps {
  isCollapsed: boolean;
  width: number;
  onToggle: () => void;
  collapsedWidth: number;
  onStartCompose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, width, onToggle, collapsedWidth, onStartCompose }) => {
  const { logout } = useAuth();
  
  return (
    <div style={{width: isCollapsed ? collapsedWidth : width}} className="flex-shrink-0 bg-slate-200 text-slate-800 flex flex-col p-2 border-r border-slate-300 transition-all duration-300">
      <div className="flex items-center justify-between gap-2 mb-8 h-10">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-full justify-center' : ''}`}>
           {isCollapsed ? 
              <InvoLexLogo className="h-8 w-8 text-slate-700"/> :
              <><InvoLexLogo className="h-8 w-8 flex-shrink-0"/><h1 className="text-xl font-bold whitespace-nowrap">InvoLex</h1></>
           }
        </div>
        <button onClick={onToggle} className="p-1 rounded-full hover:bg-slate-300 flex-shrink-0" title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {isCollapsed ? <ChevronDoubleRightIcon className="h-5 w-5 text-slate-600" /> : <ChevronDoubleLeftIcon className="h-5 w-5 text-slate-600" />}
        </button>
      </div>
      <div className="space-y-2">
          <button className={`w-full flex items-center px-3 py-2 text-sm font-bold rounded-lg bg-blue-200 text-blue-800 ${isCollapsed && 'justify-center'}`}>
            <EnvelopeIcon className="h-5 w-5"/> 
            {!isCollapsed && <span className="ml-3">Inbox</span>}
          </button>
           <button 
            onClick={onStartCompose}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-300 ${isCollapsed && 'justify-center'}`}
            title="Compose New Email"
          >
            <PencilIcon className="h-5 w-5"/> 
            {!isCollapsed && <span className="ml-3">Compose</span>}
          </button>
      </div>
      <div className="mt-auto">
          <button onClick={logout} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-300 ${isCollapsed && 'justify-center'}`}>
            <ArrowLeftOnRectangleIcon className="h-5 w-5"/>
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
      </div>
    </div>
  );
};

export default Sidebar;
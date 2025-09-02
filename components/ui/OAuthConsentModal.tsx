import React from 'react';
import { GoogleLogoIcon, CheckCircleIcon } from '../icons/Icons';
import { InvoLexLogo } from '../icons/Icons';

interface OAuthConsentModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
  provider: 'Google';
}

const OAuthConsentModal: React.FC<OAuthConsentModalProps> = ({ isOpen, onAllow, onDeny, provider }) => {
  if (!isOpen) return null;

  const permissions = [
    "See, edit, create, and delete your primary Google Calendar calendars",
    "See and download your contacts",
    "Read, compose, and send emails from your Gmail account",
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-300">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <GoogleLogoIcon className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Sign in with Google</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-full border border-slate-300 p-1">
                <InvoLexLogo className="text-brand-accent"/>
              </div>
              <div className="h-px w-8 bg-slate-300"></div>
              <div className="h-12 w-12 flex items-center justify-center rounded-full border border-slate-300 p-1">
                <GoogleLogoIcon />
              </div>
            </div>
            <h3 className="text-lg font-bold">InvoLex wants to access your Google Account</h3>
            <p className="text-sm text-slate-600 mt-2">
              This will allow InvoLex to:
            </p>
          </div>
          <ul className="space-y-3 mt-4 text-sm text-slate-700">
            {permissions.map((perm, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-6">
            Make sure you trust InvoLex. You can see InvoLex's privacy policy and terms of service.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-b-lg flex justify-end gap-3">
          <button onClick={onDeny} className="px-4 py-2 text-sm font-semibold rounded-md text-brand-accent hover:bg-blue-100">
            Deny
          </button>
          <button onClick={onAllow} className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthConsentModal;

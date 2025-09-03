



import React from 'react';

// Props for all icons
const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor",
};

export const HomeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);

export const EnvelopeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
);

export const ChartBarIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
);

export const Cog6ToothIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-1.226M12 20.25v-2.25m-3.813-3.814-.43-1.025a1.125 1.125 0 0 1-1.226-1.11l-.09-.542m-2.25 2.25.542.09a1.125 1.125 0 0 0 1.226-1.11l.09-.542-.43-1.025m3.814 3.814 1.025.43a1.125 1.125 0 0 0 1.11 1.226l.542.09M18.375 12h-2.25m-3.813-3.814 1.025-.43a1.125 1.125 0 0 1 1.11-1.226l.542-.09M12 15.75v2.25m-3.813-3.814-.43-1.025a1.125 1.125 0 0 1-1.226-1.11l-.09-.542m-2.25 2.25.542.09a1.125 1.125 0 0 0 1.226-1.11l.09-.542-.43-1.025m3.814 3.814 1.025.43a1.125 1.125 0 0 0 1.11 1.226l.542.09m-3.814-3.814a3 3 0 1 1-4.243-4.243 3 3 0 0 1 4.243 4.243m4.243 4.243a3 3 0 1 1-4.243-4.243 3 3 0 0 1 4.243 4.243m0-4.243a3 3 0 1 1 4.243 4.243 3 3 0 0 1-4.243-4.243" /></svg>
);

export const InvoLexLogo: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
);

export const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
);

export const ClockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
);

export const ExclamationTriangleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
);

export const ArrowUpRightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5 19.5 4.5M19.5 4.5v10.5M19.5 4.5h-10.5" /></svg>
);

export const ChevronDoubleLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" /></svg>
);

export const ChevronDoubleRightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" /></svg>
);

export const PencilIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
);

export const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
);

export const MagnifyingGlassIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
);

export const XMarkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
);

export const InformationCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
);

export const WandIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69a.75.75 0 0 1 .819.162l3.935 3.935a.75.75 0 0 1-1.06 1.06l-3.936-3.935a.75.75 0 0 1-.162-.819A8.97 8.97 0 0 0 15 9a9 9 0 0 0-9-9 8.97 8.97 0 0 0-3.463.69a.75.75 0 0 1-.819-.162L1.718 4.472a.75.75 0 0 1 1.06-1.06l3.936 3.935Z M18 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12 12a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM6 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>
);

export const FolderIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M2.25 9h19.5v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5V9Z" /></svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.548 0c-.04.009-.077.018-.115.026m11.355 0c-3.465-.452-7.34-.452-10.805 0" /></svg>
);

export const LightBulbIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 0 0-3-3m3 3a3 3 0 0 0 3-3m-3 3V1.5m-3 9.75a3 3 0 0 1 3-3m-3 3a3 3 0 0 0-3 3m6 0a3 3 0 0 1-3 3m3-3a3 3 0 0 0 3-3m-6 3a3 3 0 0 1 3-3" /></svg>
);

export const ClockRewindIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 5.07A7.5 7.5 0 0 1 12 4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 5.072A7.505 7.505 0 0 0 4.5 12c0 .64.08 1.258.23 1.844" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9H9V4.5" /></svg>
);

export const PlusCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
);

export const CalendarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>
);

export const ArrowLeftOnRectangleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
);

export const ArrowPathIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" /></svg>
);


export const CurrencyDollarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.825-1.106-2.156 0-2.981.54-.403 1.252-.638 2.003-.638s1.463.235 2.003.638c1.106.825 1.106 2.156 0 2.981l-.879.659M7.5 12h9" /></svg>
);

export const ClipboardDocumentListIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-.668-.287-1.265-.77-1.684l-4.418-4.418a1.25 1.25 0 0 0-.884-.366H6.108a2.25 2.25 0 0 0-2.25 2.25v11.642a2.25 2.25 0 0 0 2.25 2.25h1.538m3.75-16.5M12 3v3.75h3.75" /></svg>
);

export const ClipboardDocumentCheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>
);

export const DocumentDuplicateIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 0 1.5 .124m7.5 10.376V3.375c0-.621-.504-1.125-1.125-1.125h-9.75a1.125 1.125 0 0 0-1.125 1.125v13.5c0 .621.504 1.125 1.125 1.125h9.75a1.125 1.125 0 0 0 1.125-1.125Z" /></svg>
);

export const PaperAirplaneIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
);

export const EyeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.25-6.5a1.012 1.012 0 0 1 1.623-.39L12 10.022l4.091-4.729a1.012 1.012 0 0 1 1.623.39l4.25 6.5a1.012 1.012 0 0 1 0 .639l-4.25 6.5a1.012 1.012 0 0 1-1.623.39L12 13.978l-4.091 4.729a1.012 1.012 0 0 1-1.623-.39l-4.25-6.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
);

export const EyeSlashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.774 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243-4.243-4.243" /></svg>
);

export const ShieldCheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.18 10.375 13.5 14.25 9.625M12 21.75c-2.836 0-5.456-.9-7.5-2.522V6.75a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v12.478c-2.044 1.622-4.664 2.522-7.5 2.522Z" /></svg>
);

export const DevicePhoneMobileIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75A2.25 2.25 0 0 0 15.75 1.5h-2.25m-3 0h3m-3.75 18h4.5" /></svg>
);

export const ComputerDesktopIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" /></svg>
);

export const GlobeAltIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0 0 12 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0-.778.099-1.533.284-2.253m0 0A11.953 11.953 0 0 1 12 10.5" /></svg>
);

export const QrCodeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15h15v-15h-15Zm0 0h4.5m-4.5 0v4.5m0-4.5h15m0 0v4.5m0 0h-4.5m4.5 0v15m0 0h-4.5m0 0v-4.5m0 0h-15m15 0v-4.5m0 0h-4.5M3.75 9h4.5" /></svg>
);

export const KeyIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 12Z" /></svg>
);

export const FingerPrintIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11.25S8.625 10.5 12 10.5s4.5.75 4.5.75S18 12.375 18 15s-1.125 4.5-1.5 4.5S14.625 18 12 18s-4.5-1.125-4.5-1.125S6 16.125 6 15s1.5-3.75 1.5-3.75Zm0 0c0-1.5 1.5-3 4.5-3s4.5 1.5 4.5 3" /></svg>
);

export const AtSymbolIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" /></svg>
);

export const UserCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
);

// Mock Logos
export const ClioLogo: React.FC<{className?: string}> = ({className}) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-8"}>
    <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#0066CC"/>
    <path d="M24.0002 12.5303C21.0002 12.5303 18.5302 15.0003 18.5302 18.0003C18.5302 21.0003 21.0002 23.4703 24.0002 23.4703C27.0002 23.4703 29.4702 21.0003 29.4702 18.0003C29.4702 15.0003 27.0002 12.5303 24.0002 12.5303Z" stroke="white" strokeWidth="2"/>
    <path d="M16 34H32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
export const PracticePantherLogo: React.FC<{className?: string}> = ({className}) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-8"}>
    <path d="M10 4h28v28L24 46 10 32V4z" fill="#1a1a1a"/>
    <path d="M24,12c-6,0-11,5-11,11v11h22V23C35,17,30,12,24,12z" fill="#ff6f00"/>
    <circle cx="19" cy="23" r="2" fill="black" />
    <circle cx="29" cy="23" r="2" fill="black" />
  </svg>
);
export const MyCaseLogo: React.FC<{className?: string}> = ({className}) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-8"}>
    <rect width="48" height="48" rx="8" fill="#4a5568"/>
    <path d="M12 14h24v4H12v-4zm0 8h24v4H12v-4zm0 8h16v4H12v-4z" fill="white"/>
    <path d="M30 30h6v6h-6z" fill="#3b82f6"/>
  </svg>
);

export const GoogleLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const MicrosoftLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.4 11.4H2V2H11.4V11.4Z" fill="#F25022"/>
        <path d="M22 11.4H12.6V2H22V11.4Z" fill="#7FBA00"/>
        <path d="M11.4 22H2V12.6H11.4V22Z" fill="#00A4EF"/>
        <path d="M22 22H12.6V12.6H22V22Z" fill="#FFB900"/>
    </svg>
);

export const EnvelopeOpenIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488a2.25 2.25 0 0 1-2.178 0L3.427 11.887A2.25 2.25 0 0 1 2.25 9.906V9M21.75 9a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-9 5.25L2.25 9" /></svg>
);

export const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>
);

export const ArrowUturnLeftIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
);

export const ArchiveBoxIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
);

export const ArrowUpOnSquareIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3-3m0 0 3 3m-3-3v12" /></svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);

export const CpuChipIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 15.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M21 8.25h-1.5M21 15.75h-1.5M15.75 21v-1.5M9 6.75h6M9 17.25h6M6.75 9v6M17.25 9v6M12 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-7.5A2.25 2.25 0 0 0 3 8.25Z" /></svg>
);

export const ScaleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52a2.25 2.25 0 0 1-4.472 0m4.472 0a2.25 2.25 0 0 0-4.472 0M3.25 4.97A48.416 48.416 0 0 1 12 4.5c2.291 0 4.545.16 6.75.47m-13.5 0c-1.01.143-2.01.317-3 .52m3-.52a2.25 2.25 0 0 0 4.472 0m-4.472 0a2.25 2.25 0 0 1 4.472 0M12 21a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 1 1.5 0v16.5a.75.75 0 0 1-.75.75Z" /></svg>
);

export const BoltIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
);

export const SunIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
);

export const MoonIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.921-.994 6.752-2.625Z" /></svg>
);
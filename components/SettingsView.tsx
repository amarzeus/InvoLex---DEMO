





import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PracticeManagementTool, NotificationType, Matter, User, Session, LoginHistory, Passkey, BillingRule, BillingRuleActionType, BillingRuleCondition, BillingRuleConditionType, AIPersona } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { 
    ClioLogo, MyCaseLogo, PracticePantherLogo, CheckCircleIcon, FolderIcon, TrashIcon, SparklesIcon, 
    CurrencyDollarIcon, UserCircleIcon, KeyIcon, AtSymbolIcon, QrCodeIcon, 
    DevicePhoneMobileIcon, ComputerDesktopIcon, GlobeAltIcon, FingerPrintIcon, ExclamationTriangleIcon,
    CpuChipIcon, ScaleIcon, PlusIcon, XMarkIcon, PencilIcon, WandIcon,
} from './icons/Icons';
import Spinner from './ui/Spinner';
import ToggleSwitch from './ui/ToggleSwitch';
import { useAuth } from '../contexts/AuthProvider';
import { supabaseClient } from '../services/supabase';

type SettingsTab = 'Account' | 'Security' | 'Billing' | 'Automation' | 'Integrations';

// --- Reusable Components ---
const SettingsSection: React.FC<{title: string, subtitle?: string, children: React.ReactNode}> = ({ title, subtitle, children }) => (
    <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-brand-text border-b border-slate-700 pb-4 mb-6">{title}</h3>
        {subtitle && <p className="text-sm text-brand-text-secondary mb-6 -mt-2">{subtitle}</p>}
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const DangerZone: React.FC<{title: string, subtitle: string, buttonText: string, onAction: () => void}> = ({ title, subtitle, buttonText, onAction }) => (
    <div className="bg-red-900/20 p-5 rounded-lg border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h4 className="font-bold text-red-300">{title}</h4>
            <p className="text-sm text-red-300/80 mt-1">{subtitle}</p>
        </div>
        <button onClick={onAction} className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors flex-shrink-0 w-full md:w-auto">
            {buttonText}
        </button>
    </div>
);

// --- Tab Content Components ---

const AccountTab: React.FC<{user: User}> = ({ user }) => {
    const { changePassword, changeEmail, deleteAccount } = useAuth();
    const { addNotification } = useNotification();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [passwordForEmail, setPasswordForEmail] = useState('');
    const [passwordForDelete, setPasswordForDelete] = useState('');
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            addNotification("New passwords do not match.", NotificationType.Error);
            return;
        }
        const { error } = await changePassword({ userId: user.id, oldPassword, newPassword });
        if (error) {
            addNotification(error.message, NotificationType.Error);
        } else {
            addNotification("Password changed successfully.", NotificationType.Success);
            setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await changeEmail({ userId: user.id, newEmail, password: passwordForEmail });
        if(error) {
            addNotification(error.message, NotificationType.Error);
        } else {
            addNotification("Verification email sent to new address. Please check your inbox.", NotificationType.Success);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmDeleteText !== `delete ${user.email}`) {
            addNotification("Confirmation text does not match.", NotificationType.Error);
            return;
        }
        const { error } = await deleteAccount({ userId: user.id, password: passwordForDelete });
        if (error) {
            addNotification(error.message, NotificationType.Error);
        }
    };

    return (
        <div className="space-y-8">
            <SettingsSection title="Change Email">
                <p className="text-sm text-brand-text-secondary">Your current email address is <strong>{user.email}</strong>. After changing your email, you will be logged out and asked to verify the new address.</p>
                <form onSubmit={handleEmailChange} className="space-y-4">
                     <input type="email" placeholder="New Email Address" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full max-w-sm bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                     <input type="password" placeholder="Confirm Current Password" value={passwordForEmail} onChange={e => setPasswordForEmail(e.target.value)} required className="w-full max-w-sm bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                     <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Change Email</button>
                </form>
            </SettingsSection>
            <SettingsSection title="Change Password">
                 <form onSubmit={handlePasswordChange} className="space-y-4">
                     <input type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full max-w-sm bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                     <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full max-w-sm bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                     <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className="w-full max-w-sm bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                     <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Update Password</button>
                </form>
            </SettingsSection>
            <SettingsSection title="Danger Zone">
                <DangerZone title="Delete This Account" subtitle="Once you delete your account, there is no going back. Please be certain." buttonText="Delete Account..." onAction={() => setIsDeleteModalOpen(true)} />
            </SettingsSection>

             {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-secondary p-6 rounded-lg shadow-xl w-full max-w-lg border border-red-500/50">
                        <h2 className="text-xl font-bold text-red-300 flex items-center gap-2"><ExclamationTriangleIcon/> Confirm Account Deletion</h2>
                        <p className="text-brand-text-secondary mt-4">This action is irreversible. All your billable entries, matters, and settings will be permanently destroyed. To confirm, please enter your password and type <strong className="text-red-300">delete {user.email}</strong> in the box below.</p>
                        <div className="space-y-4 mt-6">
                             <input type="password" placeholder="Enter your password" value={passwordForDelete} onChange={e => setPasswordForDelete(e.target.value)} className="w-full bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                             <input type="text" placeholder={`Type "delete ${user.email}"`} value={confirmDeleteText} onChange={e => setConfirmDeleteText(e.target.value)} className="w-full bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white">Cancel</button>
                            <button onClick={handleDeleteAccount} className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white">Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SecurityTab: React.FC<{user: User, session: Session}> = ({ user, session }) => {
    const { enableTwoFactor, verifyTwoFactor, disableTwoFactor, logoutSession, logoutAllOtherSessions, registerPasskey, deletePasskey } = useAuth();
    const { addNotification } = useNotification();
    const [twoFactorSetup, setTwoFactorSetup] = useState<{secret: string, qrCode: string} | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [passwordFor2FA, setPasswordFor2FA] = useState('');
    
    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);

    useEffect(() => {
        async function fetchData() {
            if(user) {
                const [history, userPasskeys] = await Promise.all([
                    supabaseClient.auth.getActiveSessions(user.id),
                    supabaseClient.auth.getPasskeys(user.id)
                ]);
                setLoginHistory(history);
                setPasskeys(userPasskeys);
            }
        }
        fetchData();
    }, [user]);
    
    const handleEnable2FA = async () => {
        const { data, error } = await enableTwoFactor();
        if(error) addNotification(error.message, NotificationType.Error);
        else if(data) setTwoFactorSetup(data);
    };
    
    const handleVerify2FA = async () => {
        const { error } = await verifyTwoFactor({ userId: user.id, code: verificationCode });
        if (error) addNotification(error.message, NotificationType.Error);
        else {
            addNotification("2FA enabled successfully!", NotificationType.Success);
            setTwoFactorSetup(null);
            setVerificationCode('');
        }
    };
    
    const handleDisable2FA = async () => {
        const { error } = await disableTwoFactor({ userId: user.id, password: passwordFor2FA });
        if(error) addNotification(error.message, NotificationType.Error);
        else {
            addNotification("2FA disabled.", NotificationType.Success);
            setPasswordFor2FA('');
        }
    };

    const handleRegisterPasskey = async () => {
        const deviceName = prompt("Enter a name for this device (e.g., 'My Work Laptop'):");
        if (deviceName) {
            const { error } = await registerPasskey({ userId: user.id, deviceName });
            if (error) addNotification(error.message, NotificationType.Error);
            else {
                addNotification("Passkey registered successfully!", NotificationType.Success);
                const userPasskeys = await supabaseClient.auth.getPasskeys(user.id);
                setPasskeys(userPasskeys);
            }
        }
    };

    const handleDeletePasskey = async (passkeyId: string) => {
        if(window.confirm("Are you sure you want to remove this passkey?")) {
            const { error } = await deletePasskey({ userId: user.id, passkeyId });
            if (error) addNotification(error.message, NotificationType.Error);
            else {
                addNotification("Passkey removed.", NotificationType.Info);
                setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
            }
        }
    }
    
    const renderDeviceIcon = (device: string) => {
        if (device.toLowerCase().includes('mobile')) return <DevicePhoneMobileIcon className="h-6 w-6 text-brand-text-secondary" />;
        return <ComputerDesktopIcon className="h-6 w-6 text-brand-text-secondary" />;
    };

    if (twoFactorSetup) {
        return (
            <SettingsSection title="Set up Two-Factor Authentication">
                <p className="text-sm text-brand-text-secondary">Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy), then enter the 6-digit code to verify.</p>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <img src={twoFactorSetup.qrCode} alt="2FA QR Code" className="bg-white p-2 rounded-lg"/>
                    <div className="space-y-4 flex-grow">
                        <p className="text-sm text-brand-text-secondary">Or manually enter this key:</p>
                        <p className="font-mono bg-brand-primary p-2 rounded-md text-brand-accent">{twoFactorSetup.secret}</p>
                        <input type="text" placeholder="6-digit code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full max-w-xs bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setTwoFactorSetup(null)} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white">Cancel</button>
                    <button onClick={handleVerify2FA} className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Verify & Enable</button>
                </div>
            </SettingsSection>
        );
    }
    
    return (
        <div className="space-y-8">
            <SettingsSection title="Two-Factor Authentication (2FA)">
                {user.twoFactorEnabled ? (
                    <div>
                        <p className="text-brand-text-secondary text-sm mb-4">2FA is enabled, enhancing your account security.</p>
                        <input type="password" placeholder="Enter password to disable" value={passwordFor2FA} onChange={e => setPasswordFor2FA(e.target.value)} className="w-full max-w-xs bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text mb-4" />
                        <button onClick={handleDisable2FA} className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white">Disable 2FA</button>
                    </div>
                ) : (
                    <div>
                        <p className="text-brand-text-secondary text-sm mb-4">Add an extra layer of security to your account. You'll need an authenticator app to continue.</p>
                        <button onClick={handleEnable2FA} className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Enable 2FA</button>
                    </div>
                )}
            </SettingsSection>
             <SettingsSection title="Passkeys (Passwordless Login)">
                 <p className="text-brand-text-secondary text-sm mb-4">Register devices to log in securely with your fingerprint, face, or a hardware key instead of a password.</p>
                 <div className="space-y-3">
                     {passkeys.map(pk => (
                         <div key={pk.id} className="flex items-center justify-between bg-brand-primary p-3 rounded-md">
                             <div className="flex items-center gap-3">
                                <FingerPrintIcon className="h-6 w-6 text-brand-accent"/>
                                <div>
                                    <p className="font-medium text-brand-text">{pk.deviceName}</p>
                                    <p className="text-xs text-brand-text-secondary">Added on {new Date(pk.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <button onClick={() => handleDeletePasskey(pk.id)} className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-600 hover:bg-red-600 text-white">Remove</button>
                         </div>
                     ))}
                 </div>
                 <button onClick={handleRegisterPasskey} className="mt-4 px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Register This Device</button>
            </SettingsSection>
            <SettingsSection title="Active Sessions">
                <button onClick={() => logoutAllOtherSessions(session.sessionId)} className="mb-4 px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white">Log Out All Other Devices</button>
                <div className="space-y-3">
                    {loginHistory.map(s => (
                        <div key={s.sessionId} className="flex items-center justify-between bg-brand-primary p-3 rounded-md">
                           <div className="flex items-center gap-4">
                               {renderDeviceIcon(s.device)}
                               <div>
                                   <p className="font-medium text-brand-text">{s.device} {s.sessionId === session.sessionId && <span className="text-xs text-green-400 font-bold">(This device)</span>}</p>
                                   <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                                       <GlobeAltIcon className="h-4 w-4" />
                                       <span>{s.ipAddress} &bull; Logged in {new Date(s.loggedInAt).toLocaleString()}</span>
                                   </div>
                               </div>
                           </div>
                           {s.sessionId !== session.sessionId && (
                             <button onClick={() => logoutSession(s.sessionId)} className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-600 hover:bg-red-600 text-white">Revoke</button>
                           )}
                        </div>
                    ))}
                </div>
            </SettingsSection>
        </div>
    );
};

// --- Billing Tab & Rule Editor ---

const RuleEditor: React.FC<{
    rule?: BillingRule;
    onSave: (rule: BillingRule) => void;
    onCancel: () => void;
}> = ({ rule, onSave, onCancel }) => {
    const [localRule, setLocalRule] = useState<BillingRule>(
        rule || {
            id: `rule-${Date.now()}`,
            actionType: BillingRuleActionType.ROUND_UP_HOURS,
            actionValue: 0.25,
            conditions: [{ type: BillingRuleConditionType.SUBJECT_CONTAINS, value: '' }],
        }
    );

    const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newActionType = e.target.value as BillingRuleActionType;
        let newActionValue: any = '';
        if (newActionType === BillingRuleActionType.ROUND_UP_HOURS || newActionType === BillingRuleActionType.SET_FIXED_HOURS) {
            newActionValue = 0.25;
        } else if (newActionType === BillingRuleActionType.AUTO_APPROVE_SYNC) {
            newActionValue = true;
        }
        setLocalRule(prev => ({ ...prev, actionType: newActionType, actionValue: newActionValue }));
    };

    const handleConditionChange = (index: number, field: 'type' | 'value', value: string) => {
        const newConditions = [...localRule.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setLocalRule(prev => ({ ...prev, conditions: newConditions }));
    };

    const addCondition = () => {
        setLocalRule(prev => ({
            ...prev,
            conditions: [...prev.conditions, { type: BillingRuleConditionType.SUBJECT_CONTAINS, value: '' }],
        }));
    };
    
    const removeCondition = (index: number) => {
        setLocalRule(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }));
    };

    const ActionValueInput = () => {
        switch (localRule.actionType) {
            case BillingRuleActionType.ROUND_UP_HOURS:
            case BillingRuleActionType.SET_FIXED_HOURS:
                return <input type="number" step="0.01" value={localRule.actionValue} onChange={e => setLocalRule(prev => ({ ...prev, actionValue: parseFloat(e.target.value) }))} className="bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text w-full" />;
            case BillingRuleActionType.IGNORE_SENDER_DOMAIN:
                return <input type="text" placeholder="e.g., myfirm.com" value={localRule.actionValue} onChange={e => setLocalRule(prev => ({ ...prev, actionValue: e.target.value }))} className="bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text w-full" />;
            default:
                return null;
        }
    };

    const actionOptions = [
        { value: BillingRuleActionType.AUTO_APPROVE_SYNC, label: 'Auto-Approve & Sync' },
        { value: BillingRuleActionType.ROUND_UP_HOURS, label: 'Round Up Hours' },
        { value: BillingRuleActionType.SET_FIXED_HOURS, label: 'Set Fixed Hours' },
        { value: BillingRuleActionType.IGNORE_SENDER_DOMAIN, label: 'Ignore Sender Domain' },
    ];
    
    const conditionOptions = [
        { value: BillingRuleConditionType.SUBJECT_CONTAINS, label: 'Subject Contains' },
        { value: BillingRuleConditionType.SENDER_DOMAIN_IS, label: 'Sender Domain Is' },
        { value: BillingRuleConditionType.BODY_CONTAINS, label: 'Body Contains' },
    ];
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-xl w-full max-w-2xl border border-slate-600">
                <h3 className="text-lg font-bold text-brand-text mb-4">{rule ? 'Edit' : 'Create'} Billing Rule</h3>
                <div className="space-y-4">
                    {/* Conditions */}
                    <div>
                        <label className="block text-sm font-bold text-brand-text-secondary mb-2">IF ALL OF THESE ARE TRUE...</label>
                        <div className="space-y-2">
                        {localRule.conditions.map((cond, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <select value={cond.type} onChange={e => handleConditionChange(index, 'type', e.target.value)} className="bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-sm text-brand-text">
                                    {conditionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <input type="text" value={cond.value} onChange={e => handleConditionChange(index, 'value', e.target.value)} placeholder="Value..." className="flex-grow bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-sm text-brand-text" />
                                <button onClick={() => removeCondition(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md"><XMarkIcon className="h-5 w-5"/></button>
                            </div>
                        ))}
                        </div>
                        <button onClick={addCondition} className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline">
                            <PlusIcon className="h-4 w-4" /> Add Condition
                        </button>
                    </div>

                    {/* Action */}
                    <div>
                        <label className="block text-sm font-bold text-brand-text-secondary mb-2">THEN DO THIS...</label>
                        <div className="flex gap-2 items-center">
                            <select value={localRule.actionType} onChange={handleActionChange} className="bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-brand-text text-sm">
                                {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <ActionValueInput />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-white">Cancel</button>
                    <button onClick={() => onSave(localRule)} className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Save Rule</button>
                </div>
            </div>
        </div>
    );
};


const BillingTab: React.FC<{
    matters: Matter[];
    setMatters: React.Dispatch<React.SetStateAction<Matter[]>>;
    defaultRate: number;
    setDefaultRate: (rate: number) => void;
    initialRuleToEdit: { rule: BillingRule, matterName: string } | null;
    onClearInitialRule: () => void;
}> = ({ matters, setMatters, defaultRate, setDefaultRate, initialRuleToEdit, onClearInitialRule }) => {
    const [newMatterName, setNewMatterName] = useState('');
    const [newMatterRate, setNewMatterRate] = useState<number | string>(defaultRate);
    const [editingRule, setEditingRule] = useState<{matterName: string, rule?: BillingRule} | null>(null);
    const { addNotification } = useNotification();
    
    useEffect(() => {
        if (initialRuleToEdit) {
            const { rule, matterName } = initialRuleToEdit;
            // AI may return actionValue as a string, let's parse it
            const parsedRule = { ...rule };
            if (typeof parsedRule.actionValue === 'string') {
                if (parsedRule.actionType === BillingRuleActionType.ROUND_UP_HOURS || parsedRule.actionType === BillingRuleActionType.SET_FIXED_HOURS) {
                    parsedRule.actionValue = parseFloat(parsedRule.actionValue) || 0;
                } else if (parsedRule.actionType === BillingRuleActionType.AUTO_APPROVE_SYNC) {
                    parsedRule.actionValue = parsedRule.actionValue.toLowerCase() === 'true';
                }
            }
            setEditingRule({ matterName, rule: parsedRule });
            onClearInitialRule();
        }
    }, [initialRuleToEdit, onClearInitialRule]);

    const handleAddMatter = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMatterName && !matters.find(m => m.name === newMatterName) && Number(newMatterRate) > 0) {
            setMatters(prev => [...prev, { name: newMatterName, rate: Number(newMatterRate), billingRules: [] }]);
            setNewMatterName('');
            setNewMatterRate(defaultRate);
            addNotification(`Matter "${newMatterName}" added.`, NotificationType.Success);
        } else {
            addNotification('Matter name must be unique and rate must be positive.', NotificationType.Error);
        }
    };

    const handleRemoveMatter = (matterName: string) => {
        setMatters(prev => prev.filter(m => m.name !== matterName));
        addNotification(`Matter "${matterName}" removed.`, NotificationType.Info);
    };

    const handleSaveRule = (matterName: string) => (ruleToSave: BillingRule) => {
        setMatters(prev => prev.map(matter => {
            if (matter.name === matterName) {
                const existingRuleIndex = matter.billingRules.findIndex(r => r.id === ruleToSave.id);
                const newRules = [...matter.billingRules];
                if (existingRuleIndex > -1) {
                    newRules[existingRuleIndex] = ruleToSave;
                } else {
                    newRules.push(ruleToSave);
                }
                return { ...matter, billingRules: newRules };
            }
            return matter;
        }));
        setEditingRule(null);
    };
    
    const handleDeleteRule = (matterName: string, ruleId: string) => {
        setMatters(prev => prev.map(m => {
            if (m.name === matterName) {
                return {...m, billingRules: m.billingRules.filter(r => r.id !== ruleId)};
            }
            return m;
        }));
    };
    
    const getRuleDescription = (rule: BillingRule) => {
        const conditions = rule.conditions.map(c => {
            const type = Object.entries(BillingRuleConditionType).find(([, val]) => val === c.type)?.[0].replace(/_/g, ' ').toLowerCase() || '';
            return `if ${type} "${c.value}"`;
        }).join(' and ');
        
        let action = '';
        switch(rule.actionType) {
            case BillingRuleActionType.AUTO_APPROVE_SYNC: action = 'auto-approve & sync'; break;
            case BillingRuleActionType.IGNORE_SENDER_DOMAIN: action = `ignore domain "${rule.actionValue}"`; break;
            case BillingRuleActionType.ROUND_UP_HOURS: action = `round hours to ${rule.actionValue}`; break;
            case BillingRuleActionType.SET_FIXED_HOURS: action = `set fixed hours to ${rule.actionValue}`; break;
        }
        return `${conditions}, then ${action}.`;
    };

    return (
        <div className="space-y-8">
            <SettingsSection title="Billing Preferences">
                <div>
                   <label htmlFor="default-rate" className="block text-sm font-medium text-brand-text-secondary mb-2">Default Hourly Rate ($)</label>
                   <input
                     id="default-rate"
                     type="number"
                     value={defaultRate}
                     onChange={(e) => setDefaultRate(Number(e.target.value))}
                     className="w-full max-w-xs bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
                   />
                   <p className="text-xs text-brand-text-secondary mt-2">This rate is used for entries with no specific matter assigned.</p>
                </div>
            </SettingsSection>
            <SettingsSection title="Matter &amp; Rules Management" subtitle="Add matters and define automation rules for each.">
                <div className="bg-brand-secondary p-4 rounded-lg">
                    <h4 className="text-base font-semibold text-brand-text mb-3">Add New Matter</h4>
                    <form onSubmit={handleAddMatter} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label htmlFor="matter-name" className="block text-sm font-medium text-brand-text-secondary mb-1">Matter Name</label>
                        <input id="matter-name" type="text" value={newMatterName} onChange={e => setNewMatterName(e.target.value)} placeholder="e.g. Johnson v. Smith Discovery" className="w-full bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-brand-text"/>
                      </div>
                      <div>
                        <label htmlFor="matter-rate" className="block text-sm font-medium text-brand-text-secondary mb-1">Hourly Rate ($)</label>
                        <div className="relative">
                          <CurrencyDollarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
                          <input id="matter-rate" type="number" value={newMatterRate} onChange={e => setNewMatterRate(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 450" className="w-full bg-brand-primary border border-slate-600 rounded-md pl-8 pr-3 py-2 text-brand-text"/>
                        </div>
                      </div>
                      <button type="submit" className="md:col-span-3 px-4 py-2 mt-2 font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white">Add Matter</button>
                    </form>
                </div>

                <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
                    {matters.map(matter => (
                        <div key={matter.name} className="bg-brand-secondary p-4 rounded-lg">
                            <div className="flex items-center justify-between border-b border-slate-600 pb-3 mb-3">
                                <div className="flex items-center">
                                    <FolderIcon className="w-6 h-6 text-brand-accent mr-3"/>
                                    <div>
                                        <p className="text-base text-brand-text font-semibold">{matter.name}</p>
                                        <p className="text-sm text-brand-text-secondary">${matter.rate}/hr</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveMatter(matter.name)} className="p-1 text-brand-text-secondary hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                            
                            <h5 className="text-sm font-semibold text-brand-text-secondary mb-2">Billing Rules ({matter.billingRules?.length || 0})</h5>
                            <div className="space-y-2">
                                {matter.billingRules?.map(rule => (
                                    <div key={rule.id} className="flex justify-between items-center bg-brand-primary p-2 rounded-md text-xs">
                                        <p className="text-brand-text-secondary italic">{getRuleDescription(rule)}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingRule({matterName: matter.name, rule})} className="p-1 hover:text-brand-accent"><PencilIcon className="h-4 w-4"/></button>
                                            <button onClick={() => handleDeleteRule(matter.name, rule.id)} className="p-1 hover:text-red-400"><TrashIcon className="h-4 w-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                 <button onClick={() => setEditingRule({matterName: matter.name})} className="w-full mt-2 px-4 py-2 text-sm font-semibold rounded-md border border-dashed border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white transition-colors">
                                    + Add Rule
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </SettingsSection>
            
            {editingRule && (
                <RuleEditor
                    rule={editingRule.rule}
                    onSave={handleSaveRule(editingRule.matterName)}
                    onCancel={() => setEditingRule(null)}
                />
            )}
        </div>
    );
};


const AutomationTab: React.FC<{
    isAutoPilotEnabled: boolean;
    setIsAutoPilotEnabled: (enabled: boolean) => void;
    isPersonalizationEnabled: boolean;
    setIsPersonalizationEnabled: (enabled: boolean) => void;
    autoSyncThreshold: number;
    setAutoSyncThreshold: (value: number) => void;
    aiPersona: AIPersona;
    setAiPersona: (persona: AIPersona) => void;
}> = (props) => (
    <SettingsSection title="Automation & AI">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-base font-medium text-brand-text flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5 text-brand-accent"/>
                    AI Persona
                </h3>
                <p className="text-sm text-brand-text-secondary mt-1 max-w-md">Choose the default personality for the AI when drafting emails. This affects the tone, formality, and vocabulary.</p>
            </div>
            <select 
              value={props.aiPersona} 
              onChange={e => props.setAiPersona(e.target.value as AIPersona)}
              className="w-full max-w-xs bg-brand-secondary border border-slate-600 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
            >
                <option value={AIPersona.NeutralAssociate}>Neutral Associate</option>
                <option value={AIPersona.FormalPartner}>Formal Partner</option>
                <option value={AIPersona.ConciseSeniorCounsel}>Concise Senior Counsel</option>
                <option value={AIPersona.AccommodatingColleague}>Accommodating Colleague</option>
            </select>
        </div>
        <div className="border-t border-slate-700 my-4"></div>
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-base font-medium text-brand-text flex items-center gap-2">
                    <CpuChipIcon className="w-5 h-5 text-brand-accent"/>
                    Auto-Pilot Mode
                </h3>
                <p className="text-sm text-brand-text-secondary mt-1 max-w-md">Automatically scan your inbox and create draft billable entries for high-confidence items. This runs in the background.</p>
            </div>
            <ToggleSwitch enabled={props.isAutoPilotEnabled} setEnabled={props.setIsAutoPilotEnabled} />
        </div>

        <div className="border-t border-slate-700 my-4"></div>
        
        <div className={`transition-opacity duration-300 ${props.isAutoPilotEnabled ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-medium text-brand-text flex items-center gap-2">
                        <WandIcon className="w-5 h-5 text-brand-accent"/>
                        Confidence-based Auto-Sync
                    </h3>
                    <p className="text-sm text-brand-text-secondary mt-1 max-w-md">When Auto-Pilot is on, automatically sync entries if the AI's confidence score is above your chosen threshold.</p>
                </div>
                <div className="flex-shrink-0 w-32 text-right">
                    <span className="font-bold text-lg text-brand-text">{Math.round(props.autoSyncThreshold * 100)}%</span>
                    <p className="text-xs text-brand-text-secondary">Confidence Threshold</p>
                </div>
            </div>
            <div className="mt-2">
                <input 
                    type="range" 
                    min="0.7" 
                    max="1.0" 
                    step="0.01"
                    value={props.autoSyncThreshold}
                    onChange={e => props.setAutoSyncThreshold(Number(e.target.value))}
                    disabled={!props.isAutoPilotEnabled}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:bg-brand-accent [&::-moz-range-thumb]:bg-brand-accent"
                />
            </div>
        </div>
        
        <div className="border-t border-slate-700 my-4"></div>

        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-base font-medium text-brand-text flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-brand-accent"/>
                    AI Personalization
                </h3>
                <p className="text-sm text-brand-text-secondary mt-1 max-w-md">Allow InvoLex to learn from your edits to improve the accuracy and style of future suggestions.</p>
            </div>
            <ToggleSwitch enabled={props.isPersonalizationEnabled} setEnabled={props.setIsPersonalizationEnabled} />
        </div>
    </SettingsSection>
);

const IntegrationsTab: React.FC<{
    activeIntegration: PracticeManagementTool | null;
    setActiveIntegration: (tool: PracticeManagementTool | null) => void;
}> = ({ activeIntegration, setActiveIntegration }) => {
  const [isConnecting, setIsConnecting] = useState<PracticeManagementTool | null>(null);
  const { addNotification } = useNotification();
  const handleConnect = (tool: PracticeManagementTool) => {
    setIsConnecting(tool);
    setTimeout(() => {
      setActiveIntegration(tool);
      setIsConnecting(null);
      addNotification(`Successfully connected to ${tool}.`, NotificationType.Success);
    }, 1500);
  };
  const integrations = [
    { tool: PracticeManagementTool.Clio, logo: <ClioLogo className="h-8 w-8" />, description: 'The leading cloud-based legal practice management software.' },
    { tool: PracticeManagementTool.PracticePanther, logo: <PracticePantherLogo className="h-8 w-8" />, description: 'Simple, user-friendly law practice management software.' },
    { tool: PracticeManagementTool.MyCase, logo: <MyCaseLogo className="h-8 w-8" />, description: 'All-in-one case management software for your law firm.' },
  ];
  return (
    <SettingsSection title="Integrations">
       {integrations.map(({ tool, logo, description }) => (
            <div key={tool} className={`p-5 rounded-lg border-2 ${activeIntegration === tool ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-700 bg-brand-primary'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-brand-secondary">{logo}</div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-brand-text">{tool}</h3>
                        {activeIntegration === tool && <div className="flex items-center text-xs text-green-400 font-medium mt-1"><CheckCircleIcon className="w-4 h-4 mr-1"/>Connected</div>}
                    </div>
                    </div>
                    <button onClick={() => handleConnect(tool)} disabled={activeIntegration === tool || !!isConnecting} className={`px-4 py-2 text-sm font-semibold rounded-md w-28 h-10 flex items-center justify-center ${activeIntegration === tool ? 'bg-green-500 text-white cursor-default' : isConnecting ? 'bg-brand-secondary cursor-wait' : 'bg-brand-accent hover:bg-brand-accent-hover text-white'}`}>
                    {isConnecting === tool ? <Spinner size="small" /> : (activeIntegration === tool ? 'Active' : 'Connect')}
                    </button>
                </div>
                <p className="text-sm text-brand-text-secondary mt-4">{description}</p>
            </div>
        ))}
    </SettingsSection>
  );
};


interface SettingsViewProps {
  user: User;
  session: Session;
  activeIntegration: PracticeManagementTool | null;
  setActiveIntegration: (tool: PracticeManagementTool | null) => void;
  isAutoPilotEnabled: boolean;
  setIsAutoPilotEnabled: (enabled: boolean) => void;
  isPersonalizationEnabled: boolean;
  setIsPersonalizationEnabled: (enabled: boolean) => void;
  autoSyncThreshold: number;
  setAutoSyncThreshold: (value: number) => void;
  aiPersona: AIPersona;
  setAiPersona: (persona: AIPersona) => void;
  matters: Matter[];
  setMatters: React.Dispatch<React.SetStateAction<Matter[]>>;
  defaultRate: number;
  setDefaultRate: (rate: number) => void;
  initialRuleToEdit: { rule: BillingRule, matterName: string } | null;
  onClearInitialRule: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Billing');

  const tabs: { name: SettingsTab, icon: React.ReactNode }[] = [
    { name: 'Account', icon: <UserCircleIcon className="w-5 h-5"/> },
    { name: 'Security', icon: <KeyIcon className="w-5 h-5"/> },
    { name: 'Billing', icon: <ScaleIcon className="w-5 h-5"/> },
    { name: 'Automation', icon: <SparklesIcon className="w-5 h-5"/> },
    { name: 'Integrations', icon: <CheckCircleIcon className="w-5 h-5"/> },
  ];
  
  // When a rule suggestion is passed in, switch to the Billing tab
  useEffect(() => {
    if (props.initialRuleToEdit) {
      setActiveTab('Billing');
    }
  }, [props.initialRuleToEdit]);

  const renderContent = () => {
      switch(activeTab) {
          case 'Account': return <AccountTab user={props.user} />;
          case 'Security': return <SecurityTab user={props.user} session={props.session}/>;
          case 'Billing': return <BillingTab matters={props.matters} setMatters={props.setMatters} defaultRate={props.defaultRate} setDefaultRate={props.setDefaultRate} initialRuleToEdit={props.initialRuleToEdit} onClearInitialRule={props.onClearInitialRule} />;
          case 'Automation': return <AutomationTab isAutoPilotEnabled={props.isAutoPilotEnabled} setIsAutoPilotEnabled={props.setIsAutoPilotEnabled} isPersonalizationEnabled={props.isPersonalizationEnabled} setIsPersonalizationEnabled={props.setIsPersonalizationEnabled} autoSyncThreshold={props.autoSyncThreshold} setAutoSyncThreshold={props.setAutoSyncThreshold} aiPersona={props.aiPersona} setAiPersona={props.setAiPersona} />;
          case 'Integrations': return <IntegrationsTab activeIntegration={props.activeIntegration} setActiveIntegration={props.setActiveIntegration} />;
          default: return null;
      }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4 lg:w-1/5">
            <h1 className="text-2xl font-bold text-brand-text mb-6">Settings</h1>
            <nav className="space-y-1">
                {tabs.map(tab => (
                    <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.name ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-primary'}`}
                    >
                        {tab.icon}
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>
        <div className="flex-1">
            {renderContent()}
        </div>
    </div>
  );
};

export default SettingsView;
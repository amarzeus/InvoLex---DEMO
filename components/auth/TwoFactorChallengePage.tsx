
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useNotification } from '../../contexts/NotificationContext';
import { InvoLexLogo, KeyIcon } from '../icons/Icons';
import { NotificationType } from '../../types';
import Spinner from '../ui/Spinner';

const TwoFactorChallengePage: React.FC = () => {
    const { user, verifyTwoFactor, logout } = useAuth();
    const { addNotification } = useNotification();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await verifyTwoFactor({ userId: user!.id, code });
        if (error) {
            addNotification(error.message, NotificationType.Error);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-primary p-4">
            <div className="w-full max-w-sm space-y-8 text-center">
                <InvoLexLogo className="mx-auto h-16 w-auto text-brand-accent" />
                <div className="bg-brand-secondary p-8 rounded-lg shadow-xl">
                    <KeyIcon className="mx-auto h-12 w-12 text-brand-accent mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-brand-text">
                        Two-Factor Authentication
                    </h2>
                    <p className="mt-4 text-brand-text-secondary">
                        Enter the 6-digit code from your authenticator app for <strong className="text-brand-text">{user?.email}</strong>.
                    </p>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                            placeholder="123456"
                            className="w-full bg-brand-primary border border-slate-600 rounded-md px-3 py-3 text-brand-text text-center text-2xl tracking-[0.5em] focus:ring-brand-accent focus:border-brand-accent"
                        />
                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-accent py-3 px-4 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50"
                        >
                            {loading ? <Spinner size="small" /> : 'Verify'}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="text-sm font-medium text-brand-text-secondary hover:text-brand-text"
                        >
                            Cancel and Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorChallengePage;

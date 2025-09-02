
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useNotification } from '../../contexts/NotificationContext';
import { InvoLexLogo, EnvelopeOpenIcon } from '../icons/Icons';
import { NotificationType } from '../../types';
import Spinner from '../ui/Spinner';

const VerifyEmailPage: React.FC = () => {
    const { user, resendVerificationEmail, logout } = useAuth();
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        const { error } = await resendVerificationEmail();
        if (error) {
            addNotification(error.message, NotificationType.Error);
        } else {
            addNotification('A new verification email has been sent.', NotificationType.Success);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-primary p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <InvoLexLogo className="mx-auto h-16 w-auto text-brand-accent" />
                <div className="bg-brand-secondary p-8 rounded-lg shadow-xl">
                    <EnvelopeOpenIcon className="mx-auto h-12 w-12 text-brand-accent mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-brand-text">
                        Please verify your email
                    </h2>
                    <p className="mt-4 text-brand-text-secondary">
                        We've sent a verification link to <strong className="text-brand-text">{user?.email}</strong>. Please check your inbox (and spam folder) to continue.
                    </p>
                    <div className="mt-8 space-y-4">
                        <button
                            onClick={handleResend}
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-accent py-3 px-4 text-sm font-semibold text-white hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-secondary disabled:opacity-50"
                        >
                            {loading ? <Spinner size="small" /> : 'Resend Verification Email'}
                        </button>
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-brand-text-secondary hover:text-brand-text"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;

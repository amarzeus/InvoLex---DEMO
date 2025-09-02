
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { InvoLexLogo, EyeIcon, EyeSlashIcon, GoogleLogoIcon, MicrosoftLogoIcon, EnvelopeOpenIcon, FingerPrintIcon } from '../icons/Icons';
import Spinner from '../ui/Spinner';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const calculateStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  
  const strength = calculateStrength();
  const strengthLevels = [
    { label: '', color: 'bg-slate-500' }, { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' }, { label: 'Medium', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-green-500' }, { label: 'Very Strong', color: 'bg-emerald-500' },
  ];
  
  return (
    <div className="mt-2">
      <div className="flex w-full h-1.5 rounded-full overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex-1 transition-colors ${strength > i ? strengthLevels[strength].color : 'bg-slate-700'}`}></div>
        ))}
      </div>
      <p className={`text-xs mt-1 font-medium ${strength > 0 ? 'text-brand-text' : 'text-brand-text-secondary'}`}>
        {strengthLevels[strength].label}
      </p>
    </div>
  );
};

const AuthPage: React.FC = () => {
  type AuthView = 'login' | 'signup' | 'forgot' | 'magic-link' | 'passkey-login';
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [loading, setLoading] = useState<boolean | string>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, signup, sendMagicLink, socialLogin, loginWithPasskey } = useAuth();
  const { addNotification } = useNotification();

  const validate = (currentView: AuthView) => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address is invalid.';

    if (currentView === 'login' || currentView === 'signup') {
        if (!password) newErrors.password = 'Password is required.';
        else if (currentView === 'signup' && password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    }
    if (currentView === 'signup') {
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
        if (!termsAgreed) newErrors.terms = 'You must agree to the terms.';
        if (!captchaChecked) newErrors.captcha = 'Please confirm you are not a robot.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(view)) return;
    
    setLoading(true);
    const { error } = view === 'login' ? await login({ email, password }) : await signup({ email, password });
    if (error) addNotification(error.message, NotificationType.Error);
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    setLoading(provider);
    await socialLogin({ provider });
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate('magic-link')) return;
    setLoading('magic-link');
    const { error } = await sendMagicLink({ email });
    if(error) addNotification(error.message, NotificationType.Error);
    else {
        addNotification("Check your inbox for a magic login link!", NotificationType.Success);
        setView('login');
    }
    setLoading(false);
  }
  
  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate('passkey-login')) return;
    setLoading('passkey');
    const { error } = await loginWithPasskey({ email });
    if(error) addNotification(error.message, NotificationType.Error);
    setLoading(false);
  };

  const SocialButton: React.FC<{provider: 'google' | 'microsoft', icon: React.ReactNode, text: string}> = ({ provider, icon, text }) => (
    <button type="button" onClick={() => handleSocialLogin(provider)} disabled={!!loading}
        className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-slate-600 rounded-md shadow-sm bg-brand-secondary text-sm font-medium text-brand-text hover:bg-slate-700 disabled:opacity-50">
        {loading === provider ? <Spinner size="small" /> : <>{icon} <span className="ml-3">{text}</span></>}
    </button>
  );

  const renderContent = () => {
      switch(view) {
          case 'magic-link': return renderMagicLinkForm();
          case 'passkey-login': return renderPasskeyForm();
          default: return renderEmailPasswordForm();
      }
  }
  
  const renderMagicLinkForm = () => (
      <form className="mt-8 space-y-6" onSubmit={handleMagicLink}>
          <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={handleInputChange(setEmail, 'email')}
              className={`w-full rounded-md border bg-brand-secondary px-3 py-3 text-brand-text placeholder-brand-text-secondary focus:z-10 focus:outline-none focus:ring-brand-accent sm:text-sm ${errors.email ? 'border-red-500' : 'border-slate-600 focus:border-brand-accent'}`}
              placeholder="Email address"/>
          {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
          <button type="submit" disabled={!!loading} className="w-full flex justify-center rounded-md bg-brand-accent py-3 px-4 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50">
              {loading === 'magic-link' ? <Spinner size="small" /> : 'Send Magic Link'}
          </button>
      </form>
  )

  const renderPasskeyForm = () => (
      <form className="mt-8 space-y-6" onSubmit={handlePasskeyLogin}>
          <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={handleInputChange(setEmail, 'email')}
              className={`w-full rounded-md border bg-brand-secondary px-3 py-3 text-brand-text placeholder-brand-text-secondary focus:z-10 focus:outline-none focus:ring-brand-accent sm:text-sm ${errors.email ? 'border-red-500' : 'border-slate-600 focus:border-brand-accent'}`}
              placeholder="Enter your email to find your passkey"/>
          {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
          <button type="submit" disabled={!!loading} className="w-full flex justify-center rounded-md bg-brand-accent py-3 px-4 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50">
              {loading === 'passkey' ? <Spinner size="small" /> : 'Continue with Passkey'}
          </button>
      </form>
  )

  const renderEmailPasswordForm = () => (
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={handleInputChange(setEmail, 'email')}
                className={`w-full rounded-md border bg-brand-secondary px-3 py-3 text-brand-text placeholder-brand-text-secondary focus:z-10 focus:outline-none focus:ring-brand-accent sm:text-sm ${errors.email ? 'border-red-500' : 'border-slate-600 focus:border-brand-accent'}`}
                placeholder="Email address" />
              {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} required minLength={view === 'signup' ? 8 : undefined} value={password} onChange={handleInputChange(setPassword, 'password')}
                className={`w-full rounded-md border bg-brand-secondary px-3 py-3 text-brand-text placeholder-brand-text-secondary focus:z-10 focus:outline-none focus:ring-brand-accent sm:text-sm ${errors.password ? 'border-red-500' : 'border-slate-600 focus:border-brand-accent'}`}
                placeholder="Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-secondary hover:text-brand-text">
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
            {view === 'signup' && <PasswordStrengthMeter password={password} />}
            {view === 'signup' && (
              <div>
                <input id="confirm-password" required value={confirmPassword} onChange={handleInputChange(setConfirmPassword, 'confirmPassword')} type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-md border bg-brand-secondary px-3 py-3 text-brand-text placeholder-brand-text-secondary focus:z-10 focus:outline-none focus:ring-brand-accent sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-slate-600 focus:border-brand-accent'}`}
                  placeholder="Confirm Password" />
                {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>
            )}
          </div>

          {view === 'signup' && (
              <>
                <div className="flex items-start">
                    <input id="terms" name="terms" type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} className="h-4 w-4 mt-0.5 rounded border-slate-600 bg-brand-secondary text-brand-accent focus:ring-brand-accent" />
                    <label htmlFor="terms" className="ml-2 block text-sm text-brand-text-secondary">
                        I agree to the <button type="button" className="font-medium text-brand-accent hover:underline">Terms of Service</button>
                    </label>
                </div>
                 {errors.terms && <p className="-mt-4 text-xs text-red-400">{errors.terms}</p>}
                 <div className="flex items-start">
                    <input id="captcha" name="captcha" type="checkbox" checked={captchaChecked} onChange={e => setCaptchaChecked(e.target.checked)} className="h-4 w-4 mt-0.5 rounded border-slate-600 bg-brand-secondary text-brand-accent focus:ring-brand-accent" />
                    <label htmlFor="captcha" className="ml-2 block text-sm text-brand-text-secondary">I am not a robot</label>
                </div>
                 {errors.captcha && <p className="-mt-4 text-xs text-red-400">{errors.captcha}</p>}
              </>
          )}

          {view === 'login' && (
            <div className="text-right">
              <button type="button" onClick={() => setView('forgot')} className="text-sm font-medium text-brand-accent hover:underline">Forgot your password?</button>
            </div>
          )}

          <button type="submit" disabled={!!loading} className="w-full flex justify-center rounded-md bg-brand-accent py-3 px-4 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50">
              {loading === true ? <Spinner size="small" /> : (view === 'login' ? 'Sign In' : 'Create Account')}
          </button>
      </form>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-primary p-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
            <InvoLexLogo className="mx-auto h-16 w-auto text-brand-accent" />
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-brand-text">
                {view === 'signup' ? 'Create your InvoLex account' : 'Sign in to InvoLex'}
            </h2>
             <p className="mt-2 text-center text-sm text-brand-text-secondary">
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="font-medium text-brand-accent hover:underline">
                    {view === 'login' ? 'Sign up' : 'Sign in'}
                </button>
            </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
              <SocialButton provider="google" icon={<GoogleLogoIcon className="h-5 w-5" />} text="Google" />
              <SocialButton provider="microsoft" icon={<MicrosoftLogoIcon className="h-5 w-5" />} text="Microsoft" />
          </div>
          <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-brand-primary px-2 text-brand-text-secondary">OR</span></div>
          </div>
           <button type="button" onClick={() => setView('passkey-login')} disabled={!!loading} className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-slate-600 rounded-md shadow-sm bg-brand-secondary text-sm font-medium text-brand-text hover:bg-slate-700 disabled:opacity-50">
                <FingerPrintIcon className="h-5 w-5" /> <span className="ml-3">Sign in with a Passkey</span>
            </button>
        </div>

        {renderContent()}

        {view === 'login' && (
            <div className="text-center text-sm">
                <button onClick={() => setView('magic-link')} className="font-medium text-brand-accent hover:underline">Sign in with a Magic Link</button>
            </div>
        )}

      </div>
    </div>
  );
};

export default AuthPage;

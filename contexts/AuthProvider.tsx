
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Session, User } from '../types';
import { supabaseClient } from '../services/supabase';

type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'unverified' | 'awaiting-2fa';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userState: AuthState;
  loading: boolean;
  login: typeof supabaseClient.auth.login;
  signup: typeof supabaseClient.auth.signup;
  logout: () => Promise<void>;
  sendMagicLink: typeof supabaseClient.auth.sendMagicLink;
  socialLogin: typeof supabaseClient.auth.socialLogin;
  resendVerificationEmail: () => Promise<{ error: { message: string } | null }>;
  verifyTwoFactor: typeof supabaseClient.auth.verifyTwoFactorCode;
  enableTwoFactor: typeof supabaseClient.auth.enableTwoFactor;
  disableTwoFactor: typeof supabaseClient.auth.disableTwoFactor;
  logoutSession: (sessionId: string) => Promise<void>;
  logoutAllOtherSessions: (currentSessionId: string) => Promise<void>;
  registerPasskey: typeof supabaseClient.auth.registerPasskey;
  deletePasskey: typeof supabaseClient.auth.deletePasskey;
  loginWithPasskey: typeof supabaseClient.auth.loginWithPasskey;
  changePassword: typeof supabaseClient.auth.changePassword;
  changeEmail: typeof supabaseClient.auth.changeEmail;
  deleteAccount: typeof supabaseClient.auth.deleteAccount;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userAwaiting2fa, setUserAwaiting2fa] = useState<User | null>(null);
  const [userState, setUserState] = useState<AuthState>('loading');
  
  const determineAuthState = (session: Session | null, userAwaiting2fa: User | null): AuthState => {
      if (userAwaiting2fa) return 'awaiting-2fa';
      if (!session || !session.user) return 'unauthenticated';
      if (!session.user.verified) return 'unverified';
      return 'authenticated';
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setUserState(determineAuthState(currentSession, userAwaiting2fa));
    };

    getSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (_event === 'USER_UPDATED') {
            // Don't change auth state on user update, just refresh user data
            return;
        }
        setUserState(determineAuthState(session, userAwaiting2fa));
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [userAwaiting2fa]);

  const login = async (credentials: any) => {
      const result = await supabaseClient.auth.login(credentials);
      if (result.error?.message.includes('2FA required')) {
          setUserAwaiting2fa(result.user);
          setUserState('awaiting-2fa');
      }
      return result;
  }

  const loginWithPasskey = async (credentials: any) => {
      const result = await supabaseClient.auth.loginWithPasskey(credentials);
      if (result.error?.message.includes('2FA required')) {
          setUserAwaiting2fa(result.user);
          setUserState('awaiting-2fa');
      }
      return result;
  }
  
  const socialLogin = async (credentials: any) => {
      const result = await supabaseClient.auth.socialLogin(credentials);
      // Social logins typically bypass 2FA for the initial login
      if (!result.error) {
          setUserAwaiting2fa(null);
      }
      return result;
  }

  const logout = useCallback(async () => {
    if(session) await supabaseClient.auth.logout(session.sessionId);
    setSession(null);
    setUser(null);
    setUserAwaiting2fa(null);
    setUserState('unauthenticated');
  }, [session]);

  const resendVerificationEmail = useCallback(async () => {
      if(user) {
          return await supabaseClient.auth.resendVerificationEmail({ userId: user.id });
      }
      return { error: { message: 'No user is currently logged in.' }};
  }, [user]);

  const verifyTwoFactor = async (credentials: { code: string }) => {
      if(!userAwaiting2fa) return { error: { message: "No user awaiting 2FA verification." }};
      const result = await supabaseClient.auth.verifyTwoFactorCode({ userId: userAwaiting2fa.id, code: credentials.code });
      if (!result.error) {
          setUserAwaiting2fa(null);
      }
      return result;
  };
  
  const logoutSession = async (sessionId: string) => {
    if (!user) return;
    await supabaseClient.auth.logoutSession(user.id, sessionId);
    if(sessionId === session?.sessionId) {
        await logout();
    }
  }

  const logoutAllOtherSessions = async (currentSessionId: string) => {
      if (!user) return;
      await supabaseClient.auth.logoutAllOtherSessions(user.id, currentSessionId);
  };
  
  const deleteAccount = async (credentials: { password?: string }) => {
      if (!user) return { error: { message: 'No user is logged in' } };
      const result = await supabaseClient.auth.deleteAccount({ userId: user.id, password: credentials.password });
      if(!result.error) {
          await logout();
      }
      return result;
  }
  
  const value = {
    session,
    user: userAwaiting2fa || user, // Provide user object even in 2FA state
    userState,
    loading: userState === 'loading',
    login,
    signup: supabaseClient.auth.signup,
    logout,
    sendMagicLink: supabaseClient.auth.sendMagicLink,
    socialLogin,
    resendVerificationEmail,
    verifyTwoFactor,
    enableTwoFactor: supabaseClient.auth.enableTwoFactor,
    disableTwoFactor: supabaseClient.auth.disableTwoFactor,
    logoutSession,
    logoutAllOtherSessions,
    registerPasskey: supabaseClient.auth.registerPasskey,
    deletePasskey: supabaseClient.auth.deletePasskey,
    loginWithPasskey,
    changePassword: supabaseClient.auth.changePassword,
    changeEmail: supabaseClient.auth.changeEmail,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

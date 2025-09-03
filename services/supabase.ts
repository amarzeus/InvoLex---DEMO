import { Email, Correction, Matter, BillableEntry, BillableEntryStatus, User, Session, PracticeManagementTool, ActionItem, LoginHistory, Passkey, NotificationType, SyncDetails, AIPersona } from '../types';
import { emailService } from './emailService';

const SESSION_KEY = 'involex_session';
const DB_KEY = 'involex_db';

// --- DATABASE SIMULATION ---
const getDb = () => {
  try {
    const db = localStorage.getItem(DB_KEY);
    return db ? JSON.parse(db) : { users: [], data: {} };
  } catch (e) {
    return { users: [], data: {} };
  }
};

const saveDb = (db: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const seedUserData = (userId: string) => {
  const db = getDb();
  if (!db.data[userId]) {
    db.data[userId] = {
      billable_entries: [],
      matters: [
        { name: 'Case #12345-A', rate: 400, billingRules: [] }, 
        { name: 'Acme Corp Merger', rate: 550, billingRules: [] },
        { name: 'Smith v. Johnson', rate: 375, billingRules: [] },
      ],
      corrections: [],
      settings: {
        activeIntegration: PracticeManagementTool.Clio,
        isAutoPilotEnabled: false,
        isPersonalizationEnabled: true,
        defaultRate: 350,
        autoSyncThreshold: 0.95,
        aiPersona: AIPersona.NeutralAssociate,
        emailProvider: 'mock',
      }
    };
    saveDb(db);
  }
};

// --- AUTH SIMULATION ---
let onAuthStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
const _getDeviceType = () => navigator.userAgent;
const _generateRecoveryCodes = () => Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10));

const auth = {
  // --- Core Auth ---
  async signup({ email, password }: Record<string, string>) {
    const db = getDb();
    if (db.users.find((u: any) => u.email === email)) {
      return { user: null, session: null, error: { message: 'An account with this email already exists.' } };
    }
    const user: User = { 
      id: `user-${Date.now()}`, email, verified: false, 
      twoFactorEnabled: false, passkeys: [], activeSessions: [], loginHistory: [] 
    };
    db.users.push({ ...user, password });
    saveDb(db);
    seedUserData(user.id);
    await this.sendVerificationEmail({ userId: user.id });
    const session = this._createSession(user);
    if (onAuthStateChangeCallback) onAuthStateChangeCallback('SIGNED_IN', session);
    return { user, session, error: null };
  },

  async login({ email, password }: Record<string, string>) {
    const db = getDb();
    const userRecord = db.users.find((u: any) => u.email === email && u.password === password);
    if (!userRecord) return { error: { message: 'Invalid credentials.' } };
    if (userRecord.twoFactorEnabled) return { user: userRecord, error: { message: '2FA required' } };
    return this._finalizeLogin(userRecord);
  },

  async loginWithPasskey({ email }: { email: string }) {
      const db = getDb();
      const userRecord = db.users.find((u: any) => u.email === email);
      if (!userRecord || userRecord.passkeys.length === 0) return { error: { message: 'No passkey found for this account.' } };
      if (userRecord.twoFactorEnabled) return { user: userRecord, error: { message: '2FA required' } };
      return this._finalizeLogin(userRecord);
  },

  async socialLogin({ provider }: { provider: 'google' | 'microsoft' }) {
      const db = getDb();
      const email = `social-${provider}-${Date.now().toString().slice(-4)}@example.com`;
      let userRecord = db.users.find((u:any) => u.email === email);
      if(!userRecord) {
        const user: User = { id: `user-${Date.now()}`, email, verified: true, twoFactorEnabled: false, passkeys: [], activeSessions: [], loginHistory: [] };
        db.users.push({ ...user, password: 'social_login_no_password' });
        saveDb(db);
        seedUserData(user.id);
        userRecord = user;
      }
      return this._finalizeLogin(userRecord);
  },

  async logout(sessionId: string) {
    const session = await this.getSession();
    if(session?.data?.session?.user) {
        this._removeActiveSession(session.data.session.user.id, sessionId);
    }
    localStorage.removeItem(SESSION_KEY);
    if (onAuthStateChangeCallback) onAuthStateChangeCallback('SIGNED_OUT', null);
    return { error: null };
  },

  onAuthStateChange: (cb: any) => {
    onAuthStateChangeCallback = cb;
    return { data: { subscription: { unsubscribe: () => { onAuthStateChangeCallback = null; } } } };
  },
  
  // --- Session & Verification ---
  async getSession() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      const session: Session | null = sessionStr ? JSON.parse(sessionStr) : null;
      if (session) { // Refresh user data in session
        const db = getDb();
        const user = db.users.find((u: User) => u.id === session.user.id);
        if (user) session.user = this._sanitizeUser(user);
      }
      return { data: { session }, error: null };
    } catch { return { data: { session: null }, error: null }; }
  },

  async sendVerificationEmail({ userId }: { userId: string }) {
    // In real app, this sends an email. Here we use a notification.
    setTimeout(() => {
      const { addNotification } = (window as any).notificationContext;
      addNotification('Click to verify your email', NotificationType.Info, {
        label: "Verify Email", onClick: async () => {
          await this.verifyEmail({ userId });
          addNotification('Email verified successfully! You can now log in.', NotificationType.Success);
        }
      });
    }, 1000);
    return { data: {}, error: null };
  },

  async verifyEmail({ userId }: { userId: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: User) => u.id === userId);
      if(userIndex > -1) {
          db.users[userIndex].verified = true;
          saveDb(db);
          // If user is currently in unverified state, log them out to force re-login
          const currentSession = await this.getSession();
          if(currentSession?.data?.session?.user?.id === userId) {
             await this.logout(currentSession.data.session.sessionId);
          }
      }
      return { user: db.users[userIndex], error: null };
  },
  
  async resendVerificationEmail({ userId }: { userId: string }) {
      return this.sendVerificationEmail({ userId });
  },

  // --- Passwordless & 2FA ---
  async sendMagicLink({ email }: { email: string }) {
    const db = getDb();
    const user = db.users.find((u: any) => u.email === email);
    if (!user) return { error: { message: 'No account found with this email.' } };
    setTimeout(() => {
      const { addNotification } = (window as any).notificationContext;
      addNotification(`Magic Link for ${email}`, NotificationType.Info, {
        label: "Click to Log In", onClick: () => {
          this._finalizeLogin(user);
        }
      });
    }, 1000);
    return { data: {}, error: null };
  },

  async generateTwoFactorSecret() {
    const secret = 'MYSUPERSECRETKEY123';
    return { data: { secret, qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/InvoLex?secret=${secret}` }, error: null };
  },
  async enableTwoFactor() { return this.generateTwoFactorSecret(); },

  async verifyTwoFactorCode({ userId, code }: { userId: string, code: string }) {
    if (code !== '123456') return { error: { message: 'Invalid 2FA code.' } };
    const db = getDb();
    const userIndex = db.users.findIndex((u: User) => u.id === userId);
    if (userIndex > -1) {
      db.users[userIndex].twoFactorEnabled = true;
      db.users[userIndex].twoFactorSecret = 'MYSUPERSECRETKEY123';
      db.users[userIndex].recoveryCodes = _generateRecoveryCodes();
      saveDb(db);
      return this._finalizeLogin(db.users[userIndex]);
    }
    return { error: { message: 'User not found.' } };
  },

  async disableTwoFactor({ userId, password }: { userId: string, password?: string }) {
    const db = getDb();
    const userIndex = db.users.findIndex((u: any) => u.id === userId && u.password === password);
    if (userIndex > -1) {
      db.users[userIndex].twoFactorEnabled = false;
      delete db.users[userIndex].twoFactorSecret;
      delete db.users[userIndex].recoveryCodes;
      saveDb(db);
      if (onAuthStateChangeCallback) onAuthStateChangeCallback('USER_UPDATED', this._createSession(db.users[userIndex]));
      return { data: {}, error: null };
    }
    return { error: { message: 'Invalid password.' } };
  },

  // --- Passkeys ---
  async registerPasskey({ userId, deviceName }: { userId: string, deviceName: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: User) => u.id === userId);
      if (userIndex > -1) {
          db.users[userIndex].passkeys.push({ id: `passkey-${Date.now()}`, deviceName, createdAt: new Date().toISOString() });
          saveDb(db);
          if (onAuthStateChangeCallback) onAuthStateChangeCallback('USER_UPDATED', this._createSession(db.users[userIndex]));
          return { error: null };
      }
      return { error: { message: 'User not found' }};
  },
  async getPasskeys(userId: string): Promise<Passkey[]> {
      const db = getDb();
      const user = db.users.find((u:User) => u.id === userId);
      return user?.passkeys || [];
  },
  async deletePasskey({ userId, passkeyId }: { userId: string, passkeyId: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: User) => u.id === userId);
      if (userIndex > -1) {
          db.users[userIndex].passkeys = db.users[userIndex].passkeys.filter((p: Passkey) => p.id !== passkeyId);
          saveDb(db);
          if (onAuthStateChangeCallback) onAuthStateChangeCallback('USER_UPDATED', this._createSession(db.users[userIndex]));
          return { error: null };
      }
      return { error: { message: 'User not found' }};
  },

  // --- Account Management ---
  async changePassword({ userId, oldPassword, newPassword }: { userId: string, oldPassword?: string, newPassword?: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: any) => u.id === userId && u.password === oldPassword);
      if(userIndex > -1) {
          db.users[userIndex].password = newPassword;
          saveDb(db);
          return { error: null };
      }
      return { error: { message: 'Invalid old password.' }};
  },
  async changeEmail({ userId, newEmail, password }: { userId: string, newEmail?: string, password?: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: any) => u.id === userId && u.password === password);
      if (userIndex > -1) {
          const emailExists = db.users.some((u: any) => u.email === newEmail);
          if (emailExists) return { error: { message: 'Email already in use.' }};
          db.users[userIndex].email = newEmail;
          db.users[userIndex].verified = false;
          saveDb(db);
          await this.logout((await this.getSession())?.data.session?.sessionId || '');
          return { error: null };
      }
      return { error: { message: 'Invalid password.' }};
  },
  async deleteAccount({ userId, password }: { userId: string, password?: string }) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: any) => u.id === userId && u.password === password);
      if (userIndex > -1) {
          db.users.splice(userIndex, 1);
          delete db.data[userId];
          saveDb(db);
          return { error: null };
      }
      return { error: { message: 'Invalid password.' }};
  },

  // --- Device/Session Management ---
  async getActiveSessions(userId: string): Promise<LoginHistory[]> {
      const db = getDb();
      const user = db.users.find((u: User) => u.id === userId);
      return user?.activeSessions || [];
  },
  async logoutSession(userId: string, sessionId: string) {
      this._removeActiveSession(userId, sessionId);
      const session = await this.getSession();
      // If we remotely logged out the current session
      if(session?.data?.session?.sessionId === sessionId) {
          await this.logout(sessionId);
      }
  },
  async logoutAllOtherSessions(userId: string, currentSessionId: string) {
      const db = getDb();
      const userIndex = db.users.findIndex((u:User) => u.id === userId);
      if(userIndex > -1) {
          db.users[userIndex].activeSessions = db.users[userIndex].activeSessions.filter((s: LoginHistory) => s.sessionId === currentSessionId);
          saveDb(db);
          if (onAuthStateChangeCallback) onAuthStateChangeCallback('USER_UPDATED', this._createSession(db.users[userIndex]));
      }
  },
  
  // --- Private Helpers ---
  _createSession(userRecord: any): Session {
      const sanitizedUser = this._sanitizeUser(userRecord);
      const sessionId = `session-${Date.now()}`;
      const session: Session = { user: sanitizedUser, token: `mock-token-${Date.now()}`, sessionId };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
  },
  _finalizeLogin(userRecord: any) {
      const session = this._createSession(userRecord);
      this._addLoginHistory(userRecord.id, session.sessionId);
      if (onAuthStateChangeCallback) onAuthStateChangeCallback('SIGNED_IN', session);
      return { user: session.user, session, error: null };
  },
  _addLoginHistory(userId: string, sessionId: string) {
    const db = getDb();
    const userIndex = db.users.findIndex((u: User) => u.id === userId);
    if(userIndex > -1) {
        const newLogin: LoginHistory = {
            sessionId,
            loggedInAt: new Date().toISOString(),
            ipAddress: '192.168.1.1', // Mock IP
            device: _getDeviceType(),
        };
        db.users[userIndex].loginHistory.unshift(newLogin);
        db.users[userIndex].activeSessions.unshift(newLogin);
        db.users[userIndex].loginHistory = db.users[userIndex].loginHistory.slice(0, 10);
        saveDb(db);
    }
  },
  _removeActiveSession(userId: string, sessionId: string) {
      const db = getDb();
      const userIndex = db.users.findIndex((u: User) => u.id === userId);
      if (userIndex > -1) {
          db.users[userIndex].activeSessions = db.users[userIndex].activeSessions.filter((s: LoginHistory) => s.sessionId !== sessionId);
          saveDb(db);
      }
  },
  _sanitizeUser(userRecord: any): User {
      const sanitizedUser = { ...userRecord };
      delete sanitizedUser.password;
      return sanitizedUser;
  }
};


// --- DATA MANAGEMENT SIMULATION ---
const data = {
    async getBillableEntries(userId: string): Promise<BillableEntry[]> {
        const db = getDb();
        const entries = db.data[userId]?.billable_entries || [];
        // Add source for internal entries
        return entries.map((e: BillableEntry) => ({...e, source: 'InvoLex'}));
    },
    async fetchExternalEntries(userId: string, tool: PracticeManagementTool): Promise<BillableEntry[]> {
        // This is a simulation. In a real app, this would be an API call to Clio, etc.
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const mockExternalEntries: BillableEntry[] = [
            {
                id: `ext-${Date.now()}-1`,
                userId,
                description: 'Phone call with opposing counsel re: scheduling depositions.',
                hours: 0.5,
                rate: 400,
                matter: 'Case #12345-A',
                status: BillableEntryStatus.Synced,
                date: today.toISOString(),
                targetSoftware: tool,
                source: 'External',
                syncDetails: {
                    syncedAt: today.toISOString(),
                    targetSoftware: tool,
                    externalId: 'clio-123',
                    externalUrl: 'https://app.clio.com/activities/123'
                }
            },
            {
                id: `ext-${Date.now()}-2`,
                userId,
                description: 'Drafted and sent engagement letter to new client.',
                hours: 1.0,
                rate: 375,
                matter: 'Smith v. Johnson',
                status: BillableEntryStatus.Synced,
                date: yesterday.toISOString(),
                targetSoftware: tool,
                source: 'External',
                syncDetails: {
                    syncedAt: yesterday.toISOString(),
                    targetSoftware: tool,
                    externalId: 'clio-456',
                    externalUrl: 'https://app.clio.com/activities/456'
                }
            }
        ];
        return Promise.resolve(mockExternalEntries);
    },
    async addBillableEntry(
        userId: string, 
        data: Omit<Partial<BillableEntry>, 'actionItems'> & { suggestedHours?: number, suggestedMatter?: string, actionItems?: (ActionItem | string)[] }, 
        rate: number, 
        targetSoftware: PracticeManagementTool, 
        autoGenerated = false
    ): Promise<BillableEntry> {
        const db = getDb();
        const newActionItems: ActionItem[] = (data.actionItems || []).map((item, index) => ({
            id: `action-${Date.now()}-${index}`,
            text: typeof item === 'string' ? item : item.text,
            completed: false
        }));
        
        const newEntry: BillableEntry = {
            id: `entry-${Date.now()}`,
            userId,
            emailIds: data.emailIds,
            description: data.description!,
            hours: data.suggestedHours || data.hours || 0.2,
            rate,
            matter: data.matter || data.suggestedMatter!,
            status: BillableEntryStatus.Pending,
            date: data.date || new Date().toISOString(),
            targetSoftware,
            autoGenerated,
            actionItems: newActionItems,
            detailedBreakdown: data.detailedBreakdown || [],
            isArchived: false,
            source: 'InvoLex',
        };
        db.data[userId].billable_entries.unshift(newEntry);
        saveDb(db);
        return newEntry;
    },
    async updateBillableEntry(userId: string, updatedEntry: BillableEntry, originalDescription?: string, emailBody?: string | null): Promise<BillableEntry> {
        const db = getDb();
        const index = db.data[userId].billable_entries.findIndex((e: BillableEntry) => e.id === updatedEntry.id);
        if (index > -1) {
            
            if (originalDescription && originalDescription !== updatedEntry.description && emailBody) {
                const newCorrection: Correction = {
                    originalDescription: originalDescription,
                    correctedDescription: updatedEntry.description,
                    emailBody: emailBody,
                };
                db.data[userId].corrections.unshift(newCorrection);
                db.data[userId].corrections = db.data[userId].corrections.slice(0,10);
            }

            db.data[userId].billable_entries[index] = updatedEntry;
            saveDb(db);
        }
        return updatedEntry;
    },
    async syncEntry(userId: string, entryId: string, targetSoftware: PracticeManagementTool): Promise<BillableEntry> {
        const db = getDb();
        const index = db.data[userId].billable_entries.findIndex((e: BillableEntry) => e.id === entryId);
        if (index > -1) {
            const entry = db.data[userId].billable_entries[index];
            
            // Simulate sync success/failure
            if (Math.random() > 0.1) { // 90% success rate
                entry.status = BillableEntryStatus.Synced;
                entry.syncDetails = {
                    syncedAt: new Date().toISOString(),
                    targetSoftware,
                    externalId: `ext-${Date.now()}`
                };
            } else { // 10% failure rate
                entry.status = BillableEntryStatus.Error;
                entry.syncDetails = {
                    syncedAt: new Date().toISOString(),
                    targetSoftware,
                    errorMessage: "Could not connect to the practice management server."
                };
            }
            db.data[userId].billable_entries[index] = entry;
            saveDb(db);
            return entry;
        }
        throw new Error("Entry not found");
    },
    async setArchiveStatus(userId: string, entryIds: string[], isArchived: boolean): Promise<BillableEntry[]> {
        const db = getDb();
        const userEntries = db.data[userId]?.billable_entries || [];
        const updatedEntries: BillableEntry[] = [];

        const updatedUserEntries = userEntries.map((entry: BillableEntry) => {
            if (entryIds.includes(entry.id)) {
                const updatedEntry = { ...entry, isArchived };
                updatedEntries.push(updatedEntry);
                return updatedEntry;
            }
            return entry;
        });

        db.data[userId].billable_entries = updatedUserEntries;
        saveDb(db);
        return updatedEntries;
    },
    async getMatters(userId: string): Promise<Matter[]> {
        const db = getDb();
        const matters = db.data[userId]?.matters || [];
        // Ensure backward compatibility for matters without billingRules
        return matters.map((m: Matter) => ({ ...m, billingRules: m.billingRules || [] }));
    },
    async saveMatters(userId: string, matters: Matter[]): Promise<void> {
        const db = getDb();
        db.data[userId].matters = matters;
        saveDb(db);
    },
    async getCorrections(userId: string): Promise<Correction[]> {
        const db = getDb();
        return db.data[userId]?.corrections || [];
    },
    async getSettings(userId: string): Promise<any> {
        const db = getDb();
        return db.data[userId]?.settings;
    },
    async saveSettings(userId: string, settings: any): Promise<void> {
        const db = getDb();
        db.data[userId].settings = { ...db.data[userId].settings, ...settings };
        saveDb(db);
    }
};

export const supabaseClient = {
  auth,
  data,
};
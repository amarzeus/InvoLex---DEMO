import { BaseEntity, Auditable, SoftDeletable } from '../types';

// User entity
export interface User extends BaseEntity, Auditable, SoftDeletable {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string; // Optional for OAuth users
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  preferences: UserPreferences;
  role: UserRole;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  currency: string;
  defaultRate?: number;
  autoSync: boolean;
  emailNotifications: boolean;
}

export type UserRole = 'admin' | 'user' | 'premium';

// Matter entity
export interface Matter extends BaseEntity, Auditable, SoftDeletable {
  userId: string;
  name: string;
  clientName?: string;
  description?: string;
  rate: number;
  currency: string;
  status: MatterStatus;
  clioId?: string;
  customFields: Record<string, any>;
  tags: string[];
}

export type MatterStatus = 'active' | 'inactive' | 'archived' | 'completed';

// BillableEntry entity
export interface BillableEntry extends BaseEntity, Auditable, SoftDeletable {
  userId: string;
  matterId: string;
  emailIds: string[]; // References to email messages
  description: string;
  hours: number;
  rate: number;
  currency: string;
  date: Date;
  status: BillableEntryStatus;
  clioId?: string;
  confidenceScore?: number; // AI confidence score
  aiProcessed: boolean;
  manualAdjustments: ManualAdjustment[];
  customFields: Record<string, any>;
  tags: string[];
}

export interface ManualAdjustment {
  field: string;
  originalValue: any;
  adjustedValue: any;
  reason: string;
  adjustedBy: string;
  adjustedAt: Date;
}

export type BillableEntryStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'synced';

// EmailProvider entity
export interface EmailProvider extends BaseEntity, Auditable, SoftDeletable {
  userId: string;
  provider: EmailProviderType;
  email: string;
  displayName?: string;
  isPrimary: boolean;
  isActive: boolean;
  settings: EmailProviderSettings;
  lastSyncAt?: Date;
  syncStatus: SyncStatus;
  errorMessage?: string;
}

export type EmailProviderType = 'gmail' | 'outlook' | 'imap' | 'exchange';

export interface EmailProviderSettings {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  serverSettings?: ServerSettings;
  syncFrequency: number; // minutes
  maxEmailsPerSync: number;
  foldersToSync: string[];
}

export interface ServerSettings {
  host: string;
  port: number;
  secure: boolean;
  authMethod: 'oauth' | 'password';
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// Email entity (for storing email data)
export interface Email extends BaseEntity, Auditable {
  providerId: string;
  messageId: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  body: EmailBody;
  attachments: EmailAttachment[];
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  receivedAt: Date;
  processedAt?: Date;
  aiAnalyzed: boolean;
  billableEntryId?: string;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailBody {
  text?: string;
  html?: string;
  summary?: string; // AI-generated summary
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  contentId?: string;
  url?: string; // For accessing attachment
}

// Correction entity (for AI learning)
export interface Correction extends BaseEntity, Auditable {
  userId: string;
  emailId: string;
  originalDescription: string;
  correctedDescription: string;
  originalHours?: number;
  correctedHours?: number;
  reason: string;
  appliedToModel: boolean;
  feedback: 'positive' | 'negative' | 'neutral';
}

// Session entity
export interface Session extends BaseEntity {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  location?: string;
}

// Export all entities
export type EntityType =
  | User
  | Matter
  | BillableEntry
  | EmailProvider
  | Email
  | Correction
  | Session;

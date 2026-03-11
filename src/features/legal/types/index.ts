export type DocumentType = 'terms' | 'privacy';
export type Language = 'en' | 'fr';

export interface LegalDocument {
  readonly id: string;
  readonly documentType: DocumentType;
  readonly version: string;
  readonly contentEn: string;
  readonly contentFr: string;
  readonly effectiveDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  getContent(language: Language): string;
}

export interface UserAcceptance {
  readonly documentType: DocumentType;
  readonly acceptedAt: Date | null;
  readonly acceptedVersion: string | null;
  readonly currentVersion: string;
  readonly accepted: boolean;
  isOutOfDate(): boolean;
}

export interface ConsentSummary {
  readonly terms: UserAcceptance;
  readonly privacy: UserAcceptance;
  readonly bothAccepted: boolean;
}

export interface AcceptanceStatus {
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
  readonly bothAccepted: boolean;
}

export function validateDocumentType(value: string): value is DocumentType {
  return value === 'terms' || value === 'privacy';
}

// Factory helpers to create concrete implementations of the interfaces
export function createLegalDocument(data: {
  id: string;
  documentType: DocumentType;
  version: string;
  contentEn: string;
  contentFr: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): LegalDocument {
  return {
    ...data,
    getContent(language: Language) {
      return language === 'fr' ? data.contentFr : data.contentEn;
    },
  };
}

export function createUserAcceptance(data: {
  documentType: DocumentType;
  acceptedAt: Date | null;
  acceptedVersion: string | null;
  currentVersion: string;
  accepted: boolean;
}): UserAcceptance {
  return {
    ...data,
    isOutOfDate() {
      if (!data.acceptedVersion) return true;
      return data.acceptedVersion < data.currentVersion;
    },
  };
}

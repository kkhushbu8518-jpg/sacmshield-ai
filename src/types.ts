export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ar' | 'ja' | 'pt';

export type ThreatClassification = 'Safe' | 'Suspicious' | 'High Risk';

export type ThreatTheme = 'neutral' | 'safe' | 'suspicious' | 'danger';

export type ScanMode = 'sms' | 'email' | 'url';

export interface ScamDna {
  urgencyFear: number;
  impersonation: number;
  financialPressure: number;
  credentialTheft: number;
  rewardBait: number;
  manipulation: number;
}

export interface WarningSign {
  category: string;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DomainSignals {
  hostname: string;
  protocol: string;
  usesIpAddress: boolean;
  hasPunycodeOrLookalike: boolean;
  suspiciousTld: boolean;
  excessiveSubdomains: boolean;
  pathFlags: string[];
}

export interface ScanResult {
  id: string;
  mode: ScanMode | 'gmail' | 'phone' | 'payment';
  inputPreview: string;
  riskScore: number;
  classification: ThreatClassification;
  summary: string;
  warningSigns: WarningSign[];
  scamDna: ScamDna;
  explanation: string;
  socialEngineeringTechniques: string[];
  uncertaintyNote: string;
  recommendations: string[];
  domainSignals?: DomainSignals;
  timestamp: string;
  language: LanguageCode;
}

export interface PhoneNotificationEvent {
  id: string;
  notifiedNumber: string;
  notifiedCountry: string;
  checkedNumber: string;
  checkedCountry: string;
  registeredHolder: string;
  riskScore: number;
  classification: ThreatClassification;
  message: string;
  timestamp: string;
}

export interface PhoneLookupResult {
  normalizedNumber: string;
  countryCode: string;
  countryName: string;
  dialCode: string;
  registeredHolderName: string;
  holderCategory: string;
  carrierOrLineType: string;
  suspiciousCallsTillDate: number;
  communityReports: number;
  riskScore: number;
  classification: ThreatClassification;
  summary: string;
  warningSigns: WarningSign[];
  scamDna: ScamDna;
  explanation: string;
  uncertaintyNote: string;
  recommendations: string[];
  notificationEvent?: PhoneNotificationEvent;
  timestamp: string;
}

export interface PaymentCheckResult {
  status: 'secured' | 'suspicious' | 'fraud';
  riskScore: number;
  classification: ThreatClassification;
  receiverName: string;
  receiverAccount: string;
  method: string;
  amount: string;
  currency: string;
  headline: string;
  explanation: string;
  warningSigns: WarningSign[];
  scamDna: ScamDna;
  recommendations: string[];
  uncertaintyNote: string;
  timestamp: string;
}

export interface ScanHistoryItem {
  id: string;
  type: 'sms' | 'email' | 'url' | 'gmail' | 'phone' | 'payment';
  title: string;
  riskScore: number;
  classification: ThreatClassification;
  timestamp: string;
  result: ScanResult | PhoneLookupResult | PaymentCheckResult;
}

export interface BlocklistEntry {
  id: string;
  type: 'domain' | 'phone' | 'account';
  value: string;
  reason: string;
  addedAt: string;
}

export interface GlobalHotspot {
  id: string;
  city: string;
  country: string;
  isoCode: string;
  lat: number;
  lon: number;
  riskIndex: number;
  tier: 'Critical' | 'High' | 'Elevated';
  primaryThreats: string[];
  reportedIncidents30d: number;
  summary: string;
}

export interface OwnerConfig {
  ownerEmail: string;
  suspiciousThreshold: number;
  highRiskThreshold: number;
  strictPaymentBlock: boolean;
  modules: {
    smsScanner: boolean;
    urlScanner: boolean;
    gmailScanner: boolean;
    phoneLookup: boolean;
    paymentGuard: boolean;
    threatMap: boolean;
    voiceAssistant: boolean;
  };
  blocklist: BlocklistEntry[];
  customSafetyTips: string[];
  customHotspots: GlobalHotspot[];
  updatedAt: string;
}

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  placeholder: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface GmailEmailSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
}

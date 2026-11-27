import type { LanguageCode } from '../types';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
];

export interface TranslationBundle {
  brandTitle: string;
  brandSubtitle: string;
  tagline: string;
  heroTitle: string;
  heroDesc: string;
  navScanner: string;
  navPhone: string;
  navPayments: string;
  navMap: string;
  navAssistant: string;
  navOwner: string;
  quickScanCta: string;
  signInGoogle: string;
  signOut: string;
  ownerBadge: string;
  guestBadge: string;
  languageLabel: string;
  themeStatusLabel: string;
  themeNeutral: string;
  themeSafe: string;
  themeSuspicious: string;
  themeDanger: string;
  resetTheme: string;
  // Scanner
  scannerHeading: string;
  scannerSubheading: string;
  tabSms: string;
  tabUrl: string;
  tabGmail: string;
  smsPlaceholder: string;
  urlPlaceholder: string;
  analyzeBtn: string;
  analyzingBtn: string;
  clearBtn: string;
  copyResultsBtn: string;
  copiedLabel: string;
  sampleScenariosTitle: string;
  urlSafetyNotice: string;
  // Results Dashboard
  resultsHeading: string;
  emptyResultsTitle: string;
  emptyResultsDesc: string;
  riskScoreLabel: string;
  classificationLabel: string;
  safeLabel: string;
  suspiciousLabel: string;
  highRiskLabel: string;
  warningSignsLabel: string;
  noWarningsLabel: string;
  explanationLabel: string;
  uncertaintyLabel: string;
  recommendationsLabel: string;
  scamDnaTitle: string;
  scamDnaSubtitle: string;
  dnaUrgencyFear: string;
  dnaImpersonation: string;
  dnaFinancialPressure: string;
  dnaCredentialTheft: string;
  dnaRewardBait: string;
  dnaManipulation: string;
  // Gmail
  gmailHeading: string;
  gmailConnectDesc: string;
  gmailFetchBtn: string;
  gmailScanEmailBtn: string;
  gmailNoEmails: string;
  // Phone Lookup
  phoneHeading: string;
  phoneSubheading: string;
  selectCountryLabel: string;
  enterPhoneLabel: string;
  phoneContextLabel: string;
  lookupPhoneBtn: string;
  connectMyNumberTitle: string;
  connectMyNumberDesc: string;
  connectNumberBtn: string;
  connectedNumberActive: string;
  disconnectNumberBtn: string;
  registeredHolderLabel: string;
  originCountryLabel: string;
  carrierTypeLabel: string;
  suspiciousCallsLabel: string;
  communityReportsLabel: string;
  callerNotificationBanner: string;
  // Payment Guard
  paymentHeading: string;
  paymentSubheading: string;
  paymentMethodLabel: string;
  receiverNameLabel: string;
  receiverAccountLabel: string;
  amountLabel: string;
  paymentNoteLabel: string;
  verifyPaymentBtn: string;
  confirmPaymentBtn: string;
  paymentSecuredBadge: string;
  paymentFraudBadge: string;
  paymentSuspiciousBadge: string;
  paymentBlockedNotice: string;
  paymentSuccessNotice: string;
  // Global Map
  mapHeading: string;
  mapSubheading: string;
  mapFilterAll: string;
  mapFilterCritical: string;
  mapFilterHigh: string;
  mapFilterElevated: string;
  mapIncidentsLabel: string;
  mapRiskIndexLabel: string;
  mapThreatsLabel: string;
  // Assistant
  assistantHeading: string;
  assistantSubheading: string;
  assistantPlaceholder: string;
  assistantSendBtn: string;
  micStartLabel: string;
  micStopLabel: string;
  micTranscribing: string;
  // History & Tips
  historyTitle: string;
  historyEmpty: string;
  clearHistoryBtn: string;
  tipsTitle: string;
  // Owner Studio
  ownerHeading: string;
  ownerSubheading: string;
  ownerLockedTitle: string;
  ownerLockedDesc: string;
  ownerUnlockedBadge: string;
  saveConfigBtn: string;
  savingLabel: string;
  savedLabel: string;
  suspiciousThresholdLabel: string;
  highRiskThresholdLabel: string;
  strictPaymentLabel: string;
  blocklistTitle: string;
  addBlocklistBtn: string;
}

const EN: TranslationBundle = {
  brandTitle: 'ScamShield AI',
  brandSubtitle: 'Your Digital Safety Guardian',
  tagline: 'Think Before You Click – Stay Safe with AI.',
  heroTitle: 'Detect scams, phishing links, risky callers, and fraudulent payments in seconds.',
  heroDesc:
    'Analyze suspicious SMS, WhatsApp messages, Gmail inboxes, website URLs, caller numbers, and payment receivers with transparent AI explanations.',
  navScanner: 'Scanner',
  navPhone: 'Phone Lookup',
  navPayments: 'Payment Guard',
  navMap: 'Threat Map',
  navAssistant: 'AI Assistant',
  navOwner: 'Owner Studio',
  quickScanCta: 'Scan Now',
  signInGoogle: 'Sign in with Google',
  signOut: 'Sign Out',
  ownerBadge: 'App Owner',
  guestBadge: 'Standard User',
  languageLabel: 'Language',
  themeStatusLabel: 'Threat Theme',
  themeNeutral: 'Standby Navy',
  themeSafe: 'Safe (Green)',
  themeSuspicious: 'Warning (Amber)',
  themeDanger: 'Threat Alert (Red)',
  resetTheme: 'Reset Theme',
  scannerHeading: 'Message, Email & URL Scanner',
  scannerSubheading: 'Paste suspicious text, inspect a link safely without opening it, or scan your connected Gmail inbox.',
  tabSms: 'SMS / Message / Email',
  tabUrl: 'URL & Website',
  tabGmail: 'Gmail Inbox',
  smsPlaceholder: 'Paste a suspicious SMS, WhatsApp message, or email here...',
  urlPlaceholder: 'Enter a website URL to inspect (e.g., http://paypa1-security-verify.com/login)...',
  analyzeBtn: 'Analyze Threat',
  analyzingBtn: 'Analyzing...',
  clearBtn: 'Clear',
  copyResultsBtn: 'Copy Results',
  copiedLabel: 'Copied',
  sampleScenariosTitle: 'Sample Scenarios',
  urlSafetyNotice: 'Safety Lock: ScamShield never automatically opens or fetches untrusted links.',
  resultsHeading: 'Analysis Results Dashboard',
  emptyResultsTitle: 'Ready to Inspect',
  emptyResultsDesc: 'Submit a message, URL, Gmail email, phone number, or payment check to see the full risk breakdown and Scam DNA Fingerprint.',
  riskScoreLabel: 'Risk Score',
  classificationLabel: 'Threat Classification',
  safeLabel: 'Safe',
  suspiciousLabel: 'Suspicious',
  highRiskLabel: 'High Risk',
  warningSignsLabel: 'Detected Warning Signs',
  noWarningsLabel: 'No strong scam warning signs detected in this input.',
  explanationLabel: 'Why This May or May Not Be a Scam',
  uncertaintyLabel: 'Honesty & Uncertainty Notice',
  recommendationsLabel: 'Recommended Safety Actions',
  scamDnaTitle: 'Scam DNA Fingerprint',
  scamDnaSubtitle: 'Visual breakdown of six psychological & technical manipulation tactics',
  dnaUrgencyFear: 'Urgency & Fear',
  dnaImpersonation: 'Impersonation',
  dnaFinancialPressure: 'Financial Pressure',
  dnaCredentialTheft: 'Credential Theft',
  dnaRewardBait: 'Reward Bait',
  dnaManipulation: 'Manipulation',
  gmailHeading: 'Gmail Inbox Phishing Scanner',
  gmailConnectDesc: 'Connect your Google account with read-only permission to scan recent emails directly.',
  gmailFetchBtn: 'Refresh Inbox',
  gmailScanEmailBtn: 'Scan Email',
  gmailNoEmails: 'No emails loaded yet. Sign in with Google to inspect your inbox.',
  phoneHeading: 'Phone Number Scam Lookup & Caller Alert',
  phoneSubheading: 'Select a country first, enter the suspected number, inspect caller registration & suspicious call history, and notify connected numbers.',
  selectCountryLabel: '1. Select Country',
  enterPhoneLabel: '2. Enter Phone Number',
  phoneContextLabel: 'Call Context (Optional)',
  lookupPhoneBtn: 'Check Phone Number',
  connectMyNumberTitle: 'Connect My Number for Alerts',
  connectMyNumberDesc: 'Link your phone number to receive immediate notifications whenever a caller lookup is performed.',
  connectNumberBtn: 'Connect Number',
  connectedNumberActive: 'Connected for Alerts',
  disconnectNumberBtn: 'Disconnect',
  registeredHolderLabel: 'Registered Holder / Caller Profile',
  originCountryLabel: 'Country of Origin',
  carrierTypeLabel: 'Carrier & Line Type',
  suspiciousCallsLabel: 'Suspicious Calls Till Date',
  communityReportsLabel: 'Community Reports',
  callerNotificationBanner: 'Connected Number Notification Sent',
  paymentHeading: 'Pre-Transaction Payment Fraud Guard',
  paymentSubheading: 'Verify whether the receiver account is secured or fraudulent before sending any money.',
  paymentMethodLabel: 'Payment Method',
  receiverNameLabel: 'Receiver Name',
  receiverAccountLabel: 'Receiver Account / UPI / IBAN / Wallet',
  amountLabel: 'Amount',
  paymentNoteLabel: 'Payment Purpose / Note',
  verifyPaymentBtn: 'Verify Receiver Safety',
  confirmPaymentBtn: 'Proceed with Protected Transfer',
  paymentSecuredBadge: 'SECURED RECEIVER — Safe to Proceed',
  paymentFraudBadge: 'FRAUD ALERT — Receiver Account Flagged',
  paymentSuspiciousBadge: 'CAUTION — Suspicious Receiver Signals',
  paymentBlockedNotice: 'Transfer paused by ScamShield Payment Guard due to high fraud indicators.',
  paymentSuccessNotice: 'Protected test transfer confirmed. Always verify out-of-band for large transfers.',
  mapHeading: 'Global Cybercrime & Scam Risk Map',
  mapSubheading: 'Explore countries and major cities reporting elevated phishing, UPI, BEC, and tech-support fraud activity.',
  mapFilterAll: 'All Tiers',
  mapFilterCritical: 'Critical',
  mapFilterHigh: 'High',
  mapFilterElevated: 'Elevated',
  mapIncidentsLabel: '30-Day Reports',
  mapRiskIndexLabel: 'Risk Index',
  mapThreatsLabel: 'Primary Threat Vectors',
  assistantHeading: 'ScamShield AI Cybersecurity Assistant',
  assistantSubheading: 'Ask questions by typing or using your microphone. Never share real OTPs or passwords.',
  assistantPlaceholder: 'Ask if a message, link, or call tactic looks suspicious...',
  assistantSendBtn: 'Send',
  micStartLabel: 'Voice Input',
  micStopLabel: 'Stop Recording',
  micTranscribing: 'Transcribing audio...',
  historyTitle: 'Scan History',
  historyEmpty: 'Your recent scans will appear here.',
  clearHistoryBtn: 'Clear History',
  tipsTitle: 'Daily Online Safety Tips',
  ownerHeading: 'Owner Studio & Security Policy',
  ownerSubheading: 'Configure threat thresholds, blocklists, and module controls.',
  ownerLockedTitle: 'Read-Only Access',
  ownerLockedDesc: 'Only the verified app owner can modify global settings, thresholds, or blocklists. Everyone else can freely use all protection features.',
  ownerUnlockedBadge: 'Verified Owner Session',
  saveConfigBtn: 'Save Changes',
  savingLabel: 'Saving...',
  savedLabel: 'Saved',
  suspiciousThresholdLabel: 'Suspicious Score Threshold',
  highRiskThresholdLabel: 'High Risk Score Threshold',
  strictPaymentLabel: 'Strict Payment Fraud Block',
  blocklistTitle: 'Custom Threat Blocklist',
  addBlocklistBtn: 'Add Entry',
};

const HI: TranslationBundle = {
  ...EN,
  brandSubtitle: 'आपका डिजिटल सुरक्षा रक्षक',
  tagline: 'क्लिक करने से पहले सोचें – AI के साथ सुरक्षित रहें।',
  heroTitle: 'कुछ ही सेकंड में स्कैम, फ़िशिंग लिंक, संदिग्ध कॉलर और धोखाधड़ी भुगतान पहचानें।',
  heroDesc: 'संदिग्ध SMS, WhatsApp संदेश, Gmail इनबॉक्स, वेबसाइट URL, फ़ोन नंबर और भुगतान प्राप्तकर्ताओं की स्पष्ट AI व्याख्या के साथ जाँच करें।',
  navScanner: 'स्कैनर',
  navPhone: 'फ़ोन जाँच',
  navPayments: 'भुगतान सुरक्षा',
  navMap: 'वैश्विक मानचित्र',
  navAssistant: 'AI सहायक',
  navOwner: 'ओनर स्टूडियो',
  quickScanCta: 'अभी स्कैन करें',
  signInGoogle: 'Google से साइन इन करें',
  signOut: 'साइन आउट',
  ownerBadge: 'ऐप मालिक',
  guestBadge: 'सामान्य उपयोगकर्ता',
  languageLabel: 'भाषा',
  themeStatusLabel: 'खतरा थीम',
  themeNeutral: 'स्टैंडबाय नेवी',
  themeSafe: 'सुरक्षित (हरा)',
  themeSuspicious: 'चेतावनी (पीला)',
  themeDanger: 'खतरा अलर्ट (लाल)',
  resetTheme: 'थीम रीसेट करें',
  scannerHeading: 'संदेश, ईमेल और URL स्कैनर',
  scannerSubheading: 'संदिग्ध टेक्स्ट पेस्ट करें, लिंक को बिना खोले जाँचें, या अपना Gmail इनबॉक्स स्कैन करें।',
  tabSms: 'SMS / संदेश / ईमेल',
  tabUrl: 'URL और वेबसाइट',
  tabGmail: 'Gmail इनबॉक्स',
  smsPlaceholder: 'यहाँ संदिग्ध SMS, WhatsApp संदेश या ईमेल पेस्ट करें...',
  urlPlaceholder: 'जाँच के लिए वेबसाइट URL दर्ज करें...',
  analyzeBtn: 'खतरे की जाँच करें',
  analyzingBtn: 'जाँच हो रही है...',
  clearBtn: 'साफ़ करें',
  copyResultsBtn: 'परिणाम कॉपी करें',
  copiedLabel: 'कॉपी हो गया',
  sampleScenariosTitle: 'नमूना उदाहरण',
  urlSafetyNotice: 'सुरक्षा लॉक: ScamShield कभी भी संदिग्ध लिंक को अपने आप नहीं खोलता।',
  resultsHeading: 'विश्लेषण परिणाम डैशबोर्ड',
  emptyResultsTitle: 'जाँच के लिए तैयार',
  emptyResultsDesc: 'जोखिम स्कोर और Scam DNA फ़िंगरप्रिंट देखने के लिए संदेश, URL, फ़ोन नंबर या भुगतान जाँचें।',
  riskScoreLabel: 'जोखिम स्कोर',
  classificationLabel: 'खतरा श्रेणी',
  safeLabel: 'सुरक्षित',
  suspiciousLabel: 'संदिग्ध',
  highRiskLabel: 'उच्च जोखिम',
  warningSignsLabel: 'पाए गए चेतावनी संकेत',
  noWarningsLabel: 'कोई बड़ा स्कैम संकेत नहीं मिला।',
  explanationLabel: 'यह स्कैम क्यों हो सकता है या नहीं',
  uncertaintyLabel: 'ईमानदारी और अनिश्चितता सूचना',
  recommendationsLabel: 'अनुशंसित सुरक्षा कदम',
  scamDnaTitle: 'Scam DNA फ़िंगरप्रिंट',
  scamDnaSubtitle: 'छह हेरफेर तकनीकों का दृश्य विश्लेषण',
  dnaUrgencyFear: 'तात्कालिकता और डर',
  dnaImpersonation: 'नकल / प्रतिरूपण',
  dnaFinancialPressure: 'वित्तीय दबाव',
  dnaCredentialTheft: 'पासवर्ड/OTP चोरी',
  dnaRewardBait: 'इनाम का लालच',
  dnaManipulation: 'मानसिक हेरफेर',
  gmailHeading: 'Gmail इनबॉक्स फ़िशिंग स्कैनर',
  gmailConnectDesc: 'ईमेल स्कैन करने के लिए केवल-पढ़ने की अनुमति के साथ Google खाता जोड़ें।',
  gmailFetchBtn: 'इनबॉक्स रिफ्रेश करें',
  gmailScanEmailBtn: 'ईमेल स्कैन करें',
  gmailNoEmails: 'कोई ईमेल लोड नहीं है। इनबॉक्स देखने के लिए Google से साइन इन करें।',
  phoneHeading: 'फ़ोन नंबर स्कैम जाँच और कॉलर अलर्ट',
  phoneSubheading: 'पहले देश चुनें, संदिग्ध नंबर दर्ज करें, पंजीकृत नाम और संदिग्ध कॉल इतिहास देखें।',
  selectCountryLabel: '1. देश चुनें',
  enterPhoneLabel: '2. फ़ोन नंबर दर्ज करें',
  phoneContextLabel: 'कॉल का संदर्भ (वैकल्पिक)',
  lookupPhoneBtn: 'फ़ोन नंबर जाँचें',
  connectMyNumberTitle: 'अलर्ट के लिए मेरा नंबर जोड़ें',
  connectMyNumberDesc: 'कॉलर जाँच होने पर तुरंत सूचना पाने के लिए अपना नंबर लिंक करें।',
  connectNumberBtn: 'नंबर जोड़ें',
  connectedNumberActive: 'अलर्ट के लिए जुड़ा हुआ',
  disconnectNumberBtn: 'डिस्कनेक्ट करें',
  registeredHolderLabel: 'पंजीकृत धारक / कॉलर प्रोफ़ाइल',
  originCountryLabel: 'मूल देश',
  carrierTypeLabel: 'नेटवर्क और लाइन प्रकार',
  suspiciousCallsLabel: 'अब तक संदिग्ध कॉल',
  communityReportsLabel: 'समुदाय रिपोर्ट',
  callerNotificationBanner: 'कनेक्टेड नंबर पर सूचना भेजी गई',
  paymentHeading: 'लेन-देन से पहले भुगतान धोखाधड़ी सुरक्षा',
  paymentSubheading: 'पैसे भेजने से पहले जाँचें कि प्राप्तकर्ता खाता सुरक्षित है या धोखाधड़ी वाला।',
  paymentMethodLabel: 'भुगतान विधि',
  receiverNameLabel: 'प्राप्तकर्ता का नाम',
  receiverAccountLabel: 'प्राप्तकर्ता खाता / UPI / वॉलेट',
  amountLabel: 'राशि',
  paymentNoteLabel: 'भुगतान उद्देश्य',
  verifyPaymentBtn: 'प्राप्तकर्ता सुरक्षा जाँचें',
  confirmPaymentBtn: 'सुरक्षित ट्रांसफर आगे बढ़ाएँ',
  paymentSecuredBadge: 'सुरक्षित खाता — आगे बढ़ना सुरक्षित',
  paymentFraudBadge: 'धोखाधड़ी अलर्ट — प्राप्तकर्ता खाता संदिग्ध/ब्लॉक',
  paymentSuspiciousBadge: 'सावधान — संदिग्ध भुगतान संकेत',
  paymentBlockedNotice: 'उच्च धोखाधड़ी जोखिम के कारण ScamShield द्वारा ट्रांसफर रोका गया।',
  paymentSuccessNotice: 'सुरक्षित परीक्षण ट्रांसफर की पुष्टि हुई।',
  mapHeading: 'वैश्विक साइबर अपराध और स्कैम जोखिम मानचित्र',
  mapSubheading: 'दुनिया भर के प्रमुख शहरों और देशों में उच्च जोखिम वाले स्कैम क्षेत्रों को देखें।',
  mapFilterAll: 'सभी स्तर',
  mapFilterCritical: 'अति गंभीर',
  mapFilterHigh: 'उच्च',
  mapFilterElevated: 'बढ़ा हुआ',
  mapIncidentsLabel: '30-दिन रिपोर्ट',
  mapRiskIndexLabel: 'जोखिम सूचकांक',
  mapThreatsLabel: 'मुख्य खतरे',
  assistantHeading: 'ScamShield AI साइबर सुरक्षा सहायक',
  assistantSubheading: 'टाइप करके या माइक्रोफ़ोन का उपयोग करके सवाल पूछें। कभी भी असली OTP या पासवर्ड न साझा करें।',
  assistantPlaceholder: 'पूछें कि कोई संदेश, लिंक या कॉल संदिग्ध है या नहीं...',
  assistantSendBtn: 'भेजें',
  micStartLabel: 'वॉइस इनपुट',
  micStopLabel: 'रिकॉर्डिंग रोकें',
  micTranscribing: 'ऑडियो लिखा जा रहा है...',
  historyTitle: 'स्कैन इतिहास',
  historyEmpty: 'आपके हाल के स्कैन यहाँ दिखाई देंगे।',
  clearHistoryBtn: 'इतिहास साफ़ करें',
  tipsTitle: 'दैनिक ऑनलाइन सुरक्षा सुझाव',
  ownerHeading: 'ओनर स्टूडियो और सुरक्षा नीति',
  ownerSubheading: 'खतरा सीमा, ब्लॉकलिस्ट और मॉड्यूल नियंत्रण प्रबंधित करें।',
  ownerLockedTitle: 'केवल-पढ़ने की पहुँच',
  ownerLockedDesc: 'केवल ऐप के सत्यापित मालिक ही सेटिंग्स बदल सकते हैं। अन्य सभी उपयोगकर्ता सभी सुरक्षा सुविधाओं का उपयोग कर सकते हैं।',
  ownerUnlockedBadge: 'सत्यापित मालिक सत्र',
  saveConfigBtn: 'बदलाव सहेजें',
  savingLabel: 'सहेजा जा रहा है...',
  savedLabel: 'सहेजा गया',
  suspiciousThresholdLabel: 'संदिग्ध स्कोर सीमा',
  highRiskThresholdLabel: 'उच्च जोखिम स्कोर सीमा',
  strictPaymentLabel: 'सख्त भुगतान धोखाधड़ी ब्लॉक',
  blocklistTitle: 'कस्टम खतरा ब्लॉकलिस्ट',
  addBlocklistBtn: 'जोड़ें',
};

const ES: TranslationBundle = {
  ...EN,
  brandSubtitle: 'Tu Guardián de Seguridad Digital',
  tagline: 'Piensa Antes de Hacer Clic – Mantente Seguro con IA.',
  heroTitle: 'Detecta estafas, enlaces phishing, llamadas sospechosas y pagos fraudulentos en segundos.',
  heroDesc: 'Analiza SMS, mensajes de WhatsApp, correos de Gmail, URLs, números telefónicos y cuentas receptoras con explicaciones claras de IA.',
  navScanner: 'Escáner',
  navPhone: 'Teléfonos',
  navPayments: 'Pagos',
  navMap: 'Mapa Global',
  navAssistant: 'Asistente IA',
  navOwner: 'Panel Dueño',
  quickScanCta: 'Escanear Ahora',
  signInGoogle: 'Iniciar sesión con Google',
  signOut: 'Cerrar sesión',
  ownerBadge: 'Propietario',
  guestBadge: 'Usuario Estándar',
  languageLabel: 'Idioma',
  themeStatusLabel: 'Tema de Riesgo',
  themeNeutral: 'Azul Espera',
  themeSafe: 'Seguro (Verde)',
  themeSuspicious: 'Advertencia (Ámbar)',
  themeDanger: 'Alerta Estafa (Rojo)',
  resetTheme: 'Restablecer Tema',
  scannerHeading: 'Escáner de Mensajes, Correos y URLs',
  scannerSubheading: 'Pega texto sospechoso, analiza un enlace sin abrirlo o escanea tu bandeja de Gmail.',
  tabSms: 'SMS / Mensaje / Correo',
  tabUrl: 'URL y Sitio Web',
  tabGmail: 'Bandeja Gmail',
  smsPlaceholder: 'Pega aquí un SMS, mensaje de WhatsApp o correo sospechoso...',
  urlPlaceholder: 'Ingresa una URL para inspeccionar...',
  analyzeBtn: 'Analizar Amenaza',
  analyzingBtn: 'Analizando...',
  clearBtn: 'Limpiar',
  copyResultsBtn: 'Copiar Resultados',
  copiedLabel: 'Copiado',
  sampleScenariosTitle: 'Escenarios de Ejemplo',
  urlSafetyNotice: 'Bloqueo de Seguridad: ScamShield nunca abre automáticamente enlaces sospechosos.',
  resultsHeading: 'Panel de Resultados del Análisis',
  emptyResultsTitle: 'Listo para Inspeccionar',
  emptyResultsDesc: 'Envía un mensaje, URL, correo, teléfono o pago para ver el riesgo y la Huella ADN de Estafa.',
  riskScoreLabel: 'Puntuación de Riesgo',
  classificationLabel: 'Clasificación',
  safeLabel: 'Seguro',
  suspiciousLabel: 'Sospechoso',
  highRiskLabel: 'Alto Riesgo',
  warningSignsLabel: 'Señales de Alerta Detectadas',
  noWarningsLabel: 'No se detectaron señales claras de estafa.',
  explanationLabel: 'Por Qué Puede o No Ser una Estafa',
  uncertaintyLabel: 'Aviso de Incertidumbre',
  recommendationsLabel: 'Acciones Recomendadas',
  scamDnaTitle: 'Huella ADN de Estafa',
  scamDnaSubtitle: 'Desglose visual de seis tácticas de manipulación',
  dnaUrgencyFear: 'Urgencia y Miedo',
  dnaImpersonation: 'Suplantación',
  dnaFinancialPressure: 'Presión Financiera',
  dnaCredentialTheft: 'Robo de Credenciales',
  dnaRewardBait: 'Cebo de Premios',
  dnaManipulation: 'Manipulación',
  gmailHeading: 'Escáner de Phishing en Gmail',
  gmailConnectDesc: 'Conecta tu cuenta de Google con permiso de solo lectura para analizar correos recientes.',
  gmailFetchBtn: 'Actualizar Bandeja',
  gmailScanEmailBtn: 'Escanear Correo',
  gmailNoEmails: 'No hay correos cargados aún. Inicia sesión con Google.',
  phoneHeading: 'Verificador de Teléfonos y Alerta de Llamadas',
  phoneSubheading: 'Selecciona el país primero, ingresa el número y revisa el titular registrado y llamadas sospechosas.',
  selectCountryLabel: '1. Seleccionar País',
  enterPhoneLabel: '2. Ingresar Número Telefónico',
  phoneContextLabel: 'Contexto de Llamada (Opcional)',
  lookupPhoneBtn: 'Verificar Número',
  connectMyNumberTitle: 'Conectar Mi Número para Alertas',
  connectMyNumberDesc: 'Vincula tu número para recibir notificaciones cuando se consulte un número.',
  connectNumberBtn: 'Conectar Número',
  connectedNumberActive: 'Conectado para Alertas',
  disconnectNumberBtn: 'Desconectar',
  registeredHolderLabel: 'Titular Registrado / Perfil',
  originCountryLabel: 'País de Origen',
  carrierTypeLabel: 'Operador y Tipo de Línea',
  suspiciousCallsLabel: 'Llamadas Sospechosas a la Fecha',
  communityReportsLabel: 'Reportes Comunitarios',
  callerNotificationBanner: 'Notificación Enviada al Número Conectado',
  paymentHeading: 'Guardia de Pagos y Transacciones',
  paymentSubheading: 'Verifica si la cuenta receptora es segura o fraudulenta antes de enviar dinero.',
  paymentMethodLabel: 'Método de Pago',
  receiverNameLabel: 'Nombre del Receptor',
  receiverAccountLabel: 'Cuenta / UPI / IBAN / Billetera',
  amountLabel: 'Monto',
  paymentNoteLabel: 'Motivo del Pago',
  verifyPaymentBtn: 'Verificar Seguridad del Receptor',
  confirmPaymentBtn: 'Continuar Transferencia Protegida',
  paymentSecuredBadge: 'CUENTA SEGURA — Seguro para Continuar',
  paymentFraudBadge: 'ALERTA DE FRAUDE — Cuenta Marcada',
  paymentSuspiciousBadge: 'PRECAUCIÓN — Señales Sospechosas',
  paymentBlockedNotice: 'Transferencia pausada por ScamShield por alto riesgo de fraude.',
  paymentSuccessNotice: 'Transferencia de prueba protegida confirmada.',
  mapHeading: 'Mapa Global de Estafas y Cibercrimen',
  mapSubheading: 'Explora países y ciudades con alta incidencia de phishing y fraude digital.',
  mapFilterAll: 'Todos',
  mapFilterCritical: 'Crítico',
  mapFilterHigh: 'Alto',
  mapFilterElevated: 'Elevado',
  mapIncidentsLabel: 'Reportes 30 Días',
  mapRiskIndexLabel: 'Índice de Riesgo',
  mapThreatsLabel: 'Vectores Principales',
  assistantHeading: 'Asistente de Ciberseguridad IA',
  assistantSubheading: 'Pregunta escribiendo o usando tu micrófono. Nunca compartas OTP ni contraseñas reales.',
  assistantPlaceholder: 'Pregunta si un mensaje, enlace o llamada es sospechoso...',
  assistantSendBtn: 'Enviar',
  micStartLabel: 'Voz',
  micStopLabel: 'Detener',
  micTranscribing: 'Transcribiendo audio...',
  historyTitle: 'Historial de Escaneos',
  historyEmpty: 'Tus análisis recientes aparecerán aquí.',
  clearHistoryBtn: 'Limpiar Historial',
  tipsTitle: 'Consejos Diarios de Seguridad',
  ownerHeading: 'Panel del Propietario',
  ownerSubheading: 'Configura umbrales de riesgo, listas de bloqueo y módulos.',
  ownerLockedTitle: 'Acceso de Solo Lectura',
  ownerLockedDesc: 'Solo el propietario verificado de la app puede hacer cambios de configuración.',
  ownerUnlockedBadge: 'Sesión de Propietario Verificada',
  saveConfigBtn: 'Guardar Cambios',
  savingLabel: 'Guardando...',
  savedLabel: 'Guardado',
  suspiciousThresholdLabel: 'Umbral Sospechoso',
  highRiskThresholdLabel: 'Umbral Alto Riesgo',
  strictPaymentLabel: 'Bloqueo Estricto de Fraude en Pagos',
  blocklistTitle: 'Lista Negra Personalizada',
  addBlocklistBtn: 'Agregar',
};

const FR: TranslationBundle = {
  ...EN,
  brandSubtitle: 'Votre Gardien de Sécurité Numérique',
  tagline: 'Réfléchissez Avant de Cliquer – Restez en Sécurité avec l’IA.',
  heroTitle: 'Détectez les arnaques, liens phishing, appels suspects et paiements frauduleux en quelques secondes.',
  navScanner: 'Scanner',
  navPhone: 'Téléphone',
  navPayments: 'Paiements',
  navMap: 'Carte Mondiale',
  navAssistant: 'Assistant IA',
  navOwner: 'Espace Propriétaire',
  quickScanCta: 'Analyser',
  signInGoogle: 'Se connecter avec Google',
  signOut: 'Déconnexion',
  languageLabel: 'Langue',
  themeSafe: 'Sûr (Vert)',
  themeDanger: 'Alerte Arnaque (Rouge)',
  analyzeBtn: 'Analyser la Menace',
  clearBtn: 'Effacer',
  copyResultsBtn: 'Copier',
  safeLabel: 'Sûr',
  suspiciousLabel: 'Suspect',
  highRiskLabel: 'Haut Risque',
  scamDnaTitle: 'Empreinte ADN d’Arnaque',
  phoneHeading: 'Vérification de Numéro & Alerte d’Appel',
  paymentHeading: 'Protection Anti-Fraude des Paiements',
  mapHeading: 'Carte Mondiale des Risques Cyber',
  assistantHeading: 'Assistant Cybersécurité IA',
};

const DE: TranslationBundle = {
  ...EN,
  brandSubtitle: 'Ihr Digitaler Sicherheitswächter',
  tagline: 'Erst Denken, Dann Klicken – Sicher mit KI.',
  heroTitle: 'Erkennen Sie Betrug, Phishing-Links, verdächtige Anrufe und unsichere Zahlungen in Sekunden.',
  navScanner: 'Scanner',
  navPhone: 'Telefonprüfung',
  navPayments: 'Zahlungsschutz',
  navMap: 'Weltkarte',
  navAssistant: 'KI-Assistent',
  navOwner: 'Inhaber-Studio',
  quickScanCta: 'Jetzt Prüfen',
  signInGoogle: 'Mit Google anmelden',
  signOut: 'Abmelden',
  languageLabel: 'Sprache',
  themeSafe: 'Sicher (Grün)',
  themeDanger: 'Betrugsalarm (Rot)',
  analyzeBtn: 'Bedrohung Prüfen',
  clearBtn: 'Leeren',
  copyResultsBtn: 'Kopieren',
  safeLabel: 'Sicher',
  suspiciousLabel: 'Verdächtig',
  highRiskLabel: 'Hohes Risiko',
  scamDnaTitle: 'Scam-DNA-Fingerabdruck',
};

const AR: TranslationBundle = {
  ...EN,
  brandSubtitle: 'حارس الأمان الرقمي الخاص بك',
  tagline: 'فكّر قبل أن تنقر – ابقَ آمناً مع الذكاء الاصطناعي.',
  heroTitle: 'اكتشف الاحتيال وروابط التصيد والمكالمات المشبوهة والمدفوعات الاحتيالية في ثوانٍ.',
  navScanner: 'الماسح',
  navPhone: 'فحص الهاتف',
  navPayments: 'حماية الدفع',
  navMap: 'خريطة المخاطر',
  navAssistant: 'المساعد الذكي',
  navOwner: 'لوحة المالك',
  quickScanCta: 'افحص الآن',
  signInGoogle: 'تسجيل الدخول عبر Google',
  signOut: 'تسجيل الخروج',
  languageLabel: 'اللغة',
  themeSafe: 'آمن (أخضر)',
  themeDanger: 'تهديد احتيال (أحمر)',
  analyzeBtn: 'تحليل التهديد',
  clearBtn: 'مسح',
  copyResultsBtn: 'نسخ النتائج',
  safeLabel: 'آمن',
  suspiciousLabel: 'مشبوه',
  highRiskLabel: 'خطر مرتفع',
  scamDnaTitle: 'البصمة الوراثية للاحتيال',
};

const JA: TranslationBundle = {
  ...EN,
  brandSubtitle: 'あなたのデジタル安全ガーディアン',
  tagline: 'クリックする前に考える – AIで安全を守る。',
  heroTitle: '詐欺メッセージ、フィッシングURL、不審な発信者、不正送金を数秒で検知します。',
  navScanner: 'スキャナー',
  navPhone: '電話番号調査',
  navPayments: '決済ガード',
  navMap: '世界脅威マップ',
  navAssistant: 'AIアシスタント',
  navOwner: 'オーナー設定',
  quickScanCta: '今すぐスキャン',
  signInGoogle: 'Googleでログイン',
  signOut: 'ログアウト',
  languageLabel: '言語',
  themeSafe: '安全 (グリーン)',
  themeDanger: '詐欺警告 (レッド)',
  analyzeBtn: '脅威を分析',
  clearBtn: 'クリア',
  copyResultsBtn: '結果をコピー',
  safeLabel: '安全',
  suspiciousLabel: '注意',
  highRiskLabel: '高リスク',
  scamDnaTitle: '詐欺DNAフィンガープリント',
};

const PT: TranslationBundle = {
  ...EN,
  brandSubtitle: 'Seu Guardião de Segurança Digital',
  tagline: 'Pense Antes de Clicar – Fique Seguro com IA.',
  heroTitle: 'Detecte golpes, links de phishing, chamadas suspeitas e pagamentos fraudulentos em segundos.',
  navScanner: 'Scanner',
  navPhone: 'Telefones',
  navPayments: 'Pagamentos',
  navMap: 'Mapa Global',
  navAssistant: 'Assistente IA',
  navOwner: 'Painel do Dono',
  quickScanCta: 'Analisar Agora',
  signInGoogle: 'Entrar com Google',
  signOut: 'Sair',
  languageLabel: 'Idioma',
  themeSafe: 'Seguro (Verde)',
  themeDanger: 'Alerta de Golpe (Vermelho)',
  analyzeBtn: 'Analisar Ameaça',
  clearBtn: 'Limpar',
  copyResultsBtn: 'Copiar',
  safeLabel: 'Seguro',
  suspiciousLabel: 'Suspeito',
  highRiskLabel: 'Alto Risco',
  scamDnaTitle: 'Impressão Digital DNA do Golpe',
};

const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: EN,
  hi: HI,
  es: ES,
  fr: FR,
  de: DE,
  ar: AR,
  ja: JA,
  pt: PT,
};

export function getTranslations(lang: LanguageCode): TranslationBundle {
  return TRANSLATIONS[lang] || EN;
}

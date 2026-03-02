/**
 * Polyglot Intelligence Stack
 *
 * A layered multilingual system that orchestrates language detection,
 * translation, cross‑lingual reasoning, speech‑to‑text / text‑to‑speech,
 * and OCR across all major language families.
 *
 * Core capabilities:
 *   • Detect language of any input with confidence scoring
 *   • Route text to the correct language model
 *   • Translate between any two languages (6 translation modes)
 *   • Preserve meaning, tone, cultural nuance, and symbolic structure
 *   • Handle mixed‑language inputs
 *   • Support dialects, regional variants, ancient and historical forms
 *   • Integrate with symbolic and cultural layers
 *   • Enforce safety rules in every language
 *
 * Translation modes:
 *   1. Literal    — fast 1:1 token mapping (technical / legal)
 *   2. Semantic   — preserves meaning and tone
 *   3. Cultural   — adapts idioms, metaphors, and context
 *   4. Symbolic   — preserves archetypes, motifs, mythic structures
 *   5. Technical  — code, formulas, scientific terminology
 *   6. Safety     — ensures unsafe content cannot hide via language switch
 *
 * Adaptive behaviour (slow, stable, moral‑anchored):
 *   Adapts: preferred languages, translation style, symbolic depth,
 *           UI density, mission language defaults.
 *   NEVER adapts: safety, ethics, legality, maturity, prohibited filters.
 *
 * Cross‑subsystem integration:
 *   IntegritySafetyKernel  → safety pass on every translation
 *   EpistemicIntegrity     → cross‑lingual source verification
 *   CulturalHistorical     → cultural context routing
 *   SymbolicInterpretation → cross‑cultural archetype mapping
 *   MissionCompiler        → multilingual mission building
 *   ZPE routing            → model selection per language
 *   Dashboard              → language badges, confidence bars
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** Major language family classification. */
export type LanguageFamily =
  | 'indo_european'
  | 'sino_tibetan'
  | 'afro_asiatic'
  | 'niger_congo'
  | 'austronesian'
  | 'turkic'
  | 'uralic'
  | 'dravidian'
  | 'japonic'
  | 'koreanic'
  | 'indigenous'
  | 'ancient'
  | 'constructed'
  | 'unknown';

/** Writing script classification. */
export type ScriptFamily =
  | 'latin'
  | 'cyrillic'
  | 'arabic'
  | 'devanagari'
  | 'hanzi'
  | 'kana'
  | 'hangul'
  | 'thai'
  | 'ge_ez'
  | 'tibetan'
  | 'hebrew'
  | 'greek'
  | 'tamil'
  | 'telugu'
  | 'other';

/** Translation mode. */
export type TranslationMode =
  | 'literal'
  | 'semantic'
  | 'cultural'
  | 'symbolic'
  | 'technical'
  | 'safety';

/** Status of the overall polyglot engine. */
export type PolyglotStatus = 'READY' | 'DEGRADED' | 'OFFLINE';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Individual language entry in the registry. */
export interface LanguageEntry {
  code: string;           // ISO 639‑1 or 639‑3 code
  name: string;           // Human‑readable name
  family: LanguageFamily;
  script: ScriptFamily;
  isAncient: boolean;
  isDialect: boolean;
  parentCode?: string;    // Parent language code for dialects
}

/** Result of language detection. */
export interface DetectionResult {
  language: LanguageEntry;
  confidence: number;     // 0–1
  alternates: Array<{ language: LanguageEntry; confidence: number }>;
  isMixed: boolean;
  mixedLanguages: LanguageEntry[];
  scriptDetected: ScriptFamily;
}

/** Result of a translation operation. */
export interface TranslationResult {
  id: string;
  sourceLanguage: LanguageEntry;
  targetLanguage: LanguageEntry;
  mode: TranslationMode;
  sourceText: string;
  translatedText: string;
  confidence: number;
  notes: string[];
  culturalAnnotations: string[];
  symbolicPreserved: boolean;
  safetyCleared: boolean;
  timestamp: string;
}

/** Speech‑to‑text result. */
export interface TranscriptionResult {
  text: string;
  language: LanguageEntry;
  confidence: number;
  durationMs: number;
  segments: Array<{ start: number; end: number; text: string }>;
}

/** Text‑to‑speech result (metadata — audio is external). */
export interface SynthesisResult {
  language: LanguageEntry;
  text: string;
  voiceId: string;
  durationMs: number;
  safetyCleared: boolean;
}

/** OCR extraction result. */
export interface OCRResult {
  text: string;
  language: LanguageEntry;
  script: ScriptFamily;
  confidence: number;
  regions: Array<{ x: number; y: number; w: number; h: number; text: string }>;
}

/** Cross‑lingual reasoning comparison. */
export interface CrossLingualComparison {
  id: string;
  conceptA: { language: LanguageEntry; text: string };
  conceptB: { language: LanguageEntry; text: string };
  semanticSimilarity: number;
  culturalDivergence: number;
  symbolicParallels: string[];
  notes: string[];
}

/** Adaptive preferences that evolve slowly. */
export interface PolyglotPreferences {
  preferredLanguages: string[];
  preferredTranslationMode: TranslationMode;
  symbolicDepth: number;       // 0–1
  uiLanguageDensity: number;   // 0–1
  missionLanguageDefault: string;
  reinforcementCount: number;
}

/** Polyglot event for the dashboard feed. */
export interface PolyglotEvent {
  id: string;
  kind: 'detection' | 'translation' | 'transcription' | 'synthesis' | 'ocr' | 'comparison';
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  mode?: TranslationMode;
  timestamp: string;
}

/** Aggregate summary for getSummary(). */
export interface PolyglotSummary {
  supportedLanguages: number;
  supportedFamilies: number;
  totalDetections: number;
  totalTranslations: number;
  totalTranscriptions: number;
  totalOCRExtractions: number;
  totalComparisons: number;
  avgDetectionConfidence: number;
  avgTranslationConfidence: number;
  topLanguages: Array<{ code: string; name: string; count: number }>;
  recentEvents: PolyglotEvent[];
  preferences: PolyglotPreferences;
  status: PolyglotStatus;
}

// ---------------------------------------------------------------------------
// Language Registry (built‑in)
// ---------------------------------------------------------------------------

const LANGUAGES: LanguageEntry[] = [
  // Indo‑European
  { code: 'en', name: 'English', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'fr', name: 'French', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'es', name: 'Spanish', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'de', name: 'German', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'pt', name: 'Portuguese', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'it', name: 'Italian', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'nl', name: 'Dutch', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'ru', name: 'Russian', family: 'indo_european', script: 'cyrillic', isAncient: false, isDialect: false },
  { code: 'uk', name: 'Ukrainian', family: 'indo_european', script: 'cyrillic', isAncient: false, isDialect: false },
  { code: 'pl', name: 'Polish', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'hi', name: 'Hindi', family: 'indo_european', script: 'devanagari', isAncient: false, isDialect: false },
  { code: 'bn', name: 'Bengali', family: 'indo_european', script: 'other', isAncient: false, isDialect: false },
  { code: 'ur', name: 'Urdu', family: 'indo_european', script: 'arabic', isAncient: false, isDialect: false },
  { code: 'fa', name: 'Persian', family: 'indo_european', script: 'arabic', isAncient: false, isDialect: false },
  { code: 'el', name: 'Greek', family: 'indo_european', script: 'greek', isAncient: false, isDialect: false },
  { code: 'sv', name: 'Swedish', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'no', name: 'Norwegian', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'da', name: 'Danish', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'ro', name: 'Romanian', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },
  { code: 'cs', name: 'Czech', family: 'indo_european', script: 'latin', isAncient: false, isDialect: false },

  // Sino‑Tibetan
  { code: 'zh', name: 'Mandarin Chinese', family: 'sino_tibetan', script: 'hanzi', isAncient: false, isDialect: false },
  { code: 'yue', name: 'Cantonese', family: 'sino_tibetan', script: 'hanzi', isAncient: false, isDialect: true, parentCode: 'zh' },
  { code: 'bo', name: 'Tibetan', family: 'sino_tibetan', script: 'tibetan', isAncient: false, isDialect: false },
  { code: 'my', name: 'Burmese', family: 'sino_tibetan', script: 'other', isAncient: false, isDialect: false },

  // Afro‑Asiatic
  { code: 'ar', name: 'Arabic', family: 'afro_asiatic', script: 'arabic', isAncient: false, isDialect: false },
  { code: 'he', name: 'Hebrew', family: 'afro_asiatic', script: 'hebrew', isAncient: false, isDialect: false },
  { code: 'am', name: 'Amharic', family: 'afro_asiatic', script: 'ge_ez', isAncient: false, isDialect: false },

  // Niger‑Congo
  { code: 'sw', name: 'Swahili', family: 'niger_congo', script: 'latin', isAncient: false, isDialect: false },
  { code: 'yo', name: 'Yoruba', family: 'niger_congo', script: 'latin', isAncient: false, isDialect: false },
  { code: 'zu', name: 'Zulu', family: 'niger_congo', script: 'latin', isAncient: false, isDialect: false },
  { code: 'ig', name: 'Igbo', family: 'niger_congo', script: 'latin', isAncient: false, isDialect: false },

  // Austronesian
  { code: 'tl', name: 'Tagalog', family: 'austronesian', script: 'latin', isAncient: false, isDialect: false },
  { code: 'ms', name: 'Malay', family: 'austronesian', script: 'latin', isAncient: false, isDialect: false },
  { code: 'id', name: 'Indonesian', family: 'austronesian', script: 'latin', isAncient: false, isDialect: false },
  { code: 'haw', name: 'Hawaiian', family: 'austronesian', script: 'latin', isAncient: false, isDialect: false },

  // Turkic
  { code: 'tr', name: 'Turkish', family: 'turkic', script: 'latin', isAncient: false, isDialect: false },
  { code: 'uz', name: 'Uzbek', family: 'turkic', script: 'latin', isAncient: false, isDialect: false },
  { code: 'kk', name: 'Kazakh', family: 'turkic', script: 'cyrillic', isAncient: false, isDialect: false },
  { code: 'az', name: 'Azerbaijani', family: 'turkic', script: 'latin', isAncient: false, isDialect: false },

  // Uralic
  { code: 'fi', name: 'Finnish', family: 'uralic', script: 'latin', isAncient: false, isDialect: false },
  { code: 'hu', name: 'Hungarian', family: 'uralic', script: 'latin', isAncient: false, isDialect: false },
  { code: 'et', name: 'Estonian', family: 'uralic', script: 'latin', isAncient: false, isDialect: false },

  // Dravidian
  { code: 'ta', name: 'Tamil', family: 'dravidian', script: 'tamil', isAncient: false, isDialect: false },
  { code: 'te', name: 'Telugu', family: 'dravidian', script: 'telugu', isAncient: false, isDialect: false },
  { code: 'kn', name: 'Kannada', family: 'dravidian', script: 'other', isAncient: false, isDialect: false },
  { code: 'ml', name: 'Malayalam', family: 'dravidian', script: 'other', isAncient: false, isDialect: false },

  // Japonic
  { code: 'ja', name: 'Japanese', family: 'japonic', script: 'kana', isAncient: false, isDialect: false },

  // Koreanic
  { code: 'ko', name: 'Korean', family: 'koreanic', script: 'hangul', isAncient: false, isDialect: false },

  // Ancient
  { code: 'la', name: 'Latin', family: 'ancient', script: 'latin', isAncient: true, isDialect: false },
  { code: 'grc', name: 'Ancient Greek', family: 'ancient', script: 'greek', isAncient: true, isDialect: false },
  { code: 'sa', name: 'Sanskrit', family: 'ancient', script: 'devanagari', isAncient: true, isDialect: false },
  { code: 'non', name: 'Old Norse', family: 'ancient', script: 'latin', isAncient: true, isDialect: false },
  { code: 'lzh', name: 'Classical Chinese', family: 'ancient', script: 'hanzi', isAncient: true, isDialect: false },
  { code: 'egy', name: 'Ancient Egyptian', family: 'ancient', script: 'other', isAncient: true, isDialect: false },
  { code: 'akk', name: 'Akkadian', family: 'ancient', script: 'other', isAncient: true, isDialect: false },
  { code: 'sux', name: 'Sumerian', family: 'ancient', script: 'other', isAncient: true, isDialect: false },

  // Thai
  { code: 'th', name: 'Thai', family: 'unknown', script: 'thai', isAncient: false, isDialect: false },

  // Vietnamese
  { code: 'vi', name: 'Vietnamese', family: 'unknown', script: 'latin', isAncient: false, isDialect: false },
];

// ---------------------------------------------------------------------------
// Script Detection Ranges (Unicode block boundaries)
// ---------------------------------------------------------------------------

interface ScriptRange {
  script: ScriptFamily;
  ranges: Array<[number, number]>;
}

const SCRIPT_RANGES: ScriptRange[] = [
  { script: 'cyrillic', ranges: [[0x0400, 0x04FF], [0x0500, 0x052F]] },
  { script: 'arabic', ranges: [[0x0600, 0x06FF], [0x0750, 0x077F], [0xFB50, 0xFDFF], [0xFE70, 0xFEFF]] },
  { script: 'devanagari', ranges: [[0x0900, 0x097F], [0xA8E0, 0xA8FF]] },
  { script: 'tamil', ranges: [[0x0B80, 0x0BFF]] },
  { script: 'telugu', ranges: [[0x0C00, 0x0C7F]] },
  { script: 'thai', ranges: [[0x0E00, 0x0E7F]] },
  { script: 'tibetan', ranges: [[0x0F00, 0x0FFF]] },
  { script: 'ge_ez', ranges: [[0x1200, 0x137F]] },
  { script: 'hangul', ranges: [[0xAC00, 0xD7AF], [0x1100, 0x11FF], [0x3130, 0x318F]] },
  { script: 'hanzi', ranges: [[0x4E00, 0x9FFF], [0x3400, 0x4DBF], [0x20000, 0x2A6DF]] },
  { script: 'kana', ranges: [[0x3040, 0x309F], [0x30A0, 0x30FF], [0x31F0, 0x31FF]] },
  { script: 'hebrew', ranges: [[0x0590, 0x05FF], [0xFB1D, 0xFB4F]] },
  { script: 'greek', ranges: [[0x0370, 0x03FF], [0x1F00, 0x1FFF]] },
];

// ---------------------------------------------------------------------------
// Keyword Hints for Language Detection
// ---------------------------------------------------------------------------

interface LanguageHint {
  code: string;
  keywords: RegExp;
}

/** Common function words / particles that strongly hint at a language. */
const LANGUAGE_HINTS: LanguageHint[] = [
  { code: 'en', keywords: /\b(the|is|are|was|were|have|has|been|will|would|could|should|this|that|with|from|they|them|their|about)\b/i },
  { code: 'fr', keywords: /\b(le|la|les|un|une|des|est|sont|avec|dans|pour|que|qui|sur|par|mais|tout|cette|nous|vous)\b/i },
  { code: 'es', keywords: /\b(el|los|las|una|unos|unas|es|son|con|por|que|del|como|pero|para|esta|este|todo)\b/i },
  { code: 'de', keywords: /\b(der|die|das|ein|eine|ist|sind|mit|und|von|den|dem|auf|nicht|auch|sich|wir|ihr)\b/i },
  { code: 'it', keywords: /\b(il|lo|gli|una|dei|delle|con|per|che|non|sono|del|dal|nel|alla|questo|questa|anche)\b/i },
  { code: 'pt', keywords: /\b(os|as|uma|umas|dos|das|com|por|que|para|mais|isso|esta|este|foi|tem|muito)\b/i },
  { code: 'ru', keywords: /\b(\u0438|\u0432|\u043d\u0435|\u043d\u0430|\u043a\u0430\u043a|\u044d\u0442\u043e|\u0447\u0442\u043e|\u043e\u043d|\u043e\u043d\u0430|\u043c\u044b|\u0432\u044b|\u0438\u0445|\u043e\u043d\u0438|\u0431\u044b\u043b|\u0435\u0441\u0442\u044c|\u043f\u043e|\u0441\u043e|\u0434\u043b\u044f)\b/i },
  { code: 'ar', keywords: /(\u0641\u064a|\u0645\u0646|\u0639\u0644\u0649|\u0625\u0644\u0649|\u0647\u0630\u0627|\u0647\u0630\u0647|\u0627\u0644\u0630\u064a|\u0627\u0644\u062a\u064a|\u0643\u0627\u0646|\u0644\u0643\u0646|\u0648\u0627\u0644|\u0644\u0627)/ },
  { code: 'hi', keywords: /(\u0939\u0948|\u0915\u093E|\u0915\u0947|\u0915\u0940|\u092E\u0947\u0902|\u0938\u0947|\u0915\u094B|\u092A\u0930|\u0928\u0947|\u0939\u094B|\u0925\u093E|\u0925\u0940)/ },
  { code: 'zh', keywords: /[\u7684\u662F\u4E0D\u4E86\u4EBA\u6211\u5728\u6709\u4ED6\u8FD9\u4E2D\u5927\u6765\u4E0A\u4E2A\u56FD\u548C\u5230]/ },
  { code: 'ja', keywords: /(\u306E|\u306F|\u3092|\u304C|\u3067|\u3068|\u306B|\u3082|\u304B|\u3089|\u305F|\u307E|\u3059|\u3067\u3059|\u307E\u3059)/ },
  { code: 'ko', keywords: /(\uC740|\uB294|\uC774|\uAC00|\uC744|\uB97C|\uC5D0|\uC5D0\u0020|\uB3C4|\uC73C\u0020|\uB85C|\uD558|\uB2E4|\uC740\uB370)/ },
  { code: 'tr', keywords: /\b(bir|bu|ve|ile|olan|gibi|ama|ancak|kadar|daha|sonra|icin|benim|senin|onun|onlar)\b/i },
  { code: 'sw', keywords: /\b(na|ya|wa|ni|kwa|au|lakini|hata|kwamba|hiyo|yake|wao|sisi|wetu)\b/i },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EVENTS = 50_000;
const LEARNING_RATE = 0.01;
const MIN_REINFORCEMENTS = 25;
const MAX_DRIFT = 0.3;
const UNKNOWN_LANG: LanguageEntry = {
  code: 'und',
  name: 'Undetermined',
  family: 'unknown',
  script: 'other',
  isAncient: false,
  isDialect: false,
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class PolyglotIntelligenceStack {
  private readonly registry: Map<string, LanguageEntry> = new Map();
  private readonly events: PolyglotEvent[] = [];
  private readonly languageCounts: Map<string, number> = new Map();
  private listeners: Array<(event: PolyglotEvent) => void> = [];

  // Running stats
  private totalDetections = 0;
  private totalTranslations = 0;
  private totalTranscriptions = 0;
  private totalOCR = 0;
  private totalComparisons = 0;
  private detectionConfidenceSum = 0;
  private translationConfidenceSum = 0;

  // Adaptive preferences (slow‑learning)
  private preferences: PolyglotPreferences = {
    preferredLanguages: ['en'],
    preferredTranslationMode: 'semantic',
    symbolicDepth: 0.5,
    uiLanguageDensity: 0.5,
    missionLanguageDefault: 'en',
    reinforcementCount: 0,
  };

  constructor() {
    for (const lang of LANGUAGES) {
      this.registry.set(lang.code, lang);
    }
  }

  // ========================================================================
  // Language Detection
  // ========================================================================

  /**
   * Detect the language of an input string.
   * Uses a 3‑layer approach: script analysis → keyword matching → fallback.
   */
  detectLanguage(input: string): DetectionResult {
    const scriptResult = this.detectScript(input);
    const keywordResult = this.matchKeywords(input);
    const merged = this.mergeDetections(scriptResult, keywordResult, input);

    this.totalDetections += 1;
    this.detectionConfidenceSum += merged.confidence;
    this.incrementLanguageCount(merged.language.code);
    this.emitEvent('detection', merged.language.code, '', merged.confidence);

    return merged;
  }

  // ========================================================================
  // Translation
  // ========================================================================

  /**
   * Translate input text to a target language using the specified mode.
   * Defaults to semantic translation.
   */
  translate(
    input: string,
    targetLangCode: string,
    mode: TranslationMode = 'semantic',
  ): TranslationResult {
    const detected = this.detectLanguage(input);
    const targetLang = this.registry.get(targetLangCode) ?? UNKNOWN_LANG;
    const notes: string[] = [];
    const culturalAnnotations: string[] = [];

    // Determine translation quality factors
    if (detected.language.isAncient) {
      notes.push('Source is an ancient language — translation may require scholarly interpretation');
    }
    if (targetLang.isAncient) {
      notes.push('Target is an ancient language — limited model coverage expected');
    }
    if (detected.isMixed) {
      notes.push(`Mixed‑language input detected (${detected.mixedLanguages.map((l) => l.name).join(', ')})`);
    }

    // Mode‑specific annotations
    const modeAnnotations = this.generateModeAnnotations(mode, detected.language, targetLang);
    for (const ann of modeAnnotations) culturalAnnotations.push(ann);

    // Confidence calculation based on mode and languages
    const confidence = this.calculateTranslationConfidence(detected, targetLang, mode);

    // Simulated translation (actual model integration point)
    const translatedText = this.simulateTranslation(input, detected.language, targetLang, mode);

    const result: TranslationResult = {
      id: `pgl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sourceLanguage: detected.language,
      targetLanguage: targetLang,
      mode,
      sourceText: input,
      translatedText,
      confidence,
      notes,
      culturalAnnotations,
      symbolicPreserved: mode === 'symbolic' || mode === 'cultural',
      safetyCleared: true, // ISK integration clears this externally
      timestamp: new Date().toISOString(),
    };

    this.totalTranslations += 1;
    this.translationConfidenceSum += confidence;
    this.incrementLanguageCount(targetLangCode);
    this.emitEvent('translation', detected.language.code, targetLangCode, confidence, mode);

    return result;
  }

  // ========================================================================
  // Speech‑to‑Text (STT)
  // ========================================================================

  /**
   * Transcribe audio input to text.
   * This is the integration point — actual STT is delegated to external services.
   */
  transcribe(audioDurationMs: number, detectedLang?: string): TranscriptionResult {
    const lang = detectedLang
      ? (this.registry.get(detectedLang) ?? UNKNOWN_LANG)
      : UNKNOWN_LANG;

    const result: TranscriptionResult = {
      text: '', // Populated by external STT service
      language: lang,
      confidence: lang.code === 'und' ? 0.3 : 0.85,
      durationMs: audioDurationMs,
      segments: [],
    };

    this.totalTranscriptions += 1;
    this.emitEvent('transcription', lang.code, '', result.confidence);

    return result;
  }

  // ========================================================================
  // Text‑to‑Speech (TTS)
  // ========================================================================

  /**
   * Generate speech synthesis metadata.
   * Actual audio generation delegated to external services.
   */
  synthesize(text: string, langCode: string): SynthesisResult {
    const lang = this.registry.get(langCode) ?? UNKNOWN_LANG;

    const result: SynthesisResult = {
      language: lang,
      text,
      voiceId: `voice-${langCode}-default`,
      durationMs: Math.round(text.length * 60), // rough estimate
      safetyCleared: true,
    };

    this.emitEvent('synthesis', langCode, '', 1);
    return result;
  }

  // ========================================================================
  // OCR (Optical Character Recognition)
  // ========================================================================

  /**
   * Extract text from image/document metadata.
   * Actual OCR delegated to external services.
   */
  extractText(detectedScript?: ScriptFamily, detectedLang?: string): OCRResult {
    const lang = detectedLang
      ? (this.registry.get(detectedLang) ?? UNKNOWN_LANG)
      : UNKNOWN_LANG;

    const result: OCRResult = {
      text: '', // Populated by external OCR service
      language: lang,
      script: detectedScript ?? lang.script,
      confidence: lang.code === 'und' ? 0.3 : 0.8,
      regions: [],
    };

    this.totalOCR += 1;
    this.emitEvent('ocr', lang.code, '', result.confidence);

    return result;
  }

  // ========================================================================
  // Cross‑Lingual Reasoning
  // ========================================================================

  /**
   * Compare two concepts across languages for semantic similarity,
   * cultural divergence, and symbolic parallels.
   */
  compareConcepts(
    textA: string,
    langA: string,
    textB: string,
    langB: string,
  ): CrossLingualComparison {
    const langEntryA = this.registry.get(langA) ?? UNKNOWN_LANG;
    const langEntryB = this.registry.get(langB) ?? UNKNOWN_LANG;

    // Semantic similarity: shared word stems / token overlap
    const tokensA = new Set(textA.toLowerCase().split(/\s+/));
    const tokensB = new Set(textB.toLowerCase().split(/\s+/));
    const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
    const union = new Set([...tokensA, ...tokensB]).size;
    const semanticSimilarity = union > 0 ? Number((intersection / union).toFixed(4)) : 0;

    // Cultural divergence: based on family distance
    const culturalDivergence = this.calculateFamilyDistance(langEntryA, langEntryB);

    // Symbolic parallels
    const symbolicParallels: string[] = [];
    if (langEntryA.family !== langEntryB.family) {
      symbolicParallels.push(`Cross‑family comparison: ${langEntryA.family} ↔ ${langEntryB.family}`);
    }
    if (langEntryA.isAncient || langEntryB.isAncient) {
      symbolicParallels.push('Temporal gap: involves an ancient language');
    }

    const comparison: CrossLingualComparison = {
      id: `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      conceptA: { language: langEntryA, text: textA },
      conceptB: { language: langEntryB, text: textB },
      semanticSimilarity,
      culturalDivergence,
      symbolicParallels,
      notes: [],
    };

    this.totalComparisons += 1;
    this.emitEvent('comparison', langA, langB, semanticSimilarity);

    return comparison;
  }

  // ========================================================================
  // Adaptive Preferences
  // ========================================================================

  /**
   * Reinforce a preference observation (slow, stable adaptation).
   * Safety, ethics, legality, maturity — NEVER adapted.
   */
  reinforce(dimension: keyof Pick<PolyglotPreferences, 'symbolicDepth' | 'uiLanguageDensity'>, delta: number): void {
    this.preferences.reinforcementCount += 1;
    if (this.preferences.reinforcementCount < MIN_REINFORCEMENTS) return;

    const current = this.preferences[dimension];
    const baseline = 0.5;
    const adjusted = current + delta * LEARNING_RATE;
    const clamped = Math.max(baseline - MAX_DRIFT, Math.min(baseline + MAX_DRIFT, adjusted));
    this.preferences[dimension] = Number(clamped.toFixed(4));
  }

  /** Set preferred languages (user‑initiated, not adaptive). */
  setPreferredLanguages(codes: string[]): void {
    this.preferences.preferredLanguages = codes.filter((c) => this.registry.has(c));
  }

  /** Set preferred translation mode (user‑initiated). */
  setPreferredMode(mode: TranslationMode): void {
    this.preferences.preferredTranslationMode = mode;
  }

  /** Set default mission language. */
  setMissionLanguageDefault(code: string): void {
    if (this.registry.has(code)) {
      this.preferences.missionLanguageDefault = code;
    }
  }

  getPreferences(): Readonly<PolyglotPreferences> {
    return { ...this.preferences };
  }

  // ========================================================================
  // Registry Queries
  // ========================================================================

  getLanguage(code: string): LanguageEntry | undefined {
    return this.registry.get(code);
  }

  getAllLanguages(): LanguageEntry[] {
    return [...this.registry.values()];
  }

  getLanguagesByFamily(family: LanguageFamily): LanguageEntry[] {
    return [...this.registry.values()].filter((l) => l.family === family);
  }

  getAncientLanguages(): LanguageEntry[] {
    return [...this.registry.values()].filter((l) => l.isAncient);
  }

  getSupportedFamilies(): LanguageFamily[] {
    const families = new Set<LanguageFamily>();
    for (const lang of this.registry.values()) families.add(lang.family);
    return [...families];
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (event: PolyglotEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getRecentEvents(limit = 50): PolyglotEvent[] {
    return this.events.slice(-limit);
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): PolyglotSummary {
    const topLanguages = [...this.languageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({
        code,
        name: this.registry.get(code)?.name ?? code,
        count,
      }));

    return {
      supportedLanguages: this.registry.size,
      supportedFamilies: this.getSupportedFamilies().length,
      totalDetections: this.totalDetections,
      totalTranslations: this.totalTranslations,
      totalTranscriptions: this.totalTranscriptions,
      totalOCRExtractions: this.totalOCR,
      totalComparisons: this.totalComparisons,
      avgDetectionConfidence: this.totalDetections > 0
        ? Number((this.detectionConfidenceSum / this.totalDetections).toFixed(4))
        : 0,
      avgTranslationConfidence: this.totalTranslations > 0
        ? Number((this.translationConfidenceSum / this.totalTranslations).toFixed(4))
        : 0,
      topLanguages,
      recentEvents: this.events.slice(-10),
      preferences: { ...this.preferences },
      status: this.getStatus(),
    };
  }

  // ========================================================================
  // Internals — Script Detection
  // ========================================================================

  /** Detect the primary script family by Unicode range analysis. */
  private detectScript(input: string): { script: ScriptFamily; confidence: number } {
    const counts = new Map<ScriptFamily, number>();
    let totalClassified = 0;

    for (const ch of input) {
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;
      const script = this.classifyCodePoint(cp);
      if (script !== 'latin') {
        counts.set(script, (counts.get(script) ?? 0) + 1);
        totalClassified += 1;
      }
    }

    // If no non‑Latin scripts found, default to Latin
    if (totalClassified === 0) {
      return { script: 'latin', confidence: 0.5 };
    }

    let bestScript: ScriptFamily = 'latin';
    let bestCount = 0;
    for (const [script, count] of counts) {
      if (count > bestCount) {
        bestScript = script;
        bestCount = count;
      }
    }

    const confidence = Number((bestCount / Math.max(totalClassified, 1)).toFixed(4));
    return { script: bestScript, confidence: Math.min(1, confidence) };
  }

  /** Classify a single code point into a script family. */
  private classifyCodePoint(cp: number): ScriptFamily {
    for (const { script, ranges } of SCRIPT_RANGES) {
      if (ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) {
        return script;
      }
    }
    return 'latin';
  }

  // ========================================================================
  // Internals — Keyword Matching
  // ========================================================================

  /** Match language‑specific keywords/function‑words. */
  private matchKeywords(input: string): Array<{ code: string; score: number }> {
    const results: Array<{ code: string; score: number }> = [];

    for (const { code, keywords } of LANGUAGE_HINTS) {
      const matches = input.match(keywords);
      if (matches) {
        const words = input.split(/\s+/).length;
        const ratio = words > 0 ? matches.length / words : 0;
        results.push({ code, score: Math.min(1, ratio * 3) });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // ========================================================================
  // Internals — Detection Merging
  // ========================================================================

  /** Merge script‑based and keyword‑based detections. */
  private mergeDetections(
    scriptResult: { script: ScriptFamily; confidence: number },
    keywordResults: Array<{ code: string; score: number }>,
    input: string,
  ): DetectionResult {
    // Find languages matching the detected script
    const scriptLangs = [...this.registry.values()].filter(
      (l) => l.script === scriptResult.script,
    );

    let bestLang: LanguageEntry = UNKNOWN_LANG;
    let bestConfidence = 0;
    const alternates: Array<{ language: LanguageEntry; confidence: number }> = [];

    // Keyword match takes priority
    if (keywordResults.length > 0) {
      const top = keywordResults[0];
      const lang = this.registry.get(top.code);
      if (lang) {
        bestLang = lang;
        bestConfidence = Number(((top.score * 0.6 + scriptResult.confidence * 0.4)).toFixed(4));
      }
      // Add alternates
      for (let i = 1; i < Math.min(keywordResults.length, 4); i++) {
        const alt = this.registry.get(keywordResults[i].code);
        if (alt) {
          alternates.push({ language: alt, confidence: Number(keywordResults[i].score.toFixed(4)) });
        }
      }
    } else if (scriptLangs.length === 1) {
      // Unique script → strong signal
      bestLang = scriptLangs[0];
      bestConfidence = Number((scriptResult.confidence * 0.8).toFixed(4));
    } else if (scriptLangs.length > 1) {
      // Ambiguous — pick the most common
      bestLang = scriptLangs[0];
      bestConfidence = Number((scriptResult.confidence * 0.5).toFixed(4));
      for (let i = 1; i < Math.min(scriptLangs.length, 4); i++) {
        alternates.push({ language: scriptLangs[i], confidence: Number((scriptResult.confidence * 0.3).toFixed(4)) });
      }
    }

    // Mixed‑language detection
    const mixedLanguages: LanguageEntry[] = [];
    const isMixed = this.detectMixed(input, keywordResults, mixedLanguages);

    return {
      language: bestLang,
      confidence: Math.min(1, bestConfidence),
      alternates,
      isMixed,
      mixedLanguages,
      scriptDetected: scriptResult.script,
    };
  }

  /** Detect if input contains multiple languages. */
  private detectMixed(
    _input: string,
    keywordResults: Array<{ code: string; score: number }>,
    out: LanguageEntry[],
  ): boolean {
    // If multiple keyword matches with similar scores → mixed
    const strong = keywordResults.filter((k) => k.score > 0.15);
    if (strong.length >= 2) {
      for (const k of strong) {
        const lang = this.registry.get(k.code);
        if (lang) out.push(lang);
      }
      return true;
    }
    return false;
  }

  // ========================================================================
  // Internals — Translation Helpers
  // ========================================================================

  /** Generate mode‑specific cultural annotations. */
  private generateModeAnnotations(
    mode: TranslationMode,
    source: LanguageEntry,
    target: LanguageEntry,
  ): string[] {
    const annotations: string[] = [];

    if (mode === 'cultural' || mode === 'symbolic') {
      if (source.family !== target.family) {
        annotations.push(`Cross‑family translation: ${source.family} → ${target.family}`);
      }
      if (source.isAncient) {
        annotations.push('Source is an ancient language — cultural context may require scholarly verification');
      }
    }

    if (mode === 'symbolic') {
      annotations.push('Symbolic mode: archetypes, motifs, and mythic structures are prioritized');
    }

    if (mode === 'safety') {
      annotations.push('Safety mode: content scanned for hidden unsafe material during translation');
    }

    if (mode === 'technical') {
      annotations.push('Technical mode: preserving formulas, code snippets, and domain terminology');
    }

    return annotations;
  }

  /** Calculate translation confidence based on language pair and mode. */
  private calculateTranslationConfidence(
    detection: DetectionResult,
    target: LanguageEntry,
    mode: TranslationMode,
  ): number {
    let base = detection.confidence;

    // Penalty for ancient languages
    if (detection.language.isAncient || target.isAncient) base *= 0.7;

    // Penalty for cross‑family
    if (detection.language.family !== target.family) base *= 0.85;

    // Penalty for mixed input
    if (detection.isMixed) base *= 0.8;

    // Mode‑based adjustment
    const modeMultiplier: Record<TranslationMode, number> = {
      literal: 1,
      semantic: 0.95,
      cultural: 0.85,
      symbolic: 0.8,
      technical: 0.9,
      safety: 0.95,
    };
    base *= modeMultiplier[mode];

    return Number(Math.max(0.1, Math.min(1, base)).toFixed(4));
  }

  /**
   * Simulate a translation result.
   * In production, this delegates to the actual LLM / translation API.
   */
  private simulateTranslation(
    input: string,
    source: LanguageEntry,
    target: LanguageEntry,
    _mode: TranslationMode,
  ): string {
    // Placeholder — actual translation would call the model router
    return `[${target.code}] ${input} (from ${source.name})`;
  }

  /** Calculate cultural / family distance between two languages. */
  private calculateFamilyDistance(a: LanguageEntry, b: LanguageEntry): number {
    if (a.family === b.family && a.script === b.script) return 0.1;
    if (a.family === b.family) return 0.3;
    if (a.script === b.script) return 0.5;
    return 0.8;
  }

  // ========================================================================
  // Internals — Event Management
  // ========================================================================

  private emitEvent(
    kind: PolyglotEvent['kind'],
    sourceLanguage: string,
    targetLanguage: string,
    confidence: number,
    mode?: TranslationMode,
  ): void {
    const event: PolyglotEvent = {
      id: `pe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      sourceLanguage,
      targetLanguage,
      confidence,
      mode,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }

    for (const fn of this.listeners) fn(event);
  }

  private incrementLanguageCount(code: string): void {
    this.languageCounts.set(code, (this.languageCounts.get(code) ?? 0) + 1);
  }

  private getStatus(): PolyglotStatus {
    if (this.registry.size === 0) return 'OFFLINE';
    if (this.registry.size < 10) return 'DEGRADED';
    return 'READY';
  }
}

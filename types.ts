// Phase 3: Design Compiler Engine Types

export type Step = 'input' | 'analyzing' | 'analysis-review' | 'preferences' | 'generating' | 'preview';

// Structure of data analyzed from the old website (Phase 2 output)
export interface AnalysisData {
  scrapeId: string;
  originalUrl: string;
  textContent: {
    headings: string[];
    paragraphs: string[];
    ctas: string[];
    contactInfo: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
  designTokens: {
    colors: string[];
    fonts: string[];
  };
  // URLs of images found on the original site
  scrapedImages: {
    logoUrl?: string;
    heroUrl?: string;
    galleryUrls: string[];
  };
  screenshotUrl?: string;
}

// Structure of user's desired new design
export interface UserPreferences {
  vibe: Record<string, number>; // e.g., { 'minimal': 0.8, 'playful': 0.2 }
  colorPalette: string;
  typography: string;
  layoutFocus: string;
  nanoBananaMoodImage?: string; // URL from Nano Banana
}

// Final output from Gemini
export interface GeneratedSite {
  html: string;
  heroImageUrl: string;
}

// Legacy types for backward compatibility
export interface ExtractedContent {
  headline: string;
  description: string;
  services: string[];
  contactInfo: string;
}

export interface AnalysisResult {
  businessName: string;
  businessType: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  designIssues: string[];
  extractedContent: ExtractedContent;
  recommendedStyle: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppStep {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  PREFERENCES = 'PREFERENCES',
  GENERATING = 'GENERATING',
  PREVIEW = 'PREVIEW'
}

export interface GeneratedAsset {
  type: 'hero' | 'feature' | 'mood';
  url: string;
  prompt: string;
}

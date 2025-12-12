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
  GENERATING = 'GENERATING',
  PREVIEW = 'PREVIEW'
}

export interface GeneratedAsset {
  type: 'hero' | 'feature';
  url: string;
  prompt: string;
}

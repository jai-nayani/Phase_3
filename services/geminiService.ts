import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, GeneratedAsset } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    businessName: { type: Type.STRING },
    businessType: { type: Type.STRING },
    primaryColor: { type: Type.STRING },
    secondaryColor: { type: Type.STRING },
    accentColor: { type: Type.STRING },
    designIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
    extractedContent: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        description: { type: Type.STRING },
        services: { type: Type.ARRAY, items: { type: Type.STRING } },
        contactInfo: { type: Type.STRING }
      }
    },
    recommendedStyle: { type: Type.STRING }
  },
  required: ["businessName", "businessType", "primaryColor", "secondaryColor", "designIssues", "extractedContent", "recommendedStyle"]
};

/**
 * Analyzes screenshots of a website.
 */
export const analyzeScreenshot = async (base64Images: string[]): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash";
  
  const imageParts = base64Images.map(img => {
      const cleanBase64 = img.split(',')[1] || img;
      return { inlineData: { mimeType: "image/png", data: cleanBase64 } };
  });

  const prompt = `
    Analyze these website screenshots. 
    Extract the business details, colors, and content.
    Identify design issues that make it look old or unprofessional.
    Suggest a modern recommended style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No analysis data returned");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Analyzes a URL (simulated via Search grounding then structured extraction).
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash";
  
  try {
    // Step 1: Gather info
    const searchPrompt = `
      Find information about the business at this URL: ${url}.
      I need to know:
      1. Business Name and Type
      2. What services they offer
      3. Their likely branding colors (if found, otherwise infer from industry)
      4. Typical design issues for this type of business's old websites
    `;
    
    const searchResponse = await ai.models.generateContent({
      model: modelId,
      contents: searchPrompt,
      config: { tools: [{googleSearch: {}}] }
    });

    const searchData = searchResponse.text;

    // Step 2: Structure it
    const structurePrompt = `
      Based on this research about ${url}:
      ${searchData}
      
      Create a structured website analysis. 
      Assume a "Before" state that needs improvement.
      Fill in the JSON schema.
    `;

    const structuredResponse = await ai.models.generateContent({
      model: modelId,
      contents: structurePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    if (structuredResponse.text) {
      return JSON.parse(structuredResponse.text) as AnalysisResult;
    }
    throw new Error("Failed to structure URL analysis");

  } catch (error) {
    console.error("URL Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates an image using Gemini Flash Image (Nano Banana).
 */
export const generateAssetImage = async (prompt: string, type: 'hero' | 'feature'): Promise<GeneratedAsset> => {
  const modelId = "gemini-2.5-flash-image";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return {
          type,
          url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          prompt
        };
      }
    }
    throw new Error("No image data generated");
  } catch (error) {
    console.error("Image generation failed:", error);
    // Fallback image
    return {
      type,
      url: `https://picsum.photos/${type === 'hero' ? '1200/800' : '600/400'}?random=${Math.floor(Math.random() * 1000)}`,
      prompt
    };
  }
};

/**
 * Generates the initial HTML code for the modern website.
 */
export const generateWebsiteCode = async (
  analysis: AnalysisResult, 
  assets: GeneratedAsset[]
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  // Organize assets
  const heroAsset = assets.find(a => a.type === 'hero');
  const featureAssets = assets.filter(a => a.type === 'feature');

  const prompt = `
    You are an expert frontend engineer. Rebuild this website.
    
    ANALYSIS:
    Name: ${analysis.businessName}
    Type: ${analysis.businessType}
    Style: ${analysis.recommendedStyle}
    Colors: Primary ${analysis.primaryColor}, Secondary ${analysis.secondaryColor}, Accent ${analysis.accentColor}
    Content: 
      Headline: "${analysis.extractedContent.headline}"
      Desc: "${analysis.extractedContent.description}"
      Services: ${analysis.extractedContent.services.join(', ')}
      Contact: "${analysis.extractedContent.contactInfo}"

    ASSETS TO USE (Use these EXACT URLs/Base64 strings in the <img> tags):
    Hero Image: "${heroAsset?.url || 'https://via.placeholder.com/1200'}"
    Feature Images: 
    ${featureAssets.map((a, i) => `Image ${i+1}: "${a.url}"`).join('\n')}

    REQUIREMENTS:
    1. Single HTML file.
    2. Use Tailwind CSS via CDN.
    3. Modern, clean, responsive design using the recommended style.
    4. Sections: Navbar, Hero (full width), About, Services (Grid), Contact, Footer.
    5. Use the specific colors provided in Tailwind config or arbitrary values (e.g. bg-[#...]).
    6. Use Lucide icons (via unpkg) or SVG.
    7. Font: 'Inter', sans-serif.
    8. Return ONLY raw HTML.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    let code = response.text || "";
    code = code.replace(/```html/g, "").replace(/```/g, "");
    return code;
  } catch (error) {
    console.error("Code generation failed:", error);
    throw error;
  }
};

/**
 * Refines existing HTML based on user chat.
 */
export const refineWebsiteCode = async (currentHtml: string, userInstruction: string): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    You are an expert web developer.
    
    USER INSTRUCTION: "${userInstruction}"
    
    CURRENT HTML:
    ${currentHtml}
    
    TASK:
    1. Modify the Current HTML to satisfy the User Instruction.
    2. Keep the rest of the design intact.
    3. If asking for new content and no text provided, generate professional placeholder text.
    4. Return ONLY the full, valid, updated HTML string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    let code = response.text || "";
    code = code.replace(/```html/g, "").replace(/```/g, "");
    return code;
  } catch (error) {
    console.error("Refinement failed:", error);
    throw error;
  }
};
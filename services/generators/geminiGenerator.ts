import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, ModelType, AspectRatio } from "../../types";
import { ImageGenerator } from "../imageGeneratorService";

/**
 * Helper to convert file to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Simple mime-type detection from base64 signature
 */
function getMimeType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/png'; // Default fallback
}

export class GeminiGenerator implements ImageGenerator {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generate a single image based on settings and slide content with retry logic.
   */
  async generateImage(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null
  ): Promise<string> {
    const ai = this.getClient();
    
    // Construct parts: Images first, then Text for better multimodal stability
    const parts: any[] = [];

    // 1. Add Reference Image (Global Style)
    if (settings.referenceImage) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(settings.referenceImage),
          data: settings.referenceImage
        }
      });
    }

    // 2. Add Slide Specific Image (Content to optimize)
    if (slideImage) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(slideImage),
          data: slideImage
        }
      });
    }

    // 3. Construct Text Prompt
    let fullPrompt = `设计一张专业的PPT幻灯片页面。

【设计规范】
- 风格流派: ${settings.pptStyle || '现代极简商务'}
- 配色方案: ${settings.colorScheme || '专业深蓝与白色搭配'}
- 具体设计要求: ${settings.designRequirements || '排版整洁，重点突出，层级分明'}

【本页内容】
- 核心内容: ${slideContent || '标题页，展示主要议题'}`;

    if (settings.referenceImage) {
      fullPrompt += `\n\n【参考说明】\n请严格参考提供的第一张图片的视觉风格、配色和布局感。`;
    }
    if (slideImage) {
      fullPrompt += `\n\n【内容优化说明】\n请基于提供的具体内容图片（图表/截图/草图）进行专业化重绘和排版优化，保留关键信息。`;
    }

    fullPrompt += `\n\n请严格遵循上述风格与配色，输出一张高品质、无乱码的幻灯片设计图。`;

    parts.push({ text: fullPrompt });

    // Resolve Aspect Ratio
    let finalAspectRatio = settings.aspectRatio as string;
    if (settings.aspectRatio === AspectRatio.CUSTOM && settings.customAspectRatio) {
      finalAspectRatio = settings.customAspectRatio;
    }

    const config: any = {
      imageConfig: {
        aspectRatio: finalAspectRatio,
      }
    };

    if (settings.model === ModelType.PRO) {
       config.imageConfig.imageSize = settings.imageSize;
    }

    let lastError;
    const retries = 3;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: settings.model,
          contents: { parts },
          config: config
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
        
        throw new Error("No image generated in response.");
      } catch (error: any) {
        lastError = error;
        const status = error.status || error.code; // code sometimes used in JSON error body
        const msg = error.message || JSON.stringify(error);
        
        const isOverloaded = status === 503 || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
        const isInternal = status === 500 || msg.includes('Internal Server Error');

        if (attempt < retries - 1 && (isOverloaded || isInternal)) {
           console.warn(`Attempt ${attempt + 1} failed (Status ${status}). Retrying...`);
           // Exponential backoff: 2s, 4s, 8s...
           const delay = Math.pow(2, attempt + 1) * 1000;
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
        }
        
        console.error("Gemini API Error details:", error);
        // Break loop and throw if it's a permanent error or retries exhausted
        break; 
      }
    }
    
    throw lastError;
  }

  /**
   * Generates variations for a slide based on count.
   */
  async generateVariations(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null,
    count: number = 2
  ): Promise<string[]> {
    const promises = [];
    for (let i = 0; i < count; i++) {
      // Add a small stagger to start times to reduce immediate burst load
      const p = new Promise<string>(async (resolve, reject) => {
          await new Promise(r => setTimeout(r, i * 500)); 
          this.generateImage(settings, slideContent, slideImage)
              .then(resolve)
              .catch(reject);
      });
      promises.push(p);
    }

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      throw error;
    }
  }
}

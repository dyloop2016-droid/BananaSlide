import { GenerationSettings, AspectRatio } from "../../types";
import { ImageGenerator } from "../imageGeneratorService";

/**
 * Converts a data URL to a Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

/**
 * Converts a Blob to Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export class DalleGenerator implements ImageGenerator {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  /**
   * Generate a single image using OpenAI DALL-E API
   */
  async generateImage(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    // Construct prompt
    let prompt = `设计一张专业的PPT幻灯片页面。\n\n`;
    
    prompt += `【设计规范】\n`;
    prompt += `- 风格流派: ${settings.pptStyle || '现代极简商务'}\n`;
    prompt += `- 配色方案: ${settings.colorScheme || '专业深蓝与白色搭配'}\n`;
    prompt += `- 具体设计要求: ${settings.designRequirements || '排版整洁，重点突出，层级分明'}\n\n`;
    
    prompt += `【本页内容】\n`;
    prompt += `- 核心内容: ${slideContent || '标题页，展示主要议题'}\n\n`;
    
    if (settings.referenceImage) {
      prompt += `【参考说明】\n请参考提供的图片风格和布局。\n\n`;
    }
    
    if (slideImage) {
      prompt += `【内容优化说明】\n请基于提供的内容图片进行专业化重绘和排版优化，保留关键信息。\n\n`;
    }
    
    prompt += `请严格遵循上述风格与配色，输出一张高品质、无乱码的幻灯片设计图。`;

    // Prepare request body
    const requestBody: any = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: this.getSizeFromSettings(settings),
      quality: "hd"
    };

    // Add reference image if provided
    if (settings.referenceImage || slideImage) {
      // DALL-E 3 doesn't support image inputs directly, so we'll use the prompt
      // For future versions, we could use DALL-E with image inputs if available
    }

    let lastError;
    const retries = 3;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
          throw new Error("No image generated in response");
        }

        // Get image URL from response
        const imageUrl = data.data[0].url;
        
        // Convert URL to Base64 to match the expected return type
        const blob = await dataUrlToBlob(imageUrl);
        const base64 = await blobToBase64(blob);
        
        return base64;
      } catch (error: any) {
        lastError = error;
        
        const isRetryable = error.message.includes("rate limit") || 
                           error.message.includes("overloaded") || 
                           error.message.includes("503") ||
                           error.message.includes("500");

        if (attempt < retries - 1 && isRetryable) {
          console.warn(`Attempt ${attempt + 1} failed. Retrying...`);
          // Exponential backoff
          const delay = Math.pow(2, attempt + 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.error("DALL-E API Error:", error);
        break;
      }
    }
    
    throw lastError;
  }

  /**
   * Generate multiple image variations
   */
  async generateVariations(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null,
    count: number = 2
  ): Promise<string[]> {
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      // Add a small stagger to reduce rate limiting
      const p = new Promise<string>(async (resolve, reject) => {
        await new Promise(r => setTimeout(r, i * 1000));
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

  /**
   * Map settings to DALL-E supported sizes
   */
  private getSizeFromSettings(settings: GenerationSettings): string {
    // DALL-E 3 supports specific sizes
    const sizeMap: Record<string, string> = {
      "1:1": "1024x1024",
      "3:4": "1024x1792",
      "4:3": "1792x1024",
      "9:16": "1024x1792",
      "16:9": "1792x1024",
      "18:8": "1792x1024", // Use closest available
      "8:18": "1024x1792"  // Use closest available
    };

    let aspectRatio = settings.aspectRatio as string;
    if (settings.aspectRatio === AspectRatio.CUSTOM && settings.customAspectRatio) {
      // For custom ratio, use closest standard ratio
      aspectRatio = "16:9"; // Default to widescreen
    }

    return sizeMap[aspectRatio] || "1792x1024"; // Default to widescreen
  }
}

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

export class StabilityGenerator implements ImageGenerator {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.STABILITY_API_KEY || "";
  }

  /**
   * Generate a single image using Stability AI API
   */
  async generateImage(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Stability AI API key is not set");
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
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      width: 1920,
      height: 1080,
      steps: 50,
      cfg_scale: 7.5,
      samples: 1,
      style_preset: "photographic"
    };

    // Adjust dimensions based on aspect ratio
    const dimensions = this.getDimensionsFromAspectRatio(settings.aspectRatio, settings.customAspectRatio);
    requestBody.width = dimensions.width;
    requestBody.height = dimensions.height;

    let lastError;
    const retries = 3;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
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

        const blob = await response.blob();
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
        
        console.error("Stability AI API Error:", error);
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
   * Calculate dimensions based on aspect ratio
   */
  private getDimensionsFromAspectRatio(aspectRatio: AspectRatio, customAspectRatio?: string): { width: number, height: number } {
    const baseWidth = 1920;
    const baseHeight = 1080;

    if (aspectRatio === AspectRatio.CUSTOM && customAspectRatio) {
      // Parse custom aspect ratio
      const parts = customAspectRatio.split(':');
      if (parts.length === 2) {
        const w = parseInt(parts[0]);
        const h = parseInt(parts[1]);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          // Calculate dimensions while maintaining aspect ratio
          if (w > h) {
            // Landscape
            return {
              width: baseWidth,
              height: Math.round((baseWidth * h) / w)
            };
          } else {
            // Portrait
            return {
              width: Math.round((baseHeight * w) / h),
              height: baseHeight
            };
          }
        }
      }
    }

    // Predefined aspect ratios
    const ratioMap: Record<string, { width: number, height: number }> = {
      [AspectRatio.SQUARE]: { width: 1024, height: 1024 },
      [AspectRatio.PORTRAIT]: { width: 1024, height: 1365 },
      [AspectRatio.VERTICAL]: { width: 1024, height: 1792 },
      [AspectRatio.LANDSCAPE]: { width: 1365, height: 1024 },
      [AspectRatio.WIDESCREEN]: { width: 1920, height: 1080 },
      [AspectRatio.ULTRAWIDE]: { width: 2560, height: 1080 },
      [AspectRatio.ULTRATALL]: { width: 1080, height: 2560 }
    };

    return ratioMap[aspectRatio] || { width: baseWidth, height: baseHeight };
  }
}

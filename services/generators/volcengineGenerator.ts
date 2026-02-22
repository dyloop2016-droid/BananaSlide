import { GenerationSettings, AspectRatio, VolcengineModel, VolcengineResolution, VOLCENGINE_ASPECT_RATIOS } from "../../types";
import { ImageGenerator } from "../imageGeneratorService";

interface VolcengineCredentials {
  accessKey: string;
  secretKey: string;
  endpoint?: string;
}

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

const RESOLUTION_BASE_SIZE: Record<VolcengineResolution, { width: number; height: number }> = {
  [VolcengineResolution.K2]: { width: 2048, height: 2048 },
  [VolcengineResolution.K4]: { width: 4096, height: 4096 },
};

const PROXY_BASE = '/volcengine-api';
const DIRECT_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export class VolcengineGenerator implements ImageGenerator {
  private apiKey: string;
  private baseUrl: string;

  constructor(credentials: VolcengineCredentials) {
    this.apiKey = credentials.secretKey;
    this.baseUrl = PROXY_BASE;
  }

  private getModelName(model: VolcengineModel): string {
    switch (model) {
      case VolcengineModel.SEEDDREAM_4_0:
        return "doubao-seedream-4-0-251128";
      case VolcengineModel.SEEDDREAM_4_5:
        return "doubao-seedream-4-5-251128";
      default:
        return "doubao-seedream-4-5-251128";
    }
  }

  private calculateSize(resolution: VolcengineResolution, aspectRatio: AspectRatio, customRatio?: string): string {
    const MAX_PIXELS = 16777216;
    const MIN_PIXELS = 921600;

    const base = RESOLUTION_BASE_SIZE[resolution];
    let basePixels = base.width * base.height;

    if (basePixels > MAX_PIXELS) {
      basePixels = MAX_PIXELS;
    }

    let targetRatio = 1;
    const ratioConfig = VOLCENGINE_ASPECT_RATIOS.find(r => r.val === aspectRatio);

    if (aspectRatio === AspectRatio.CUSTOM && customRatio) {
      const parts = customRatio.split(':');
      if (parts.length === 2) {
        const w = parseInt(parts[0]);
        const h = parseInt(parts[1]);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          targetRatio = w / h;
        }
      }
    } else if (ratioConfig) {
      const parts = ratioConfig.size.split('x');
      if (parts.length === 2) {
        targetRatio = parseInt(parts[0]) / parseInt(parts[1]);
      }
    }

    let height = Math.sqrt(basePixels / targetRatio);
    let width = height * targetRatio;

    const currentPixels = width * height;
    if (currentPixels > MAX_PIXELS) {
      const scale = Math.sqrt(MAX_PIXELS / currentPixels);
      width *= scale;
      height *= scale;
    }

    if (width * height < MIN_PIXELS) {
      const scale = Math.sqrt(MIN_PIXELS / (width * height));
      width *= scale;
      height *= scale;
    }

    width = Math.round(width / 32) * 32;
    height = Math.round(height / 32) * 32;

    while (width * height > MAX_PIXELS && width > 32 && height > 32) {
      if (width >= height) {
        width -= 32;
      } else {
        height -= 32;
      }
    }

    const finalSize = `${Math.round(width)}x${Math.round(height)}`;
    console.log('Volcengine 计算尺寸:', resolution, aspectRatio, '->', finalSize, '像素:', Math.round(width * height));

    return finalSize;
  }

  async generateImage(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("火山方舟 API Key 未设置，请在设置中填写");
    }

    let prompt = `专业PPT幻灯片设计，${settings.pptStyle || '现代极简商务'}风格，`;
    prompt += `${settings.colorScheme || '专业深蓝与白色搭配'}配色，`;
    prompt += `${settings.designRequirements || '排版整洁，重点突出，层级分明'}，`;
    prompt += `内容：${slideContent || '标题页设计'}`;
    prompt += `，高品质，专业幻灯片，高清，无文字，无水印`;

    const modelName = this.getModelName(settings.volcengineModel);
    const size = this.calculateSize(settings.volcengineResolution, settings.aspectRatio, settings.customAspectRatio);

    const requestBody: any = {
      model: modelName,
      prompt: prompt,
      size: size,
      n: 1,
      response_format: "b64_json",
      sequential_image_generation: "disabled",
      stream: false,
      watermark: false
    };

    if (slideImage) {
      requestBody.image = `data:image/png;base64,${slideImage}`;
    }

    const url = `${this.baseUrl}/images/generations`;
    console.log('Volcengine 请求URL:', url);
    console.log('Volcengine API Key长度:', this.apiKey.length);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Volcengine 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Volcengine 错误响应内容:', errorText);
        let errorMsg = `API请求失败: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Volcengine 响应数据:', JSON.stringify(data).substring(0, 200) + '...');

      if (data.data && data.data.length > 0 && data.data[0].b64_json) {
        return data.data[0].b64_json;
      }

      if (data.data && data.data.length > 0 && data.data[0].url) {
        const imageUrl = data.data[0].url;
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error("下载图片失败");
        }
        const blob = await imageResponse.blob();
        return await blobToBase64(blob);
      }

      throw new Error("未收到有效的图像数据");
    } catch (error: any) {
      console.error('Volcengine 请求异常:', error.name, error.message);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("网络请求失败，请检查：1) API Key 是否正确；2) 网络是否能正常访问火山方舟服务；3) 尝试使用代理。");
      }
      throw error;
    }
  }

  async generateVariations(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null,
    count: number = 2
  ): Promise<string[]> {
    const results: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        if (i > 0) {
          await new Promise(r => setTimeout(r, 500));
        }
        const result = await this.generateImage(settings, slideContent, slideImage);
        results.push(result);
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      throw new Error(errors[0]);
    }

    if (results.length === 0) {
      throw new Error("图像生成失败");
    }

    return results;
  }
}

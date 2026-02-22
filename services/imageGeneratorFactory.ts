import { GeneratorType, ApiKeys } from "../types";
import { ImageGenerator } from "./imageGeneratorService";
import { GeminiGenerator } from "./generators/geminiGenerator";
import { VolcengineGenerator } from "./generators/volcengineGenerator";

export class ImageGeneratorFactory {
  static createGenerator(type: GeneratorType, apiKeys: ApiKeys): ImageGenerator {
    switch (type) {
      case GeneratorType.GEMINI:
        if (!apiKeys.geminiApiKey) {
          throw new Error("请在设置中填写 Gemini API Key");
        }
        return new GeminiGenerator(apiKeys.geminiApiKey);
      case GeneratorType.VOLCENGINE:
        if (!apiKeys.volcengineSecretKey) {
          throw new Error("请在设置中填写火山方舟 API Key");
        }
        return new VolcengineGenerator({
          accessKey: "",
          secretKey: apiKeys.volcengineSecretKey,
          endpoint: apiKeys.volcengineEndpoint
        });
      default:
        if (!apiKeys.geminiApiKey) {
          throw new Error("请在设置中填写 Gemini API Key");
        }
        return new GeminiGenerator(apiKeys.geminiApiKey);
    }
  }
}

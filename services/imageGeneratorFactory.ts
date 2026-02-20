import { GeneratorType } from "../types";
import { ImageGenerator } from "./imageGeneratorService";
import { GeminiGenerator } from "./generators/geminiGenerator";
import { DalleGenerator } from "./generators/dalleGenerator";
import { StabilityGenerator } from "./generators/stabilityGenerator";

export class ImageGeneratorFactory {
  static createGenerator(type: GeneratorType): ImageGenerator {
    switch (type) {
      case GeneratorType.GEMINI:
        return new GeminiGenerator();
      case GeneratorType.DALLE:
        return new DalleGenerator();
      case GeneratorType.STABILITY:
        return new StabilityGenerator();
      default:
        return new GeminiGenerator();
    }
  }
}

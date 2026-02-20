import { GenerationSettings } from "../types";

export interface ImageGenerator {
  generateImage(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null
  ): Promise<string>;
  
  generateVariations(
    settings: GenerationSettings,
    slideContent: string,
    slideImage: string | null,
    count: number
  ): Promise<string[]>;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash-image', // Nano Banana
  PRO = 'gemini-3-pro-image-preview' // High Quality
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  VERTICAL = '9:16', // Vertical Video/Phone
  LANDSCAPE = '4:3', // Standard PPT
  WIDESCREEN = '16:9', // Modern PPT
  ULTRAWIDE = '18:8', // Requested 18:8
  ULTRATALL = '8:18', // Requested 8:18
  CUSTOM = 'custom'   // User defined
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export enum GeneratorType {
  GEMINI = "gemini",
  DALLE = "dalle",
  STABILITY = "stability"
}

export interface GenerationSettings {
  pptStyle: string;         // PPT style description
  colorScheme: string;      // Color palette description
  designRequirements: string; // Detailed design rules
  referenceImage: string | null; // Base64
  model: ModelType;
  aspectRatio: AspectRatio;
  customAspectRatio?: string; // Stores the "W:H" string when AspectRatio.CUSTOM is selected
  imageSize: ImageSize;
  generatorType: GeneratorType; // Image generator API type
}

export interface SlideData {
  id: string;
  contentPrompt: string;
  contentImage: string | null; // Base64 uploaded for this specific slide
  generatedImages: string[]; // Base64 or URLs
  variantCount: 1 | 2; // How many variants to generate for this slide
  status: 'idle' | 'generating' | 'success' | 'error';
  errorMessage?: string;
}
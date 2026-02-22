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
  VOLCENGINE = "volcengine"
}

export enum VolcengineModel {
  SEEDDREAM_4_0 = "seeddream-4.0",
  SEEDDREAM_4_5 = "seeddream-4.5"
}

export enum VolcengineResolution {
  K2 = "2K",
  K4 = "4K"
}

export const VOLCENGINE_ASPECT_RATIOS: { val: AspectRatio; label: string; size: string }[] = [
  { val: AspectRatio.SQUARE, label: "1:1", size: "1024x1024" },
  { val: AspectRatio.LANDSCAPE, label: "4:3", size: "1152x864" },
  { val: AspectRatio.PORTRAIT, label: "3:4", size: "864x1152" },
  { val: AspectRatio.WIDESCREEN, label: "16:9", size: "1280x720" },
  { val: AspectRatio.VERTICAL, label: "9:16", size: "720x1280" },
  { val: AspectRatio.ULTRAWIDE, label: "21:9", size: "1512x648" },
  { val: AspectRatio.ULTRATALL, label: "9:21", size: "648x1512" },
];

export interface ApiKeys {
  geminiApiKey: string;
  volcengineAccessKey: string;
  volcengineSecretKey: string;
  volcengineEndpoint?: string;
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
  volcengineModel: VolcengineModel; // Volcengine specific model
  volcengineResolution: VolcengineResolution; // Volcengine specific resolution
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
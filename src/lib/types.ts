export interface BrandAnalysis {
  url: string;
  brandName: string;
  brandDescription: string;
  tone: string;
  colors: string[];
  products: Product[];
  offers: Offer[];
  targetAudience: string;
  uniqueSellingPoints: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: string;
  features: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType?: string;
  discountValue?: string;
  validUntil?: string;
}

export interface UploadedImage {
  id: string;
  previewUrl: string;
  base64: string;
  mimeType: string;
  name: string;
  productId?: string;
  isAiGenerated: boolean;
  prompt?: string;
}

export type PositionPreset =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface ProductPosition {
  preset: PositionPreset;
  scale: number; // 20-80, % of container width
}

export interface GeneratedAd {
  id: string;
  format: "square" | "story";
  imageBase64: string;          // Background image from Gemini
  mimeType: string;
  headline: string;
  bodyText: string;
  callToAction: string;
  productId?: string;
  offerId?: string;
  conversionAngle?: string;
  timestamp: number;
  // Compositing fields
  productImageBase64?: string;
  productImageMimeType?: string;
  productPosition?: ProductPosition;
}

export interface AdTemplate {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  imageBase64: string;
  mimeType: string;
  previewUrl: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

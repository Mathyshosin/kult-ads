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
  competitorProducts?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: string;
  originalPrice?: string;
  salePrice?: string;
  features: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType?: string;
  discountValue?: string;
  originalPrice?: string;
  salePrice?: string;
  productId?: string;       // linked product id (e.g. "prod-1")
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

export interface GeneratedAd {
  id: string;
  format: "square" | "story";
  imageBase64: string;          // Full scene image from Gemini (product integrated)
  mimeType: string;
  headline: string;
  bodyText: string;
  callToAction: string;
  productId?: string;
  offerId?: string;
  conversionAngle?: string;
  templateId?: string;          // Template used for this ad (library mode)
  timestamp: number;
}

export interface AdTemplate {
  id: string;
  name: string;
  format: "square" | "story";
  category: string;
  imageBase64: string;
  mimeType: string;
  previewUrl: string;
  tags?: {
    industry: string[];
    adType: string[];
    productType: string[];
  };
}

export type WizardStep = 1 | 2 | 3 | 4;

export type GenerationMode = "auto" | "custom" | "reference";

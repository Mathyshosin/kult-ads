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

export interface GeneratedAd {
  id: string;
  format: "square" | "story";
  imageBase64: string;
  mimeType: string;
  headline: string;
  bodyText: string;
  callToAction: string;
  productId?: string;
  offerId?: string;
  timestamp: number;
}

export type WizardStep = 1 | 2 | 3 | 4;

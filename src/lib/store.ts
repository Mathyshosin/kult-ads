"use client";

import { create } from "zustand";
import type {
  BrandAnalysis,
  Product,
  Offer,
  UploadedImage,
  GeneratedAd,
  GenerationMode,
} from "./types";
import {
  saveBrandAnalysis,
  loadLatestBrandAnalysis,
  uploadImage as syncUploadImage,
  uploadBrandLogo as syncUploadBrandLogo,
  deleteImage as syncDeleteImage,
  deleteBrandLogo as syncDeleteBrandLogo,
  loadUploadedImages,
  saveGeneratedAd,
  loadGeneratedAds,
  deleteGeneratedAd as syncDeleteGeneratedAd,
  deleteAllGeneratedAds as syncDeleteAllGeneratedAds,
} from "./supabase/sync";

export interface BrandLogo {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

interface WizardState {
  isAnalyzing: boolean;
  brandAnalysis: BrandAnalysis | null;
  brandAnalysisId: string | null;
  uploadedImages: UploadedImage[];
  generatedAds: GeneratedAd[];
  brandLogo: BrandLogo | null;
  isHydrated: boolean;
  generationMode: GenerationMode;
  selectedFormat: "square" | "story";
  referenceAd: { base64: string; mimeType: string } | null;

  setAnalyzing: (v: boolean) => void;
  setBrandAnalysis: (data: BrandAnalysis) => void;
  updateBrandAnalysis: (partial: Partial<BrandAnalysis>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addProduct: (product: Product) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  removeOffer: (id: string) => void;
  addOffer: (offer: Offer) => void;
  addImage: (image: UploadedImage) => void;
  removeImage: (id: string) => void;
  setBrandLogo: (logo: BrandLogo | null) => void;
  addGeneratedAd: (ad: GeneratedAd) => void;
  updateGeneratedAd: (id: string, updates: Partial<GeneratedAd>) => void;
  removeGeneratedAd: (id: string) => void;
  clearAds: () => void;
  reset: () => void;
  setGenerationMode: (mode: GenerationMode) => void;
  setSelectedFormat: (format: "square" | "story") => void;
  setReferenceAd: (ad: { base64: string; mimeType: string } | null) => void;

  // Generation lifecycle
  startGeneration: (meta: { format: "square" | "story"; productId?: string }) => string;
  completeGeneration: (id: string, data: Omit<GeneratedAd, "id" | "status" | "timestamp">) => void;
  failGeneration: (id: string, error: string) => void;

  // Supabase sync
  syncBrandAnalysis: (userId: string) => Promise<void>;
  syncImage: (userId: string, image: UploadedImage) => Promise<void>;
  syncLogo: (userId: string, logo: BrandLogo) => Promise<void>;
  syncGeneratedAd: (userId: string, ad: GeneratedAd) => Promise<void>;
  syncDeleteImage: (userId: string, imageId: string, imageName?: string) => Promise<void>;
  syncDeleteLogo: (userId: string) => Promise<void>;
  syncDeleteGeneratedAd: (userId: string, adId: string) => Promise<void>;
  syncClearAds: (userId: string) => Promise<void>;
  hydrateFromSupabase: (userId: string) => Promise<void>;
}

// ── Wizard store (Supabase is the source of truth) ──
export const useWizardStore = create<WizardState>()((set, get) => ({
  isAnalyzing: false,
  brandAnalysis: null,
  brandAnalysisId: null,
  uploadedImages: [],
  generatedAds: [],
  brandLogo: null,
  isHydrated: false,
  generationMode: "auto",
  selectedFormat: "square",
  referenceAd: null,

  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setBrandAnalysis: (data) =>
    set({ brandAnalysis: data }),
  updateBrandAnalysis: (partial) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? { ...state.brandAnalysis, ...partial }
        : null,
    })),
  updateProduct: (id, product) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            products: state.brandAnalysis.products.map((p) =>
              p.id === id ? { ...p, ...product } : p
            ),
          }
        : null,
    })),
  removeProduct: (id) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            products: state.brandAnalysis.products.filter((p) => p.id !== id),
          }
        : null,
    })),
  addProduct: (product) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            products: [...state.brandAnalysis.products, product],
          }
        : null,
    })),
  updateOffer: (id, offer) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            offers: state.brandAnalysis.offers.map((o) =>
              o.id === id ? { ...o, ...offer } : o
            ),
          }
        : null,
    })),
  removeOffer: (id) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            offers: state.brandAnalysis.offers.filter((o) => o.id !== id),
          }
        : null,
    })),
  addOffer: (offer) =>
    set((state) => ({
      brandAnalysis: state.brandAnalysis
        ? {
            ...state.brandAnalysis,
            offers: [...state.brandAnalysis.offers, offer],
          }
        : null,
    })),
  addImage: (image) =>
    set((state) => ({
      uploadedImages: [...state.uploadedImages, image],
    })),
  removeImage: (id) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.filter((i) => i.id !== id),
    })),
  setBrandLogo: (logo) => set({ brandLogo: logo }),
  addGeneratedAd: (ad) =>
    set((state) => ({
      generatedAds: [...state.generatedAds, ad],
    })),
  updateGeneratedAd: (id, updates) =>
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) =>
        ad.id === id ? { ...ad, ...updates } : ad
      ),
    })),
  removeGeneratedAd: (id) =>
    set((state) => ({
      generatedAds: state.generatedAds.filter((ad) => ad.id !== id),
    })),
  clearAds: () => set({ generatedAds: [] }),
  reset: () =>
    set({
      isAnalyzing: false,
      brandAnalysis: null,
      brandAnalysisId: null,
      uploadedImages: [],
      generatedAds: [],
      brandLogo: null,
      generationMode: "auto",
      selectedFormat: "square",
      referenceAd: null,
    }),
  setGenerationMode: (mode) => set({ generationMode: mode }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setReferenceAd: (ad) => set({ referenceAd: ad }),

  // ── Generation lifecycle ──

  startGeneration: (meta) => {
    const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const placeholder: GeneratedAd = {
      id,
      format: meta.format,
      imageBase64: "",
      mimeType: "image/png",
      headline: "",
      bodyText: "",
      callToAction: "",
      productId: meta.productId,
      timestamp: Date.now(),
      status: "generating",
    };
    set((state) => ({ generatedAds: [placeholder, ...state.generatedAds] }));
    return id;
  },

  completeGeneration: (id, data) =>
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) =>
        ad.id === id ? { ...ad, ...data, id, status: "completed" as const, timestamp: ad.timestamp } : ad
      ),
    })),

  failGeneration: (id, error) =>
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) =>
        ad.id === id ? { ...ad, status: "failed" as const, error } : ad
      ),
    })),

  // ── Supabase sync methods ──

  syncBrandAnalysis: async (userId) => {
    const { brandAnalysis, brandAnalysisId } = get();
    if (!brandAnalysis) return;
    try {
      const id = await saveBrandAnalysis(userId, brandAnalysis, brandAnalysisId || undefined);
      set({ brandAnalysisId: id });
    } catch (err) {
      console.error("[sync] Error saving brand analysis:", err);
    }
  },

  syncImage: async (userId, image) => {
    const { brandAnalysisId } = get();
    if (!brandAnalysisId) return;
    try {
      await syncUploadImage(userId, brandAnalysisId, image.base64, image.mimeType, image.name, image.productId);
    } catch (err) {
      console.error("[sync] Error uploading image:", err);
    }
  },

  syncLogo: async (userId, logo) => {
    const { brandAnalysisId } = get();
    if (!brandAnalysisId) return;
    try {
      await syncUploadBrandLogo(userId, brandAnalysisId, logo.base64, logo.mimeType);
    } catch (err) {
      console.error("[sync] Error uploading logo:", err);
    }
  },

  syncGeneratedAd: async (userId, ad) => {
    const { brandAnalysisId } = get();
    if (!brandAnalysisId) return;
    try {
      await saveGeneratedAd(userId, brandAnalysisId, ad);
    } catch (err) {
      console.error("[sync] Error saving generated ad:", err);
    }
  },

  syncDeleteImage: async (userId, imageId, imageName?) => {
    try {
      await syncDeleteImage(userId, imageId, imageName);
    } catch (err) {
      console.error("[sync] Error deleting image:", err);
    }
  },

  syncDeleteLogo: async (userId) => {
    const { brandAnalysisId } = get();
    if (!brandAnalysisId) return;
    try {
      await syncDeleteBrandLogo(userId, brandAnalysisId);
    } catch (err) {
      console.error("[sync] Error deleting logo:", err);
    }
  },

  syncDeleteGeneratedAd: async (userId, adId) => {
    try {
      await syncDeleteGeneratedAd(userId, adId);
    } catch (err) {
      console.error("[sync] Error deleting generated ad:", err);
    }
  },

  syncClearAds: async (userId) => {
    const { brandAnalysisId } = get();
    if (!brandAnalysisId) return;
    try {
      await syncDeleteAllGeneratedAds(userId, brandAnalysisId);
    } catch (err) {
      console.error("[sync] Error clearing all ads:", err);
    }
  },

  hydrateFromSupabase: async (userId) => {
    try {
      const result = await loadLatestBrandAnalysis(userId);
      if (result) {
        set({
          brandAnalysis: result.analysis,
          brandAnalysisId: result.id,
        });

        const { images, logo } = await loadUploadedImages(userId, result.id);
        set({ uploadedImages: images, brandLogo: logo });

        const ads = await loadGeneratedAds(userId, result.id);
        if (ads.length > 0) {
          set({ generatedAds: ads });
        }
      }
    } catch (err) {
      console.error("[sync] Error hydrating from Supabase:", err);
    } finally {
      set({ isHydrated: true });
    }
  },
}));

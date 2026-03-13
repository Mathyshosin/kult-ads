"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BrandAnalysis,
  Product,
  Offer,
  UploadedImage,
  GeneratedAd,
  WizardStep,
} from "./types";

interface WizardState {
  currentStep: WizardStep;
  isAnalyzing: boolean;
  brandAnalysis: BrandAnalysis | null;
  uploadedImages: UploadedImage[];
  generatedAds: GeneratedAd[];

  setStep: (step: WizardStep) => void;
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
  addGeneratedAd: (ad: GeneratedAd) => void;
  clearAds: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      isAnalyzing: false,
      brandAnalysis: null,
      uploadedImages: [],
      generatedAds: [],

      setStep: (step) => set({ currentStep: step }),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setBrandAnalysis: (data) =>
        set({ brandAnalysis: data, currentStep: 2 }),
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
                products: state.brandAnalysis.products.filter(
                  (p) => p.id !== id
                ),
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
      addGeneratedAd: (ad) =>
        set((state) => ({
          generatedAds: [...state.generatedAds, ad],
        })),
      clearAds: () => set({ generatedAds: [] }),
      reset: () =>
        set({
          currentStep: 1,
          isAnalyzing: false,
          brandAnalysis: null,
          uploadedImages: [],
          generatedAds: [],
        }),
    }),
    {
      name: "kult-ads-wizard",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        currentStep: state.currentStep,
        brandAnalysis: state.brandAnalysis,
        // Don't persist images/ads - base64 data is too large for sessionStorage
      }),
    }
  )
);

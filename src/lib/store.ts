"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type {
  BrandAnalysis,
  Product,
  Offer,
  UploadedImage,
  GeneratedAd,
  WizardStep,
} from "./types";

interface BrandLogo {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

interface WizardState {
  currentStep: WizardStep;
  isAnalyzing: boolean;
  brandAnalysis: BrandAnalysis | null;
  uploadedImages: UploadedImage[];
  generatedAds: GeneratedAd[];
  brandLogo: BrandLogo | null;
  _hydratedIdb: boolean;

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
  setBrandLogo: (logo: BrandLogo | null) => void;
  addGeneratedAd: (ad: GeneratedAd) => void;
  updateGeneratedAd: (id: string, updates: Partial<GeneratedAd>) => void;
  clearAds: () => void;
  reset: () => void;
}

// ── IndexedDB keys ──
const IDB_IMAGES = "kult-ads-images";
const IDB_LOGO = "kult-ads-logo";

// ── Sync helpers (fire-and-forget, never block UI) ──
function syncImagesToIdb(images: UploadedImage[]) {
  idbSet(IDB_IMAGES, images).catch(() => {});
}
function syncLogoToIdb(logo: BrandLogo | null) {
  if (logo) {
    idbSet(IDB_LOGO, logo).catch(() => {});
  } else {
    idbDel(IDB_LOGO).catch(() => {});
  }
}

// ── Wizard store ──
export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      isAnalyzing: false,
      brandAnalysis: null,
      uploadedImages: [],
      generatedAds: [],
      brandLogo: null,
      _hydratedIdb: false,

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
      addImage: (image) => {
        set((state) => {
          const updated = [...state.uploadedImages, image];
          syncImagesToIdb(updated);
          return { uploadedImages: updated };
        });
      },
      removeImage: (id) => {
        set((state) => {
          const updated = state.uploadedImages.filter((i) => i.id !== id);
          syncImagesToIdb(updated);
          return { uploadedImages: updated };
        });
      },
      setBrandLogo: (logo) => {
        syncLogoToIdb(logo);
        set({ brandLogo: logo });
      },
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
      clearAds: () => set({ generatedAds: [] }),
      reset: () => {
        // Clear IndexedDB too
        idbDel(IDB_IMAGES).catch(() => {});
        idbDel(IDB_LOGO).catch(() => {});
        set({
          currentStep: 1,
          isAnalyzing: false,
          brandAnalysis: null,
          uploadedImages: [],
          generatedAds: [],
          brandLogo: null,
        });
      },
    }),
    {
      name: "kult-ads-wizard",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        currentStep: state.currentStep,
        brandAnalysis: state.brandAnalysis,
        // Images & logo persisted in IndexedDB (no localStorage quota issues)
      }),
      onRehydrateStorage: () => {
        // After localStorage hydration, load images & logo from IndexedDB
        return () => {
          if (typeof window === "undefined") return;
          Promise.all([
            idbGet<UploadedImage[]>(IDB_IMAGES),
            idbGet<BrandLogo>(IDB_LOGO),
          ]).then(([images, logo]) => {
            useWizardStore.setState({
              uploadedImages: images || [],
              brandLogo: logo || null,
              _hydratedIdb: true,
            });
          }).catch(() => {
            useWizardStore.setState({ _hydratedIdb: true });
          });
        };
      },
    }
  )
);

"use client";

import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import EditableCard from "@/components/editable-card";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useEffect } from "react";

export default function ReviewPage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const updateBrandAnalysis = useWizardStore((s) => s.updateBrandAnalysis);
  const updateProduct = useWizardStore((s) => s.updateProduct);
  const removeProduct = useWizardStore((s) => s.removeProduct);
  const addProduct = useWizardStore((s) => s.addProduct);
  const updateOffer = useWizardStore((s) => s.updateOffer);
  const removeOffer = useWizardStore((s) => s.removeOffer);
  const addOffer = useWizardStore((s) => s.addOffer);
  const setStep = useWizardStore((s) => s.setStep);

  useEffect(() => {
    if (!brandAnalysis) {
      router.push("/dashboard/analyze");
    }
  }, [brandAnalysis, router]);

  if (!brandAnalysis) return null;

  function handleContinue() {
    setStep(3);
    router.push("/dashboard/images");
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Vérifiez les informations
        </h1>
        <p className="mt-2 text-muted">
          Modifiez les données si nécessaire avant de continuer.
        </p>
      </div>

      {/* Brand Info */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Informations de marque
        </h2>
        <EditableCard
          title={brandAnalysis.brandName}
          fields={[
            {
              key: "brandName",
              label: "Nom de la marque",
              value: brandAnalysis.brandName,
            },
            {
              key: "brandDescription",
              label: "Description",
              value: brandAnalysis.brandDescription,
              type: "textarea",
            },
            { key: "tone", label: "Ton de communication", value: brandAnalysis.tone },
            {
              key: "targetAudience",
              label: "Audience cible",
              value: brandAnalysis.targetAudience,
            },
            {
              key: "uniqueSellingPoints",
              label: "Arguments de vente (un par ligne)",
              value: brandAnalysis.uniqueSellingPoints.join("\n"),
              type: "list",
            },
          ]}
          onSave={(updated) => updateBrandAnalysis(updated as Partial<typeof brandAnalysis>)}
        />
      </div>

      {/* Colors */}
      {brandAnalysis.colors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Couleurs de la marque
          </h2>
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex flex-wrap gap-3">
              {brandAnalysis.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted font-mono">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Produits ({brandAnalysis.products.length})
          </h2>
          <button
            onClick={() =>
              addProduct({
                id: `prod-${Date.now()}`,
                name: "Nouveau produit",
                description: "",
                price: "",
                features: [],
              })
            }
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brandAnalysis.products.map((product) => (
            <EditableCard
              key={product.id}
              title={product.name}
              fields={[
                { key: "name", label: "Nom", value: product.name },
                {
                  key: "description",
                  label: "Description",
                  value: product.description,
                  type: "textarea",
                },
                { key: "price", label: "Prix", value: product.price || "" },
                { key: "originalPrice", label: "Prix original (barré)", value: product.originalPrice || "" },
                { key: "salePrice", label: "Prix promo", value: product.salePrice || "" },
                {
                  key: "features",
                  label: "Caractéristiques (une par ligne)",
                  value: product.features.join("\n"),
                  type: "list",
                },
              ]}
              onSave={(updated) => updateProduct(product.id, updated as Partial<typeof product>)}
              onDelete={() => removeProduct(product.id)}
            />
          ))}
        </div>
      </div>

      {/* Offers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Offres ({brandAnalysis.offers.length})
          </h2>
          <button
            onClick={() =>
              addOffer({
                id: `offer-${Date.now()}`,
                title: "Nouvelle offre",
                description: "",
                discountType: "percentage",
                discountValue: "",
              })
            }
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
        {brandAnalysis.offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brandAnalysis.offers.map((offer) => (
              <EditableCard
                key={offer.id}
                title={offer.title}
                fields={[
                  { key: "title", label: "Titre", value: offer.title },
                  {
                    key: "description",
                    label: "Description",
                    value: offer.description,
                    type: "textarea",
                  },
                  {
                    key: "discountValue",
                    label: "Valeur de la réduction",
                    value: offer.discountValue || "",
                  },
                  {
                    key: "originalPrice",
                    label: "Prix original (barré)",
                    value: offer.originalPrice || "",
                  },
                  {
                    key: "salePrice",
                    label: "Prix promo de l'offre",
                    value: offer.salePrice || "",
                  },
                ]}
                onSave={(updated) => updateOffer(offer.id, updated as Partial<typeof offer>)}
                onDelete={() => removeOffer(offer.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <p className="text-sm text-muted">
              Aucune offre détectée. Vous pouvez en ajouter manuellement.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => router.push("/dashboard/analyze")}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Continuer vers les images
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

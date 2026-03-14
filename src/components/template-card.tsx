"use client";

import type { AdTemplate } from "@/lib/types";
import { X } from "lucide-react";
import { INDUSTRY_TAGS, AD_TYPE_TAGS, PRODUCT_TYPE_TAGS } from "@/lib/template-tags";

interface TemplateCardProps {
  template: AdTemplate;
  onRemove?: () => void;
  onUpdate?: (partial: Partial<AdTemplate>) => void;
  selected?: boolean;
  onClick?: () => void;
  editable?: boolean;
}

const categories = [
  "promo",
  "lancement",
  "lifestyle",
  "comparatif",
  "témoignage",
  "autre",
];

export default function TemplateCard({
  template,
  onRemove,
  onUpdate,
  selected,
  onClick,
  editable = false,
}: TemplateCardProps) {
  const isStory = template.format === "story";
  const tags = template.tags || { industry: [], adType: [], productType: [] };

  const tagCount = tags.industry.length + tags.adType.length + tags.productType.length;

  function handleTagChange(
    category: "industry" | "adType" | "productType",
    value: string
  ) {
    onUpdate?.({
      tags: { ...tags, [category]: value ? [value] : [] },
    } as Partial<AdTemplate>);
  }

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/40"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Image */}
      <div
        className={`${
          isStory ? "aspect-[9/16]" : "aspect-square"
        } overflow-hidden`}
      >
        <img
          src={template.previewUrl}
          alt={template.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
        <span className="bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {isStory ? "Story" : "Carré"}
        </span>
        <span className="bg-primary/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full capitalize">
          {template.category}
        </span>
        {tagCount > 0 && !editable && (
          <span className="bg-emerald-500/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            {tagCount} tag{tagCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Info footer */}
      <div className="p-3 bg-white">
        {editable ? (
          <div className="space-y-2">
            <input
              type="text"
              value={template.name}
              onChange={(e) => onUpdate?.({ name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Nom du template"
              className="w-full text-xs font-medium text-foreground border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <select
                value={template.format}
                onChange={(e) =>
                  onUpdate?.({ format: e.target.value as "square" | "story" })
                }
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[11px] border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="square">Carré</option>
                <option value="story">Story</option>
              </select>
              <select
                value={template.category}
                onChange={(e) => onUpdate?.({ category: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[11px] border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30 capitalize"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag dropdowns */}
            <div className="space-y-1.5 pt-1 border-t border-border">
              <select
                value={tags.industry[0] || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTagChange("industry", e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[11px] border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">-- Secteur --</option>
                {INDUSTRY_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={tags.adType[0] || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTagChange("adType", e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[11px] border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">-- Type d&apos;ad --</option>
                {AD_TYPE_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={tags.productType[0] || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTagChange("productType", e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[11px] border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">-- Type de produit --</option>
                {PRODUCT_TYPE_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground truncate">
              {template.name}
            </p>
            {onClick && selected && (
              <span className="text-[10px] text-primary font-semibold">
                Sélectionné
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

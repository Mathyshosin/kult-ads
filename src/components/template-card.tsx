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

function TagToggle({
  label,
  value,
  active,
  onToggle,
}: {
  label: string;
  value: string;
  active: boolean;
  onToggle: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(value);
      }}
      className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
        active
          ? "bg-primary/15 border-primary/40 text-primary font-semibold"
          : "bg-gray-50 border-border text-muted hover:border-primary/30"
      }`}
    >
      {label}
    </button>
  );
}

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

  function toggleTag(category: "industry" | "adType" | "productType", value: string) {
    const current = tags[category] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onUpdate?.({
      tags: { ...tags, [category]: updated },
    } as Partial<AdTemplate>);
  }

  // Count total tags for badge
  const tagCount = tags.industry.length + tags.adType.length + tags.productType.length;

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

            {/* Tag editing */}
            <div className="space-y-1.5 pt-1 border-t border-border">
              {/* Secteur */}
              <div>
                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-0.5">Secteur</p>
                <div className="flex flex-wrap gap-0.5">
                  {INDUSTRY_TAGS.map((t) => (
                    <TagToggle
                      key={t.value}
                      label={t.label}
                      value={t.value}
                      active={tags.industry.includes(t.value)}
                      onToggle={(v) => toggleTag("industry", v)}
                    />
                  ))}
                </div>
              </div>
              {/* Type d'ad */}
              <div>
                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-0.5">Type d&apos;ad</p>
                <div className="flex flex-wrap gap-0.5">
                  {AD_TYPE_TAGS.map((t) => (
                    <TagToggle
                      key={t.value}
                      label={t.label}
                      value={t.value}
                      active={tags.adType.includes(t.value)}
                      onToggle={(v) => toggleTag("adType", v)}
                    />
                  ))}
                </div>
              </div>
              {/* Type produit */}
              <div>
                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-0.5">Produit</p>
                <div className="flex flex-wrap gap-0.5">
                  {PRODUCT_TYPE_TAGS.map((t) => (
                    <TagToggle
                      key={t.value}
                      label={t.label}
                      value={t.value}
                      active={tags.productType.includes(t.value)}
                      onToggle={(v) => toggleTag("productType", v)}
                    />
                  ))}
                </div>
              </div>
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

"use client";

import type { AdTemplate } from "@/lib/types";
import { X, Pencil } from "lucide-react";

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

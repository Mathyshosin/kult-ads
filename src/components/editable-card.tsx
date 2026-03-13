"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface Field {
  key: string;
  label: string;
  value: string;
  type?: "text" | "textarea" | "list";
}

interface EditableCardProps {
  title: string;
  fields: Field[];
  onSave: (updated: Record<string, string | string[]>) => void;
  onDelete?: () => void;
}

export default function EditableCard({
  title,
  fields,
  onSave,
  onDelete,
}: EditableCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  function handleSave() {
    const result: Record<string, string | string[]> = {};
    for (const field of fields) {
      if (field.type === "list") {
        result[field.key] = draft[field.key]
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        result[field.key] = draft[field.key];
      }
    }
    onSave(result);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <p className="text-xs text-muted mb-1">{field.label}</p>
            {editing ? (
              field.type === "textarea" || field.type === "list" ? (
                <textarea
                  value={draft[field.key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={draft[field.key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              )
            ) : (
              <p className="text-sm text-foreground whitespace-pre-line">
                {field.value || (
                  <span className="text-muted italic">Non renseigné</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

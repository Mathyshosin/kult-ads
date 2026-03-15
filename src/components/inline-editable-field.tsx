"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil, Check } from "lucide-react";

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  type?: "text" | "textarea" | "list";
  label: string;
  placeholder?: string;
}

export default function InlineEditableField({
  value,
  onSave,
  type = "text",
  label,
  placeholder,
}: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.selectionStart = inputRef.current.value.length;
      }
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (type === "textarea" || type === "list") return; // Allow Enter in textarea/list
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  // Display value for list type: show as comma-separated
  const displayValue =
    type === "list" && value
      ? value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", ")
      : value;

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">
        {label}
      </label>
      {editing ? (
        <div className="flex items-start gap-2">
          {type === "textarea" || type === "list" ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleTextareaKeyDown}
              rows={3}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          )}
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur before click
              handleSave();
            }}
            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="group/field flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 -mx-3 -my-1 hover:bg-surface transition-colors"
        >
          <p className="flex-1 text-sm text-foreground whitespace-pre-line min-h-[1.25rem]">
            {displayValue || (
              <span className="text-muted italic">
                {placeholder || "Non renseigné"}
              </span>
            )}
          </p>
          <Pencil className="w-3.5 h-3.5 text-muted opacity-0 group-hover/field:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
        </div>
      )}
    </div>
  );
}

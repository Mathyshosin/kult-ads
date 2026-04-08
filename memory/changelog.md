# Changelog

## 2026-04-08 — Audit debug : fix timeouts Vercel + compression Gemini
- **Cause racine identifiée** : Vercel Hobby = 60s max, mais `maxDuration = 120` → Vercel tue la fonction à 60s pendant que Gemini tourne → 504 systématique
- **`sharp` installé** : compression serveur des images avant envoi à Gemini (768px max, JPEG 80%) → images passent de 2-4MB à ~80KB → Gemini répond en 15-20s au lieu de 50-60s
- **`next.config.ts`** : ajout `serverExternalPackages: ['sharp']` pour bundling correct sur Vercel
- **`src/lib/gemini.ts`** : timeout 120s → 50s + compression automatique de toutes les images de référence via sharp avant envoi
- **`src/app/api/generate-ad/route.ts`** : `maxDuration` 120 → 60
- **`src/app/api/generate-image/route.ts`** : `maxDuration` 120 → 60
- **`src/app/api/templates/analyze/route.ts`** : `maxDuration` 120 → 60 + parallélisation des analyses Claude (3 templates concurrent au lieu de séquentiel)
- **`src/lib/template-store.ts`** : HTTP fallback timeout 10s → 4s (économie de temps avant l'appel Gemini)

## 2026-03-21
- **Landing page v3** : Réécriture complète de `src/app/page.tsx`
  - Palette chaude : deep blue (#1a1a2e) + peach/salmon (#f97316) + off-white (#faf8f5)
  - Hero centré avec before/after qui se chevauchent (rotation, ombres, flèche centrale)
  - Marquee CSS "CRÉEZ • PUBLIEZ • CONVERTISSEZ •" (animation pure CSS dans globals.css)
  - Steps "Comment ça marche" en staircase staggeré (cards décalées verticalement)
  - Features en layout asymétrique 3/2 + 2/3 (pas de grille standard)
  - Before/after animé avec coins arrondis
  - Section Daily Gift + Stat en 2 colonnes (card dark + card stat)
  - Témoignage unique en citation géante centrée
  - Pricing horizontal en rows avec rounded cards
  - FAQ en details/summary avec chevron animé
  - CTA final centré avec glow ambiant
  - Boutons rounded-full, hover effects premium

# Plan : Optimiser la génération d'ads (template copying fiable)

## Problèmes identifiés
1. **Randomisation cassée** — Map en mémoire = reset à chaque invocation serverless Vercel
2. **Éléments décoratifs parasites** — Gemini copie coton, fleurs, etc. du template alors qu'ils n'ont rien à voir avec la marque
3. **Rendu pas assez moderne** — Le prompt ne pousse pas assez vers un style premium/minimalist

## Approche : Décision intelligente par Haiku + instructions explicites à Gemini

### Étape 1 : Fixer la randomisation des templates
**Fichier** : `src/lib/template-store.ts`

Au lieu d'une Map en mémoire (perdue entre invocations serverless) :
- Query les 5 dernières ads générées par l'utilisateur depuis Supabase (`generated_ads` table)
- Récupérer les `templateId` de ces ads
- Les exclure du pool de templates disponibles

### Étape 2 : Haiku décide du sort des éléments décoratifs
**Fichier** : `src/lib/claude.ts` → `describeTemplateSceneWithMetadata()`

Ajouter au prompt Haiku :
- Recevoir `decorativeElements` du metadata (ex: "cotton flowers, green leaves")
- Décider : ces éléments sont-ils pertinents pour la marque ?
  - OUI (coton + marque coton bio) → "KEEP cotton flowers"
  - NON (flacons parfum + marque sous-vêtements) → "REMOVE, use clean background" ou "REPLACE with [élément pertinent]"
- Output un champ `decorativeAction`: string avec l'instruction exacte pour Gemini

### Étape 3 : Prompt Gemini optimisé
**Fichier** : `src/app/api/generate-ad/route.ts`

Modifier le label "LAYOUT REFERENCE" et le `visualPrompt` :
1. Utiliser l'instruction de Haiku pour les décos (verbatim, pas de décision laissée à Gemini)
2. Renforcer le style "modern, minimalist, premium, clean"
3. Insister plus fort sur "ZERO TEXT" (répéter 3x dans le prompt, Gemini a besoin de ça)
4. Ajouter "Instagram-worthy, high-end aesthetic" au prompt

### Étape 4 : Build + test
- `npx next build` pour vérifier
- Commit + push
- L'utilisateur teste sur Vercel

## Fichiers modifiés
1. `src/lib/template-store.ts` — randomisation via Supabase
2. `src/lib/claude.ts` — Haiku décide des éléments décoratifs
3. `src/app/api/generate-ad/route.ts` — prompt Gemini optimisé

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithClaude(scrapedData: unknown): Promise<string> {
  const systemPrompt = `Tu es un expert en marketing digital et analyse de marque.
Analyse les données suivantes extraites d'un site web et retourne un JSON structuré.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks, sans explication.

Le JSON doit suivre exactement cette structure:
{
  "brandName": "string",
  "brandDescription": "string (2-3 phrases décrivant la marque)",
  "tone": "string (un parmi: professionnel, fun, luxe, minimaliste, audacieux, chaleureux)",
  "colors": ["#hex1", "#hex2"],
  "products": [{"id":"prod-1","name":"...","description":"...","price":"...","features":["..."]}],
  "offers": [{"id":"offer-1","title":"...","description":"...","discountType":"percentage|fixed|freeShipping|other","discountValue":"..."}],
  "targetAudience": "string",
  "uniqueSellingPoints": ["string", "string"]
}

Règles:
- Identifie TOUS les produits visibles sur le site
- Identifie TOUTES les offres/promotions en cours
- Si aucune offre n'est trouvée, retourne un tableau vide pour offers
- Les IDs doivent être "prod-1", "prod-2", etc. et "offer-1", "offer-2", etc.
- Les couleurs doivent être en format hex
- Sois précis et fidèle aux informations du site`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Données du site web à analyser:\n\n${JSON.stringify(scrapedData, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

// ── Generate smart, product-specific ad concepts ──
export async function generateAdConcepts(
  brandName: string,
  brandDescription: string,
  tone: string,
  productName: string,
  productDescription: string,
  targetAudience: string,
  colors: string[],
  uniqueSellingPoints: string[],
  offerTitle?: string,
  offerDescription?: string,
  count: number = 4,
  customDirection?: string
): Promise<string> {
  const systemPrompt = `Tu es un directeur artistique expert en publicités statiques pour Instagram/Facebook/TikTok.

CONTEXTE : L'IA d'image (Gemini) va recevoir la photo du produit en référence + un template de style. Elle doit créer une image publicitaire COMPLÈTE avec le produit intégré naturellement dans la scène. Le texte sera ajouté par-dessus en CSS.

Tu dois créer des concepts d'ads avec un prompt de SCÈNE COMPLÈTE pour chaque ad.

RÈGLES :
1. scenePrompt en ANGLAIS, COURT (2-3 phrases MAX — les prompts longs causent des erreurs)
2. scenePrompt décrit la SCÈNE ENTIÈRE : comment le produit est présenté, le décor, l'ambiance
3. Le produit est fourni en photo — Gemini doit l'intégrer TEL QUEL sans le modifier
4. Chaque concept = un adType DIFFÉRENT et une scène DIFFÉRENTE
5. Pense comme un media buyer expert : quels visuels CONVERTISSENT pour ce type de produit ?

EXEMPLES DE SCÈNES PAR CATÉGORIE :
- Culottes/lingerie → produit posé à plat sur du marbre blanc, ou tenu en main devant un miroir, ou plié dans un tiroir de lingerie, ou porté par une femme confiante
- Cosmétiques → produit sur vanity table en marbre, ou tenu en main avec un beau teint, ou posé avec des fleurs et textures
- Tech → produit sur bureau minimaliste, ou tenu en main dans un café, ou à côté d'un laptop
- Alimentaire → produit sur table en bois avec ingrédients frais, ou dans une cuisine lumineuse

TYPES D'ADS :
- "offre" : promo, réduction (scène punchy et attirante)
- "bénéfice" : avantage clé (scène clean et produit en héro)
- "comparaison" : VS alternative (scène split/contrastée)
- "témoignage" : preuve sociale (scène chaleureuse, authentique)
- "lifestyle" : produit dans la vraie vie (scène naturelle)
- "premium" : luxe, haut de gamme (scène élégante)
- "urgence" : stock limité (scène dramatique)

JSON UNIQUEMENT :
{
  "concepts": [
    {
      "id": "concept-1",
      "adType": "string",
      "scenePrompt": "string (ANGLAIS, 2-3 phrases, scène complète avec produit)",
      "copyAngle": "string (direction copywriting, FRANÇAIS)"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Marque : ${brandName}
Description : ${brandDescription}
Ton : ${tone}
Couleurs : ${colors.join(", ")}
Produit : ${productName} — ${productDescription}
Audience : ${targetAudience}
Points forts : ${uniqueSellingPoints.join(", ")}
${offerTitle ? `Offre en cours : ${offerTitle} — ${offerDescription}` : "Pas d'offre spéciale."}
${customDirection ? `\nDIRECTION CRÉATIVE DU CLIENT (PRIORITAIRE) :\n${customDirection}\nInspire-toi de ces demandes pour créer les concepts. C'est la priorité.` : ""}

Génère ${count} concepts d'ads variés et adaptés à CE produit. Chaque concept doit être radicalement différent.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function generateAdCopy(
  brandName: string,
  tone: string,
  productName: string,
  productDescription: string,
  offerTitle?: string,
  offerDescription?: string,
  format?: string,
  conversionAngle?: string
): Promise<string> {
  const systemPrompt = `Tu es un copywriter expert en publicité digitale française, spécialisé dans les ads à haute conversion.
Génère du texte publicitaire percutant et optimisé pour la conversion.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks.

Le JSON doit suivre cette structure:
{
  "headline": "string (max 8 mots, percutant, accrocheur, qui stoppe le scroll)",
  "bodyText": "string (max 25 mots, persuasif, qui donne envie d'acheter)",
  "callToAction": "string (max 4 mots, action claire et urgente)"
}

Règles de copywriting:
- Le headline doit créer une émotion immédiate (curiosité, désir, urgence)
- Le bodyText doit donner UNE raison concrète d'acheter MAINTENANT
- Le CTA doit pousser à l'action immédiate
- Utilise des mots puissants : exclusif, gratuit, immédiat, limité, secret, nouveau
- Adapte le ton à la marque mais garde toujours l'intention de conversion`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Marque: ${brandName}
Ton: ${tone}
Produit: ${productName} - ${productDescription}
${offerTitle ? `Offre en cours: ${offerTitle} - ${offerDescription}` : "Pas d'offre spéciale"}
Format: ${format === "story" ? "Story Instagram/TikTok (vertical)" : "Post carré Instagram/Facebook"}

ANGLE DE CONVERSION À UTILISER:
${conversionAngle || "Choisis l'angle le plus percutant pour ce produit"}

IMPORTANT: Le texte doit être DIFFÉRENT et UNIQUE. Pas de formules génériques. Adapte-toi spécifiquement à ce produit et cet angle.

Génère le texte publicitaire en français.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

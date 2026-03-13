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
  count: number = 4
): Promise<string> {
  const systemPrompt = `Tu es un directeur artistique et media buyer expert en publicités statiques pour les réseaux sociaux (Instagram, Facebook, TikTok).

Tu dois créer des CONCEPTS PUBLICITAIRES stratégiques et variés, adaptés spécifiquement au produit.

CONTEXTE TECHNIQUE :
- Le produit sera composité en PNG transparent par-dessus le fond (3 couches : fond + produit + texte CSS)
- Tu dois décrire le FOND uniquement (le produit est ajouté séparément par-dessus)
- Le fond doit être RÉALISTE, professionnel et COHÉRENT avec le type de produit

RÈGLES CRITIQUES :
1. backgroundPrompt DOIT être en ANGLAIS, COURT (2-3 phrases max)
2. backgroundPrompt ne doit JAMAIS mentionner le produit lui-même
3. backgroundPrompt doit décrire un fond RÉALISTE adapté au produit
4. Chaque concept doit avoir un adType DIFFÉRENT
5. Pense comme un expert media buyer : quels angles CONVERTISSENT le mieux pour CE produit ?

EXEMPLES DE FONDS ADAPTÉS PAR CATÉGORIE :
- Lingerie/sous-vêtements → fond uni pastel doux, surface en marbre blanc, tissu satin plié, tiroir ouvert avec lingerie, salle de bain lumineuse épurée
- Cosmétiques/soins → vanity table en marbre, étagère de salle de bain, fond rose/doré, comptoir avec plantes, gouttelettes d'eau sur surface
- Tech/gadgets → bureau minimaliste sombre, fond néon subtil, surface en bois avec éclairage directionnel, setup desk épuré
- Alimentaire → table en bois rustique, cuisine lumineuse, nappe en lin, planche à découper, fond texturé naturel
- Mode/vêtements → mur en béton texturé, fond studio uni, rue urbaine floutée, portant avec cintres
- Sport/fitness → salle de sport floutée, tapis de yoga, surface en béton, vestiaire épuré
- Maison/déco → intérieur scandinave, étagère en bois, fond texturé mur, salon lumineux flouté

TYPES D'ADS STRATÉGIQUES (choisis les plus pertinents pour ce produit) :
- "offre" : mise en avant promo/réduction (fond festif, confettis, couleurs vives)
- "bénéfice" : focus sur un avantage clé du produit (fond épuré, minimaliste)
- "comparaison" : produit VS alternative (fond divisé en 2 tons, contraste visuel)
- "témoignage" : preuve sociale, avis client (fond chaleureux, confiance)
- "avant-après" : transformation visible (fond split, contraste)
- "lifestyle" : le produit dans la vie quotidienne (fond naturel, contextualisé)
- "premium" : positionnement haut de gamme (fond luxe, textures nobles)
- "urgence" : offre limitée, stock réduit (fond dramatique, contrasté)
- "nouveauté" : lancement, découverte (fond frais, moderne, dynamique)
- "éducatif" : pourquoi ce produit est différent (fond clean, instructif)

Retourne UNIQUEMENT un JSON valide :
{
  "concepts": [
    {
      "id": "concept-1",
      "adType": "string",
      "backgroundPrompt": "string (EN ANGLAIS, 2-3 phrases, fond uniquement)",
      "copyAngle": "string (direction pour le copywriting, EN FRANÇAIS)",
      "layoutHint": "product-center" | "product-left" | "product-right" | "product-small-bottom"
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
${offerTitle ? `Offre en cours : ${offerTitle} — ${offerDescription}` : "Pas d'offre spéciale en cours."}

Génère exactement ${count} concepts publicitaires variés, stratégiques et ADAPTÉS à ce produit spécifique.
Chaque concept doit être radicalement différent. Pense comme un media buyer qui veut tester différents angles.`,
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

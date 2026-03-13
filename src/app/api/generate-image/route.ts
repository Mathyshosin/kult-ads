import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { prompt, referenceImageBase64, referenceImageMimeType, aspectRatio } =
      await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt requis" },
        { status: 400 }
      );
    }

    const result = await generateImage(
      prompt,
      aspectRatio || "1:1",
      referenceImageBase64,
      referenceImageMimeType
    );

    if (!result) {
      return NextResponse.json(
        { error: "Aucune image générée. Essayez un autre prompt." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

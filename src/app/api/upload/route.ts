import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error(`Type de fichier invalide: ${file.type}`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Fichier trop lourd: ${file.name} (max 10MB)`);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");

        return {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type,
          base64,
          dataUrl: `data:${file.type};base64,${base64}`,
        };
      })
    );

    return NextResponse.json({ images: results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

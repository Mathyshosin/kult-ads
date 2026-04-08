import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

// GET — public, fetch all changelog entries
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ entries: data || [] });
  } catch (err) {
    console.error("[changelog] GET error:", err);
    return NextResponse.json({ entries: [] });
  }
}

// POST — admin only, add a new entry
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { title, version, description, items, icon, color } = body;

    if (!title || !version) {
      return NextResponse.json({ error: "Titre et version requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("changelog")
      .insert({
        title,
        version,
        description: description || "",
        items: items || [],
        icon: icon || "Sparkles",
        color: color || "from-violet-500 to-purple-500",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error("[changelog] POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — admin only
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { error } = await supabase.from("changelog").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[changelog] DELETE error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

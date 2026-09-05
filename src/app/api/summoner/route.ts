// src/app/api/summoner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSummonerNameByPuuid } from "@/app/actions/summoner";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Batch puuid lookup — usado pela página de rankings
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawPuuids = searchParams.get("puuids");
  const region = searchParams.get("region") || "br1";

  if (!rawPuuids) {
    return NextResponse.json(
      { error: "Missing puuids parameter" },
      { status: 400 }
    );
  }

  const puuids = rawPuuids
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 50); // limite de segurança

  if (puuids.length === 0) {
    return NextResponse.json({});
  }

  try {
    // 1. Busca os nomes no cache (tabela summoner_names_cache)
    const { data, error } = await supabaseAdmin
      .from("summoner_names_cache")
      .select("puuid, game_name, tag_line, profile_icon_id, updated_at")
      .in("puuid", puuids);

    if (error) {
      console.error("[summoner API] Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 2. Monta o resultado tipado corretamente
    const result: Record<string, { gameName: string; tagLine: string; profileIconId: number | null }> = {};

    const stalePuuids: string[] = [];
    const now = Date.now();
    const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 dia

    for (const row of data || []) {
      result[row.puuid] = {
        gameName: row.game_name,
        tagLine: row.tag_line,
        profileIconId: row.profile_icon_id,
      };
      // Verifica se o registro está desatualizado
      if (row.updated_at) {
        const age = now - new Date(row.updated_at).getTime();
        if (age > STALE_THRESHOLD_MS) {
          stalePuuids.push(row.puuid);
        }
      }
    }

    // 3. Identifica os que faltam no cache
    const missing = puuids.filter((p) => !result[p]);

    // 4. Dispara atualização em background para os que faltam ou estão desatualizados
    const toUpdate = [...missing, ...stalePuuids];
    if (toUpdate.length > 0) {
      // Atualiza em background (fire-and-forget) usando a função existente getSummonerNameByPuuid
      (async () => {
        for (const puuid of toUpdate) {
          try {
            const summonerData = await getSummonerNameByPuuid(region, puuid);
            if (summonerData) {
              // Salva no cache
              await supabaseAdmin.from("summoner_names_cache").upsert({
                puuid: summonerData.puuid,
                region,
                game_name: summonerData.name,
                tag_line: summonerData.tagLine,
                profile_icon_id: summonerData.profileIconId,
                updated_at: new Date().toISOString(),
              }, { onConflict: "puuid" });
            }
          } catch (e) {
            console.error(`[summoner API] Failed to update ${puuid}:`, e);
          }
        }
      })().catch(err => console.error("[summoner API] background update error:", err));
    }

    // 5. Preenche placeholders para os que ainda não estão no cache (para não mostrar "Loading…" indefinidamente)
    for (const puuid of puuids) {
      if (!result[puuid]) {
        result[puuid] = {
          gameName: "Loading…",
          tagLine: "???",
          profileIconId: null,
        };
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[summoner API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

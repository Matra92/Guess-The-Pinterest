import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: lobby, error: lobbyErr } = await supabase
    .from('lobbies')
    .select('id, code, host_player_id, status')
    .eq('code', code)
    .single();

  if (lobbyErr || !lobby) {
    return NextResponse.json({ error: 'Lobby no encontrado' }, { status: 404 });
  }

  const { data: lobbyPlayers, error: playersErr } = await supabase
    .from('lobby_players')
    .select('player_id, is_ready, players(display_name)')
    .eq('lobby_id', lobby.id);

  if (playersErr) {
    return NextResponse.json({ error: playersErr.message }, { status: 500 });
  }

  const players = lobbyPlayers?.map((lp: any) => {
    const player = Array.isArray(lp.players) ? lp.players[0] : lp.players;
    return {
      id: lp.player_id,
      display_name: player?.display_name ?? '',
      is_ready: lp.is_ready,
    };
  }) ?? [];

  return NextResponse.json({
    lobby: {
      id: lobby.id,
      code: lobby.code,
      host_player_id: lobby.host_player_id,
      status: lobby.status,
    },
    players,
  });
}

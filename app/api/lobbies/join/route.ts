import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname, code } = body;
  if (!nickname || !code) {
    return NextResponse.json({ error: 'nick/code missing' }, { status: 400 });
  }
  // Find lobby by code
  const { data: lobby, error: lobbyErr } = await supabase
    .from('lobbies')
    .select('id, status')
    .eq('code', code)
    .single();
  if (lobbyErr || !lobby) {
    return NextResponse.json({ error: 'Lobby no encontrado' }, { status: 404 });
  }
  if (lobby.status !== 'waiting') {
    return NextResponse.json({ error: 'Lobby no disponible' }, { status: 400 });
  }
  // Create player
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({ display_name: nickname })
    .select()
    .single();
  if (playerErr || !player) {
    return NextResponse.json({ error: playerErr?.message || 'player error' }, { status: 500 });
  }
  // Insert into lobby_players
  await supabase.from('lobby_players').insert({ lobby_id: lobby.id, player_id: player.id, is_ready: false });
  // Return lobby code and the new player's id so the client can persist it locally.  
  return NextResponse.json({ code, playerId: player.id });
}
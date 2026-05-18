import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname } = body;
  if (!nickname) {
    return NextResponse.json({ error: 'nick missing' }, { status: 400 });
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
  // Create lobby with unique code
  let code: string;
  let existing;
  do {
    code = generateCode();
    const { data } = await supabase.from('lobbies').select('id').eq('code', code);
    existing = data?.length ? data[0] : null;
  } while (existing);
  const { data: lobby, error: lobbyErr } = await supabase
    .from('lobbies')
    .insert({ code, host_player_id: player.id, status: 'waiting' })
    .select()
    .single();
  if (lobbyErr || !lobby) {
    return NextResponse.json({ error: lobbyErr?.message || 'lobby error' }, { status: 500 });
  }
  // Add player to lobby
  await supabase.from('lobby_players').insert({ lobby_id: lobby.id, player_id: player.id, is_ready: false });
  // Return lobby code and the new player's id so the client can persist it locally.  
  return NextResponse.json({ code, playerId: player.id });
}
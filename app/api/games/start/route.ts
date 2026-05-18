import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Start a new game for a given lobby code. Creates a game record and first round.
export async function POST(request: Request) {
  const body = await request.json();
  const { code } = body;
  if (!code) return NextResponse.json({ error: 'code missing' }, { status: 400 });
  const { data: lobby, error: lobbyErr } = await supabase.from('lobbies').select('id, status').eq('code', code).single();
  if (lobbyErr || !lobby) {
    return NextResponse.json({ error: 'Lobby no encontrado' }, { status: 404 });
  }

  if (lobby.status === 'in_game') {
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('lobby_id', lobby.id)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (existingGame) {
      return NextResponse.json({ gameId: existingGame.id });
    }
  }

  const { data: images } = await supabase
    .from('images')
    .select('id')
    .eq('approved', true);

  if (!images?.length) {
    return NextResponse.json({ error: 'No hay imagenes aprobadas para jugar' }, { status: 400 });
  }

  const { data: game, error: gameErr } = await supabase
    .from('games')
    .insert({ lobby_id: lobby.id, status: 'in_game', current_round_number: 1 })
    .select()
    .single();
  if (gameErr || !game) {
    return NextResponse.json({ error: gameErr?.message || 'game error' }, { status: 500 });
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  const { error: roundErr } = await supabase
    .from('rounds')
    .insert({ game_id: game.id, round_number: 1, image_id: randomImage.id });

  if (roundErr) {
    return NextResponse.json({ error: roundErr.message }, { status: 500 });
  }

  const { data: lobbyPlayers } = await supabase
    .from('lobby_players')
    .select('player_id')
    .eq('lobby_id', lobby.id);
  if (lobbyPlayers?.length) {
    await supabase.from('scores').upsert(
      lobbyPlayers.map((player) => ({ game_id: game.id, player_id: player.player_id, points: 0 })),
      { onConflict: 'game_id,player_id' }
    );
  }

  const { error: lobbyUpdateErr } = await supabase
    .from('lobbies')
    .update({ status: 'in_game' })
    .eq('id', lobby.id);

  if (lobbyUpdateErr) {
    return NextResponse.json({ error: lobbyUpdateErr.message }, { status: 500 });
  }

  return NextResponse.json({ gameId: game.id });
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Submit a player's guess for a round
export async function POST(request: Request) {
  const body = await request.json();
  const { roundId, playerId, guessedOwnerId } = body;
  if (!roundId || !playerId || !guessedOwnerId) {
    return NextResponse.json({ error: 'invalid parameters' }, { status: 400 });
  }
  // Determine correct owner
  const { data: round } = await supabase
    .from('rounds')
    .select('image_id')
    .eq('id', roundId)
    .single();
  if (!round) return NextResponse.json({ error: 'round not found' }, { status: 404 });
  const { data: image } = await supabase.from('images').select('owner_id').eq('id', round.image_id).single();
  const isCorrect = image?.owner_id === guessedOwnerId;
  // Insert guess
  await supabase.from('guesses').insert({ round_id: roundId, player_id: playerId, guessed_owner_id: guessedOwnerId, is_correct: isCorrect });
  // Update score
  if (isCorrect) {
    const { data: existingScore } = await supabase
      .from('scores')
      .select('points')
      .eq('game_id', body.gameId)
      .eq('player_id', playerId)
      .maybeSingle();

    await supabase
      .from('scores')
      .upsert(
        { game_id: body.gameId, player_id: playerId, points: (existingScore?.points ?? 0) + 1 },
        { onConflict: 'game_id,player_id' }
      );
  }
  return NextResponse.json({ correct: isCorrect });
}

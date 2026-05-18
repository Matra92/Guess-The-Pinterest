import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Advance to the next round for a game
export async function POST(request: Request) {
  const body = await request.json();
  const { gameId } = body;
  if (!gameId) return NextResponse.json({ error: 'gameId missing' }, { status: 400 });
  // Get game
  const { data: game, error } = await supabase.from('games').select('current_round_number, lobby_id').eq('id', gameId).single();
  if (error || !game) return NextResponse.json({ error: 'game not found' }, { status: 404 });
  const nextRoundNumber = (game.current_round_number || 0) + 1;
  // Choose a random approved image for the next round.  
  const { data: images } = await supabase
    .from('images')
    .select('id')
    .eq('approved', true);
  if (images && images.length > 0) {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    await supabase.from('rounds').insert({ game_id: gameId, round_number: nextRoundNumber, image_id: randomImage.id });
  }
  await supabase.from('games').update({ current_round_number: nextRoundNumber }).eq('id', gameId);
  return NextResponse.json({ roundNumber: nextRoundNumber });
}
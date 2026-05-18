"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Scoreboard from '@/components/Scoreboard';

interface Score {
  playerId: number;
  name: string;
  points: number;
}

export default function ResultsPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      const { data: lobby } = await supabase.from('lobbies').select('id').eq('code', code).single();
      if (!lobby) return;
      const { data: game } = await supabase.from('games').select('id').eq('lobby_id', lobby.id).order('ended_at', { ascending: false }).limit(1).single();
      if (!game) return;
      const { data: scoreRows } = await supabase.from('scores').select('player_id, points').eq('game_id', game.id);
      const { data: players } = await supabase.from('players').select('id, display_name').in('id', scoreRows?.map((s) => s.player_id) || []);
      const scoreboard: Score[] = (scoreRows ?? []).map((row) => {
        const p = players?.find((pl) => pl.id === row.player_id);
        return { playerId: row.player_id, name: p?.display_name || '', points: row.points };
      });
      const sorted = [...scoreboard].sort((a, b) => b.points - a.points);
      setScores(sorted);
      setWinner(sorted[0]?.name ?? null);
      setLoading(false);
    }
    fetchResults();
  }, [code]);

  if (loading) {
    return (
      <main className="party-shell grid place-items-center">
        <div className="party-panel rounded-[32px] p-8 text-center animate-pop">
          <span className="sticker mx-auto">Final</span>
          <p className="mt-5 text-3xl font-black text-candy-ink">Contando puntos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="party-shell">
      <div className="party-wrap grid min-h-[calc(100vh-3rem)] place-items-center py-8">
        <section className="w-full max-w-3xl space-y-6">
          <div className="party-panel rounded-[36px] bg-white p-6 text-center animate-pop sm:p-8">
            <span className="sticker mx-auto">Resultados</span>
            <h1 className="mt-5 text-5xl font-black leading-none text-candy-ink drop-shadow-[4px_4px_0_#ff6b87] sm:text-6xl">
              Podio final
            </h1>
            {winner && (
              <p className="mt-5 rounded-[28px] border-2 border-candy-ink bg-primary p-5 text-3xl font-black text-candy-paper shadow-[0_12px_26px_rgba(7,8,18,0.28)]">
                Gano {winner}
              </p>
            )}
          </div>

          <Scoreboard scores={scores} />

          <button
            onClick={() => {
              window.location.href = `/lobby/${code}`;
            }}
            className="party-button red-button w-full"
          >
            Revancha
          </button>
        </section>
      </div>
    </main>
  );
}

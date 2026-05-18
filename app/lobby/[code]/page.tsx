"use client";
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Player {
  id: number;
  display_name: string;
  is_ready?: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roundTime, setRoundTime] = useState(10);
  const [numRounds, setNumRounds] = useState(10);
  const [targetScore, setTargetScore] = useState(10);

  const fetchLobby = useCallback(async () => {
    const { data: lobby } = await supabase
      .from('lobbies')
      .select('id, host_player_id, status')
      .eq('code', code)
      .single();
    if (!lobby) return;

    if (lobby.status === 'in_game') {
      router.push(`/game/${code}`);
      return;
    }

    let storedId: number | null = null;
    try {
      const stored = localStorage.getItem('playerId');
      storedId = stored ? parseInt(stored, 10) : null;
    } catch (err) {
      console.warn('Unable to read playerId from localStorage', err);
    }

    setIsHost(storedId !== null && storedId === lobby.host_player_id);

    const { data: lobbyPlayers } = await supabase
      .from('lobby_players')
      .select('player_id, is_ready, players(display_name)')
      .eq('lobby_id', lobby.id);

    const mapped = lobbyPlayers?.map((lp) => {
      const player = Array.isArray(lp.players) ? lp.players[0] : lp.players;
      return {
        id: lp.player_id,
        display_name: player?.display_name ?? '',
        is_ready: lp.is_ready,
      };
    }) ?? [];
    setPlayers(mapped);
  }, [code, router]);

  useEffect(() => {
    fetchLobby();
  }, [fetchLobby]);

  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies' }, fetchLobby)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_players' }, fetchLobby)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, fetchLobby]);

  async function startGame() {
    setLoading(true);
    try {
      await fetch('/api/games/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      router.push(`/game/${code}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="party-shell">
      <div className="party-wrap py-6">
        <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="sticker">Sala abierta</span>
            <h1 className="mt-4 text-5xl font-black leading-none text-candy-paper drop-shadow-[0_8px_18px_rgba(7,8,18,0.75)] sm:text-6xl">
              Lobby <span className="text-primary">{code}</span>
            </h1>
            <p className="mt-3 max-w-2xl rounded-[24px] border-2 border-candy-ink bg-candy-paper/90 p-4 text-lg font-extrabold text-candy-ink shadow-[0_12px_26px_rgba(7,8,18,0.28)]">
              Pasales este codigo y esperen a que todos entren antes de arrancar.
            </p>
          </div>
          <div className="party-panel red-panel rounded-[24px] px-5 py-4 text-center">
            <p className="text-xs font-black uppercase">Codigo</p>
            <p className="text-4xl font-black tracking-widest">{code}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="party-panel rounded-[32px] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black uppercase text-candy-ink">Jugadores</h2>
              <span className="sticker">{players.length} online</span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {players.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-3xl border-2 border-candy-ink bg-white p-4 shadow-[0_8px_18px_rgba(7,8,18,0.18)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-candy-ink bg-primary font-black text-candy-paper">
                      {idx + 1}
                    </span>
                    <span className="truncate font-black">{p.display_name || 'Jugador'}</span>
                  </span>
                  <span className={p.is_ready ? 'sticker' : 'sticker is-light bg-white'}>
                    {p.is_ready ? 'Listo' : 'Wait'}
                  </span>
                </li>
              ))}
              {players.length === 0 && (
                <li className="rounded-3xl border-2 border-dashed border-candy-ink bg-white p-6 text-center font-black">
                  Esperando jugadores...
                </li>
              )}
            </ul>
          </section>

          <aside className="space-y-6">
            {isHost && (
              <section className="party-panel rounded-[32px] p-5 sm:p-6">
                <h2 className="mb-4 text-2xl font-black uppercase text-candy-ink">Reglas</h2>
                {[
                  ['Rondas', numRounds, 5, 20, 1, setNumRounds],
                  ['Tiempo', roundTime, 5, 30, 1, setRoundTime],
                  ['Puntos', targetScore, 5, 100, 5, setTargetScore],
                ].map(([label, value, min, max, step, setter]) => (
                  <label key={label as string} className="mb-5 block">
                    <div className="mb-2 flex justify-between text-sm font-black uppercase">
                      <span>{label as string}</span>
                      <span>{value as number}{label === 'Tiempo' ? 's' : ''}</span>
                    </div>
                    <input
                      type="range"
                      min={min as number}
                      max={max as number}
                      step={step as number}
                      value={value as number}
                      onChange={(e) => (setter as (value: number) => void)(parseInt(e.target.value, 10))}
                      className="w-full accent-primary"
                    />
                  </label>
                ))}
              </section>
            )}

            {isHost && (
              <section className="party-panel rounded-[32px] bg-white p-5 sm:p-6">
                <div className="grid gap-3">
                  <button
                    onClick={startGame}
                    className="party-button red-button w-full"
                    disabled={loading}
                  >
                    {loading ? 'Arrancando...' : 'Iniciar partida'}
                  </button>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

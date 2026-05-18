"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TimerBar from '@/components/TimerBar';
import Scoreboard from '@/components/Scoreboard';
import GuessOptions from '@/components/GuessOptions';

interface Player {
  id: number;
  display_name: string;
}

interface Owner {
  id: number;
  name: string;
}

interface Score {
  playerId: number;
  name: string;
  points: number;
}

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [gameId, setGameId] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [guessed, setGuessed] = useState(false);
  const [revealOwner, setRevealOwner] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [roundTime, setRoundTime] = useState(10);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [selectedGuessId, setSelectedGuessId] = useState<number | null>(null);
  const revealOwnerRef = useRef<string | null>(null);
  const gameChannelRef = useRef<any>(null);

  useEffect(() => {
    revealOwnerRef.current = revealOwner;
  }, [revealOwner]);

  const refreshScores = useCallback(async (nextGameId = gameId, nextPlayers = players) => {
    if (!nextGameId) return;
    const { data: scoreRows } = await supabase.from('scores').select('player_id, points').eq('game_id', nextGameId);
    const scoreboard: Score[] = nextPlayers.map((player) => {
      const score = scoreRows?.find((row: any) => row.player_id === player.id);
      return { playerId: player.id, name: player.display_name || 'Jugador', points: score?.points ?? 0 };
    });
    setScores(scoreboard);
  }, [gameId, players]);

  const fetchGame = useCallback(async () => {
    let storedId: number | null = null;
    try {
      const stored = localStorage.getItem('playerId');
      storedId = stored ? parseInt(stored, 10) : null;
    } catch (err) {
      console.warn('Unable to read playerId from localStorage', err);
    }
    setPlayerId(storedId);

    const { data: lobby } = await supabase.from('lobbies').select('id, round_time_seconds').eq('code', code).single();
    if (!lobby) return;

    if (lobby.round_time_seconds) {
      setRoundTime(lobby.round_time_seconds);
    }

    const { data: game } = await supabase.from('games').select('id, current_round_number').eq('lobby_id', lobby.id).single();
    if (!game) return;
    setGameId(game.id);

    const [lobbyPlayersRes, ownersRes, scoresRes] = await Promise.all([
      supabase
        .from('lobby_players')
        .select('player_id, players(display_name)')
        .eq('lobby_id', lobby.id),
      supabase.from('image_owners').select('id, name'),
      supabase.from('scores').select('player_id, points').eq('game_id', game.id),
    ]);

    const list: Player[] = lobbyPlayersRes.data?.map((lp: any) => {
      const player = Array.isArray(lp.players) ? lp.players[0] : lp.players;
      return { id: lp.player_id, display_name: player?.display_name ?? '' };
    }) ?? [];
    setPlayers(list);

    const ownerList: Owner[] = ownersRes.data?.map((o: any) => ({ id: o.id, name: o.name })) ?? [];
    setOwners(ownerList);

    const scoreboard: Score[] = list.map((player) => {
      const score = scoresRes.data?.find((row: any) => row.player_id === player.id);
      return { playerId: player.id, name: player.display_name || 'Jugador', points: score?.points ?? 0 };
    });
    setScores(scoreboard);

    const { data: round } = await supabase.from('rounds').select('id, image_id').eq('game_id', game.id).eq('round_number', game.current_round_number).single();
    if (!round) return;
    setRoundId(round.id);

    const { data: image } = await supabase.from('images').select('storage_path').eq('id', round.image_id).single();
    if (image) {
      const { data: signedUrl } = await supabase.storage.from('images').createSignedUrl(image.storage_path, 60);
      setImageUrl(signedUrl?.signedUrl || null);
      setImageLoaded(false);
      setRevealOwner(null);
      setGuessed(false);
      setSelectedGuessId(null);
    }
  }, [code]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    const channel = supabase
      .channel(`game:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, fetchGame)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, fetchGame)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_players' }, fetchGame)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        if (revealOwnerRef.current) {
          refreshScores();
        }
      })
      .on('broadcast', { event: 'round_reveal' }, async ({ payload }) => {
        if (payload?.roundId !== roundId) return;
        setRevealOwner(payload.ownerName ?? null);
        await refreshScores();
      })
      .subscribe();

    gameChannelRef.current = channel;

    return () => {
      gameChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [code, fetchGame, refreshScores, roundId]);

  function onTimerComplete() {
    if (roundId) {
      (async () => {
        if (revealOwnerRef.current) return;
        const { data: round } = await supabase.from('rounds').select('image_id').eq('id', roundId).single();
        const { data: image } = await supabase.from('images').select('owner_id, image_owners(name)').eq('id', round?.image_id).single();
        const owner = Array.isArray(image?.image_owners) ? image?.image_owners[0] : image?.image_owners;
        const ownerName = owner?.name ?? null;
        setRevealOwner(ownerName);
        await refreshScores();
        await gameChannelRef.current?.send({
          type: 'broadcast',
          event: 'round_reveal',
          payload: { roundId, ownerName },
        });
      })();
    }
  }

  async function submitGuess(ownerId: number) {
    if (!roundId || !gameId) return;
    setGuessed(true);
    setSelectedGuessId(ownerId);
    await fetch('/api/games/submit-guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, playerId, guessedOwnerId: ownerId, gameId }),
    });
  }

  if (!gameId || !roundId) {
    return (
      <main className="party-shell grid place-items-center">
        <div className="party-panel rounded-[32px] bg-white p-8 text-center animate-pop">
          <span className="sticker mx-auto">Loading</span>
          <p className="mt-5 text-3xl font-black text-candy-ink">Preparando el caos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="party-shell">
      <div className="party-wrap py-4">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="sticker">Sala {code}</span>
            <h1 className="mt-3 text-4xl font-black text-candy-paper drop-shadow-[0_8px_18px_rgba(7,8,18,0.75)] sm:text-5xl">
              De quien es este pin?
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="sticker">{players.length} jugadores</span>
            {guessed && <span className="sticker">Respuesta enviada</span>}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="party-panel rounded-[36px] bg-white p-4 sm:p-5">
              {imageUrl ? (
                <div className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-[28px] border-2 border-candy-ink bg-candy-paper p-3">
                  {!imageLoaded && (
                    <div className="absolute inset-3 grid place-items-center rounded-[24px] bg-white text-xl font-black text-candy-ink animate-pulse">
                      Cargando imagen...
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt="Imagen para adivinar"
                    className={[
                      'max-h-[62vh] max-w-full rounded-[22px] border-2 border-candy-ink object-contain shadow-[0_14px_28px_rgba(7,8,18,0.35)] transition duration-500',
                      imageLoaded ? 'scale-100 opacity-100 animate-pop' : 'scale-95 opacity-0',
                    ].join(' ')}
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
              ) : (
                <div className="grid h-96 place-items-center rounded-[28px] border-2 border-dashed border-candy-ink bg-white text-xl font-black animate-pulse">
                  Cargando imagen...
                </div>
              )}
            </div>

            {!revealOwner && imageLoaded && (
              <div className="party-panel rounded-[28px] p-4 sm:p-5">
                <TimerBar duration={roundTime} onComplete={onTimerComplete} />
              </div>
            )}

            {!revealOwner && imageLoaded && (
              <GuessOptions
                options={owners.map((o) => ({ id: o.id, name: o.name }))}
                onGuess={submitGuess}
                disabled={guessed}
                selectedId={selectedGuessId}
              />
            )}

            {revealOwner && (
              <div className="party-panel red-panel rounded-[32px] p-6 text-center animate-pop">
                <p className="text-sm font-black uppercase">Reveal</p>
                <p className="mt-2 text-3xl font-black">
                  Era de {revealOwner}
                </p>
                <button
                  onClick={async () => {
                    await fetch('/api/games/advance-round', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gameId }),
                    });
                    setRevealOwner(null);
                    setGuessed(false);
                    setImageLoaded(false);
                    setSelectedGuessId(null);
                    window.location.reload();
                  }}
                  className="party-button mt-5 bg-candy-paper"
                >
                  Siguiente ronda
                </button>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Scoreboard scores={scores} />
          </aside>
        </div>
      </div>
    </main>
  );
}

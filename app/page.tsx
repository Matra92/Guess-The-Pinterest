"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function createLobby() {
    if (!nickname) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lobbies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (data.playerId) {
        try {
          localStorage.setItem('playerId', String(data.playerId));
        } catch (err) {
          console.warn('Unable to store playerId', err);
        }
      }
      router.push(`/lobby/${data.code}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function joinLobby() {
    if (!nickname || !joinCode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, code: joinCode }),
      });
      const data = await res.json();
      if (data.playerId) {
        try {
          localStorage.setItem('playerId', String(data.playerId));
        } catch (err) {
          console.warn('Unable to store playerId', err);
        }
      }
      if (data.code) {
        router.push(`/lobby/${data.code}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="party-shell">
      <div className="party-wrap flex min-h-[calc(100vh-3rem)] items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-6">
            <div className="max-w-3xl">
              <h1 className="text-6xl font-black leading-[0.9] text-candy-paper drop-shadow-[0_8px_18px_rgba(7,8,18,0.75)] sm:text-7xl lg:text-8xl">
                Guess the Pinterest
              </h1>
              <p className="mt-5 max-w-xl rounded-[28px] border-2 border-candy-ink bg-candy-paper/90 p-5 text-xl font-extrabold leading-tight text-candy-ink shadow-[0_14px_32px_rgba(7,8,18,0.34)] sm:text-2xl">
                Mira la imagen, acusa a tus amigos y junta puntos antes de que explote el timer.
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-3 text-center text-sm font-black uppercase text-candy-ink">
              {['Mira', 'Adivina', 'Grita'].map((label, idx) => (
                <div key={label} className="rounded-3xl border-2 border-candy-ink bg-white p-4 shadow-[0_10px_22px_rgba(7,8,18,0.24)]">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-candy-paper">
                    {idx + 1}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </section>

          <section className="party-panel rounded-[32px] p-5 animate-pop sm:p-7">
            <div className="mb-6 rounded-[24px] border-2 border-candy-ink bg-[linear-gradient(135deg,#ff1f4f,#ff6b87,#ffd447)] p-5 shadow-[0_12px_28px_rgba(7,8,18,0.3)]">
              <p className="text-sm font-black uppercase text-candy-paper drop-shadow-[0_3px_8px_rgba(7,8,18,0.65)]">Entrar al juego</p>
              <h2 className="mt-1 text-3xl font-black text-candy-paper drop-shadow-[0_4px_10px_rgba(7,8,18,0.7)]">Arma tu lobby</h2>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase text-candy-ink">Tu nick</span>
                <input
                  type="text"
                  placeholder="Ej: reina del moodboard"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="party-input"
                />
              </label>

              <div className="rounded-[26px] border-2 border-candy-ink bg-white p-4 shadow-[0_10px_22px_rgba(7,8,18,0.2)]">
                <p className="mb-3 text-sm font-black uppercase text-candy-ink">Crear sala</p>
                <button
                  onClick={createLobby}
                  disabled={loading || !nickname}
                  className="party-button red-button w-full text-lg"
                >
                  {loading ? 'Cargando...' : 'Crear lobby nuevo'}
                </button>
              </div>

              <div className="rounded-[26px] border-2 border-candy-ink bg-white p-4 shadow-[0_10px_22px_rgba(7,8,18,0.2)]">
                <p className="mb-3 text-sm font-black uppercase text-candy-ink">Unirse con codigo</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Codigo de sala"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="party-input"
                  />
                  <button
                    onClick={joinLobby}
                    disabled={loading || !nickname || !joinCode}
                    className="party-button red-button w-full text-lg"
                  >
                    Unirse a una sala
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

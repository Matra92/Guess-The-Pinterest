"use client";

interface Score {
  playerId: number;
  name: string;
  points: number;
}

export default function Scoreboard({ scores }: { scores: Score[] }) {
  const sortedScores = [...scores].sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...sortedScores.map((s) => s.points), 1);

  return (
    <div className="party-panel w-full rounded-[28px] p-4 animate-fadeIn animate-slideUp sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black uppercase text-candy-ink">Marcador</h3>
        <span className="sticker">{scores.length} players</span>
      </div>
      <ul className="space-y-3">
        {sortedScores.length === 0 && (
          <li className="rounded-2xl border-2 border-dashed border-candy-ink bg-white p-4 text-center font-black text-candy-ink">
            Todavia no hay puntos
          </li>
        )}
        {sortedScores.map((s, idx) => {
          const pct = Math.max(6, Math.round((s.points / maxPoints) * 100));
          const color = idx === 0 ? '#ff1f4f' : idx === 1 ? '#ff6b87' : idx === 2 ? '#ffd447' : '#ffb3c2';

          return (
            <li key={s.playerId} className="rounded-2xl border-2 border-candy-ink bg-white p-3 shadow-[0_8px_18px_rgba(7,8,18,0.18)]">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-candy-ink">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] border-candy-ink bg-primary text-candy-paper">
                    {idx + 1}
                  </span>
                  <span className="truncate">{s.name || 'Jugador'}</span>
                </span>
                <span className="shrink-0">{s.points} pts</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full border-2 border-candy-ink bg-[#f1f5f9]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

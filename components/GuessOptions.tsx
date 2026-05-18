"use client";

interface GuessOption {
  id: number;
  name: string;
}

interface GuessOptionsProps {
  options: GuessOption[];
  onGuess: (ownerId: number) => void;
  disabled: boolean;
  selectedId?: number | null;
}

export default function GuessOptions({ options, onGuess, disabled, selectedId }: GuessOptionsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 animate-fadeIn animate-slideUp sm:grid-cols-2">
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;

        return (
          <button
            key={opt.id}
            onClick={() => onGuess(opt.id)}
            disabled={disabled}
            className={[
              'party-button min-h-16 w-full justify-between gap-3 text-left text-lg normal-case tracking-normal',
              isSelected ? 'red-button scale-[1.03] ring-4 ring-white animate-pop' : 'bg-white hover:bg-primary-light',
              disabled && !isSelected ? 'opacity-45' : '',
            ].join(' ')}
          >
            <span className="truncate">{opt.name}</span>
            <span className="shrink-0 rounded-full bg-candy-ink px-3 py-1 text-sm text-white">
              {isSelected ? 'LOCK' : '?'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

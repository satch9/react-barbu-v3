import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { HandResult } from '../backend/gameInterface';

interface HandResultOverlayProps {
    result: HandResult;
    onDone: () => void;
}

const DURATION_MS = 6000;

const formatDelta = (delta: number) => {
    if (delta > 0) return `+${delta} pts`;
    if (delta < 0) return `${delta} pts`;
    return '0 pt';
};

const HandResultOverlay = ({ result, onDone }: HandResultOverlayProps) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Burst de confettis au montage
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.4 },
            colors: ['#facc15', '#22c55e', '#3b82f6', '#f97316', '#ec4899'],
        });

        timerRef.current = setTimeout(() => {
            onDone();
        }, DURATION_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onDone]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
            <div className="relative flex flex-col items-center gap-4 rounded-2xl bg-felt-dark border border-yellow-400/40 px-8 py-8 shadow-2xl max-w-sm w-full mx-4">
                {/* Nom du contrat */}
                <p className="text-yellow-400 text-sm font-semibold tracking-widest uppercase">
                    {result.contractName}
                </p>

                {/* Vainqueur */}
                {result.winner && (
                    <div className="flex flex-col items-center">
                        <span className="text-4xl">🏆</span>
                        <p className="text-card text-2xl font-bold mt-1">{result.winner.name}</p>
                        <p className="text-green-400 font-mono text-lg font-semibold">
                            {formatDelta(result.winner.scoreDelta)}
                        </p>
                    </div>
                )}

                {/* Perdant */}
                {result.loser && (
                    <div className="flex flex-col items-center">
                        <span className="text-2xl">💀</span>
                        <p className="text-card/80 text-lg font-semibold">{result.loser.name}</p>
                        <p className="text-red-400 font-mono text-base font-semibold">
                            {formatDelta(result.loser.scoreDelta)}
                        </p>
                    </div>
                )}

                {/* Aucun gagnant/perdant */}
                {!result.winner && !result.loser && (
                    <p className="text-card/60 text-sm">Aucun point échangé</p>
                )}

                {/* Tous les scores */}
                <div className="w-full border-t border-white/10 pt-3 flex flex-col gap-1">
                    {result.scores.map(s => (
                        <div key={s.name} className="flex justify-between text-sm">
                            <span className="text-card/70">{s.name}</span>
                            <span className={`font-mono font-semibold ${s.scoreDelta > 0 ? 'text-green-400' : s.scoreDelta < 0 ? 'text-red-400' : 'text-card/40'}`}>
                                {formatDelta(s.scoreDelta)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Barre de progression */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                        className="h-full bg-yellow-400 rounded-full origin-left"
                        style={{
                            animation: `shrink ${DURATION_MS}ms linear forwards`,
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
};

export default HandResultOverlay;

# Showdown fin de contrat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un écran plein écran avec confettis + vainqueur/perdant pendant 6 secondes à la fin de chaque contrat.

**Architecture:** Le backend émet un événement socket `hand_result` juste avant de réinitialiser l'état de fin de manche. Le frontend écoute cet événement dans `Board.tsx`, stocke le résultat dans un state local, et affiche `HandResultOverlay` par-dessus le board pendant 6 secondes avec une animation `canvas-confetti`.

**Tech Stack:** React 18, TypeScript, socket.io-client, canvas-confetti, Tailwind CSS

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/backend/gameInterface.ts` | Ajouter le type exporté `HandResult` |
| `src/backend/Game.ts` | Émettre `hand_result` dans `endHand()` avant le reset |
| `src/components/HandResultOverlay.tsx` | Nouveau composant overlay confettis |
| `src/components/Board.tsx` | Écouter `hand_result`, state `handResult`, rendu conditionnel |
| `src/backend/dist/` | Rebuild du backend après chaque modif backend |

---

## Task 1 : Installer canvas-confetti

**Files:**
- Modify: `package.json` (racine)

- [ ] **Step 1 : Installer la dépendance**

```bash
cd /var/www/vincent/react-barbu-v3
npm install canvas-confetti @types/canvas-confetti
```

Résultat attendu : `canvas-confetti` et `@types/canvas-confetti` apparaissent dans `package.json` dependencies.

- [ ] **Step 2 : Vérifier l'installation**

```bash
ls node_modules/canvas-confetti
```

Résultat attendu : le dossier existe.

- [ ] **Step 3 : Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: ajouter canvas-confetti pour l'animation showdown"
```

---

## Task 2 : Ajouter le type `HandResult` dans gameInterface.ts

**Files:**
- Modify: `src/backend/gameInterface.ts`

- [ ] **Step 1 : Ajouter le type `HandResult` à la fin du fichier**

Ouvrir `src/backend/gameInterface.ts` et ajouter à la fin :

```ts
/** Résultat d'une manche, émis par le serveur via l'événement 'hand_result'. */
export interface HandResult {
    contractName: string;
    winner: { name: string; scoreDelta: number } | null;
    loser:  { name: string; scoreDelta: number } | null;
    scores: { name: string; scoreDelta: number }[];
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/backend/gameInterface.ts
git commit -m "feat(types): ajouter HandResult pour l'événement hand_result"
```

---

## Task 3 : Émettre `hand_result` dans `endHand()` côté backend

**Files:**
- Modify: `src/backend/Game.ts` (fonction `endHand`, ligne ~639)

Le but : snapshot les scores avant `calculateHandScore`, calculer les deltas, déterminer winner/loser, émettre l'événement, **puis** faire le reset habituel.

- [ ] **Step 1 : Modifier `endHand()` dans `src/backend/Game.ts`**

Remplacer la fonction `endHand()` complète par :

```ts
public endHand(): void {
    const { players, currentContract, reussite } = this.gameState;

    // Snapshot des scores avant calcul pour pouvoir calculer les deltas
    const scoresBefore = players.map(p => ({ uid: p.uid, name: p.name, score: p.score }));

    // Calcul des scores de fin de manche (sauf Le barbu, scoré par pli)
    let updatedPlayers = [...players];
    if (currentContract) {
        updatedPlayers = Contracts.calculateHandScore(players, currentContract, reussite);
    }

    this.updateGameState({ players: updatedPlayers });
    this.calculateRanking();

    // Calcul des deltas et émission hand_result (sauf fin de partie)
    const newRound = this.gameState.currentRound + 1;
    const isGameOver = newRound >= this.gameState.players.length * Contracts.CONTRACTS.length;

    if (!isGameOver && currentContract) {
        const scores = updatedPlayers.map(p => {
            const before = scoresBefore.find(s => s.uid === p.uid);
            return { name: p.name, scoreDelta: p.score - (before?.score ?? p.score) };
        });

        const sorted = [...scores].sort((a, b) => b.scoreDelta - a.scoreDelta);
        const winner = sorted[0].scoreDelta !== 0 ? sorted[0] : null;
        const loser = sorted.length > 1 && sorted[sorted.length - 1].scoreDelta !== sorted[0].scoreDelta
            ? sorted[sorted.length - 1]
            : null;

        this.serverSocket.io.emit('hand_result', {
            contractName: currentContract.contract.name,
            winner,
            loser,
            scores,
        });
    }

    if (isGameOver) {
        // Fin de partie
        this.updateGameState({
            currentRound: newRound,
            isOver: true,
            currentContract: null,
        });
        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(r => ({ ...r, isOver: true })),
        });
        this.syncRoomsWithGameState();
        return;
    }

    // Réinitialise les mains pour la prochaine manche
    const resetPlayers = this.gameState.players.map(p => ({
        ...p,
        myFoldsDuringTurn: [],
        startedHand: [],
        isPlaying: true,
    }));

    this.updateGameState({
        players: resetPlayers,
        currentRound: newRound,
        currentTrick: 0,
        currentContract: null,
        currentTurn: {
            ...this.gameState.currentTurn,
            folds: [],
            ledSuit: null,
        },
        reussite: undefined,
        playableCardIndices: undefined,
    });

    // Avance le dealer
    this.nextDealer();

    // Récupère la taille du jeu depuis la première room en cours
    const activeRoom = this.roomsState.rooms.find(r => r.isGameInProgress);
    const deckSize = activeRoom?.deckSize ?? 52;

    // Distribue de nouvelles cartes
    this.deck = new Deck(deckSize, this.gameState.players.length);
    this.deck.shuffle();
    this.deck.dealCardsToPlayers(this.gameState.players);
    this.updateGameState({ players: [...this.gameState.players] });

    this.syncRoomsWithGameState();
}
```

- [ ] **Step 2 : Rebuilder le backend**

```bash
cd /var/www/vincent/react-barbu-v3/src/backend && npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Redémarrer et vérifier dans les logs**

```bash
pm2 restart barbu-api && pm2 logs barbu-api --lines 10 --nostream
```

Résultat attendu : `Socket IO started` dans les logs, pas d'erreur.

- [ ] **Step 4 : Commit**

```bash
cd /var/www/vincent/react-barbu-v3
git add src/backend/Game.ts src/backend/dist/Game.js
git commit -m "feat(backend): émettre hand_result à la fin de chaque contrat"
```

---

## Task 4 : Créer le composant `HandResultOverlay`

**Files:**
- Create: `src/components/HandResultOverlay.tsx`

- [ ] **Step 1 : Créer `src/components/HandResultOverlay.tsx`**

```tsx
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
```

- [ ] **Step 2 : Vérifier que TypeScript compile côté frontend**

```bash
cd /var/www/vincent/react-barbu-v3 && npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/HandResultOverlay.tsx
git commit -m "feat(ui): créer HandResultOverlay avec confettis et barre de progression"
```

---

## Task 5 : Intégrer l'overlay dans `Board.tsx`

**Files:**
- Modify: `src/components/Board.tsx`

- [ ] **Step 1 : Ajouter l'import et le state**

En haut de `Board.tsx`, ajouter l'import :

```tsx
import HandResultOverlay from './HandResultOverlay';
import { HandResult } from '../backend/gameInterface';
```

Dans le corps du composant `Board`, après les autres `useState` (ligne ~21) :

```tsx
const [handResult, setHandResult] = useState<HandResult | null>(null);
```

- [ ] **Step 2 : Écouter l'événement `hand_result` dans le useEffect des sockets**

Dans le `useEffect` existant qui gère les événements socket (celui qui contient `handleError`, `handlePlayerPassed`, `handlePlayerBonus`) — vers la ligne 131 — ajouter :

```tsx
const handleHandResult = (result: HandResult) => {
    setHandResult(result);
};

socket.on('hand_result', handleHandResult);
```

Et dans le `return () => { ... }` du même `useEffect` :

```tsx
socket.off('hand_result', handleHandResult);
```

- [ ] **Step 3 : Ajouter le rendu conditionnel de l'overlay**

Dans le `return` de `Board`, après `<Toaster />` et avant le bloc `{isGameOver && <Ranking isGameOver />}`, ajouter :

```tsx
{handResult && (
    <HandResultOverlay
        result={handResult}
        onDone={() => setHandResult(null)}
    />
)}
```

- [ ] **Step 4 : Vérifier que TypeScript compile**

```bash
cd /var/www/vincent/react-barbu-v3 && npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 5 : Build frontend et redémarrer**

```bash
npm run build && pm2 restart barbu-api
```

Résultat attendu : build sans erreur, backend en ligne.

- [ ] **Step 6 : Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat(ui): intégrer HandResultOverlay dans Board au déclenchement de hand_result"
```

---

## Task 6 : Vérification manuelle en jeu

- [ ] **Step 1 : Lancer une partie et jouer un contrat jusqu'à la fin**

Ouvrir l'app dans le navigateur, lancer une partie, jouer un contrat complet (ex. Pas de plis).

Résultat attendu :
- L'overlay apparaît en plein écran avec fond sombre
- Les confettis éclatent
- Le nom du contrat est affiché en haut
- Le vainqueur (🏆) et le perdant (💀) s'affichent avec leurs deltas
- La barre jaune se vide en 6 secondes
- Après 6 secondes, l'overlay disparaît et le board revient en sélection de contrat

- [ ] **Step 2 : Vérifier le contrat Réussite**

Jouer un contrat Réussite jusqu'à la fin.

Résultat attendu : winner = premier joueur à avoir vidé sa main, loser = null (pas de 💀 affiché).

- [ ] **Step 3 : Vérifier les logs pm2 — absence d'erreur**

```bash
pm2 logs barbu-api --lines 30 --nostream
```

Résultat attendu : pas d'erreur, pas de `hand_result` émis lors de `isOver` (fin de partie complète).

- [ ] **Step 4 : Commit final de vérification**

```bash
git add -A
git commit -m "chore: vérification manuelle showdown fin de contrat OK"
```

Ou si aucun fichier n'a changé lors des tests, ne pas créer de commit vide.

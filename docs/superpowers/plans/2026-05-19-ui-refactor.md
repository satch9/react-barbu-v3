# UI Refactor — Tailwind v3 + shadcn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactoriser l'interface du jeu Barbu pour qu'elle soit jouable et agréable sur iPhone 11 portrait (375×812px), sans scroll, avec fond vert tapis, cartes en 2 lignes lisibles, et modales shadcn pour le lobby.

**Architecture:** SPA React/Vite, pas de changement backend ni logique Socket.IO. Suppression de App.css (583 lignes) et react-modal. Remplacement par Tailwind v3 + shadcn (Dialog, Button, Badge, Input, Table). Comparaisons d'identité joueur migrées de socketId → uid.

**Tech Stack:** React 18, Vite 4, TypeScript, Tailwind CSS v3, shadcn/ui, react-hot-toast (conservé)

---

## Task 1 : Installer Tailwind v3

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Installer les packages**

```bash
cd /var/www/vincent/react-barbu-v3
npm install -D tailwindcss@3 postcss autoprefixer
```

- [ ] **Créer `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt:        '#1a6b3c',
        'felt-dark': '#134f2d',
        card:        '#fafaf5',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Créer `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Écrire `src/index.css`** (fichier actuellement vide)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Vérifier que Tailwind compile**

```bash
npm run build 2>&1 | tail -5
```

Attendu : `✓ built in` sans erreur.

- [ ] **Commit**

```bash
git add tailwind.config.js postcss.config.js src/index.css package.json package-lock.json
git commit -m "feat: install Tailwind CSS v3"
```

---

## Task 2 : Configurer shadcn/ui + alias de chemin `@`

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Create: `components.json`
- Create: `src/lib/utils.ts`

- [ ] **Installer @types/node**

```bash
npm install -D @types/node
```

- [ ] **Mettre à jour `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4003',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:4003',
        changeOrigin: true,
      },
    },
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
})
```

- [ ] **Mettre à jour `tsconfig.json`** (ajouter baseUrl et paths)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Créer `components.json`** (config shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Installer les composants shadcn**

```bash
npx shadcn@latest add button dialog badge input table --overwrite --yes 2>&1 | tail -20
```

Attendu : création de `src/components/ui/button.tsx`, `dialog.tsx`, `badge.tsx`, `input.tsx`, `table.tsx` et `src/lib/utils.ts`.

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -8
```

Attendu : `✓ built in` sans erreur TypeScript.

- [ ] **Commit**

```bash
git add vite.config.ts tsconfig.json components.json src/lib/ src/components/ui/ package.json package-lock.json
git commit -m "feat: setup shadcn/ui + path alias @"
```

---

## Task 3 : Supprimer App.css, mettre à jour App.tsx

**Files:**
- Delete: `src/App.css`
- Modify: `src/App.tsx`

- [ ] **Supprimer `src/App.css`**

```bash
rm /var/www/vincent/react-barbu-v3/src/App.css
```

- [ ] **Réécrire `src/App.tsx`**

```tsx
import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import Board from './components/Board';
import { useSocketSetup } from './hooks/useSocket';

const App = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  useSocketSetup();

  if (!SocketState.socket) {
    return (
      <div className="min-h-[100dvh] bg-felt-dark flex items-center justify-center">
        <p className="text-card text-sm">Connexion au serveur…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      {GameState.gameState.startedGame ? <Board /> : <ListOfGames />}
    </div>
  );
};

export default App;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "refactor: supprimer App.css, App.tsx Tailwind"
```

---

## Task 4 : Refactoriser CardGame

**Files:**
- Modify: `src/components/CardGame.tsx`

- [ ] **Réécrire `src/components/CardGame.tsx`**

```tsx
type Card = {
  value: string;
  suit: string;
}

type CardProps = {
  card: Card;
  highlighted?: boolean;
  onClick?: () => void;
}

const isRed = (suit: string) => suit === '♥' || suit === '♦';

const CardGame: React.FC<CardProps> = ({ card, highlighted = false, onClick }) => {
  return (
    <div
      className={`w-10 h-16 bg-card rounded-md shadow-md flex flex-col justify-between p-1 cursor-pointer select-none
        transition-transform duration-150
        ${highlighted ? 'ring-2 ring-yellow-400 -translate-y-2' : ''}`}
      onClick={onClick}
    >
      <div className={`text-xs font-bold leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.value}<span className="ml-0.5">{card.suit}</span>
      </div>
      <div className={`text-xl text-center leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suit}
      </div>
      <div className={`text-xs font-bold leading-none text-right rotate-180 ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.value}<span className="ml-0.5">{card.suit}</span>
      </div>
    </div>
  );
};

export default CardGame;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/CardGame.tsx
git commit -m "refactor: CardGame — style carte classique Tailwind"
```

---

## Task 5 : Refactoriser Hand (2 lignes)

**Files:**
- Modify: `src/components/Hand.tsx`

- [ ] **Réécrire `src/components/Hand.tsx`**

```tsx
import CardGame from './CardGame';

type Card = {
  value: string;
  suit: string;
}

interface HandProps {
  cards: Card[];
  highlighted: number | undefined;
  onCardClick: (cardIndex: number) => void;
}

const Hand = ({ cards, highlighted, onCardClick }: HandProps) => {
  const row1 = cards.slice(0, 7);
  const row2 = cards.slice(7);

  return (
    <div className="flex flex-col gap-1 w-full py-1">
      <div className="flex justify-center gap-1">
        {row1.map((card, index) => (
          <CardGame
            key={index}
            card={card}
            highlighted={highlighted === index}
            onClick={() => onCardClick(index)}
          />
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {row2.map((card, index) => (
          <CardGame
            key={index + 7}
            card={card}
            highlighted={highlighted === index + 7}
            onClick={() => onCardClick(index + 7)}
          />
        ))}
      </div>
    </div>
  );
};

export default Hand;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/Hand.tsx
git commit -m "refactor: Hand — 2 lignes de cartes mobile-first"
```

---

## Task 6 : Refactoriser BoardHeader

**Files:**
- Modify: `src/components/BoardHeader.tsx`

- [ ] **Réécrire `src/components/BoardHeader.tsx`**

```tsx
import { useGameContext } from '../utils/gameUtils';

const BoardHeader = () => {
  const { GameState } = useGameContext();
  const { currentContract, currentTurn, currentPlayer } = GameState.gameState;

  return (
    <div className="h-10 bg-felt-dark/80 flex items-center justify-center px-3 shrink-0">
      {currentContract ? (
        <p className="text-card text-sm font-semibold truncate">
          {`Contrat : ${currentContract.contract.name} — Dealer : ${currentTurn.dealer.name}`}
        </p>
      ) : (
        <p className="text-card text-sm">
          {`${currentPlayer.name} choisit un contrat`}
        </p>
      )}
    </div>
  );
};

export default BoardHeader;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/BoardHeader.tsx
git commit -m "refactor: BoardHeader Tailwind"
```

---

## Task 7 : Refactoriser PlayedCards (4 slots fixes avec noms)

**Files:**
- Modify: `src/components/PlayedCards.tsx`

PlayedCards reçoit maintenant `folds` (tableau 4 éléments, indexé par position joueur) et `players` pour afficher le nom sous chaque slot.

- [ ] **Réécrire `src/components/PlayedCards.tsx`**

```tsx
import { ICard, Player } from '../backend/gameInterface';

interface PlayedCardsProps {
  folds: (ICard | null)[];
  players: Player[];
}

const isRed = (suit: string) => suit === '♥' || suit === '♦';

const PlayedCards = ({ folds, players }: PlayedCardsProps) => {
  return (
    <div className="h-28 flex items-center justify-center gap-3 shrink-0">
      {players.map((player, index) => {
        const card = folds[index] ?? null;
        return (
          <div key={player.uid} className="flex flex-col items-center gap-1">
            {card ? (
              <div className="w-10 h-16 bg-card rounded-md shadow-md flex flex-col justify-between p-1">
                <div className={`text-xs font-bold leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
                  {card.value}<span className="ml-0.5">{card.suit}</span>
                </div>
                <div className={`text-xl text-center leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
                  {card.suit}
                </div>
                <div className={`text-xs font-bold leading-none text-right rotate-180 ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
                  {card.value}<span className="ml-0.5">{card.suit}</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-16 border-2 border-dashed border-card/30 rounded-md" />
            )}
            <span className="text-xs text-card/70 max-w-[40px] truncate">{player.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PlayedCards;
```

⚠️ Ne pas vérifier le build ici — Board.tsx passe encore l'ancienne prop `cards` ce qui provoquerait une erreur TypeScript attendue. Le build complet est vérifié en Task 11 après mise à jour de Board.tsx.

- [ ] **Commit**

```bash
git add src/components/PlayedCards.tsx
git commit -m "refactor: PlayedCards — 4 slots fixes avec noms joueurs"
```

---

## Task 8 : Refactoriser ContractList

**Files:**
- Modify: `src/components/ContractList.tsx`

- [ ] **Réécrire `src/components/ContractList.tsx`**

```tsx
import { Button } from '@/components/ui/button';
import { useGameContext } from '../utils/gameUtils';
import { Contract } from '../backend/gameInterface';

interface ContractListProps {
  contracts: Contract[];
  onContractClick: (contract: Contract) => void;
}

const ContractList = ({ contracts, onContractClick }: ContractListProps) => {
  const { GameState } = useGameContext();

  if (contracts.length === 0) {
    return (
      <p className="text-card/70 text-sm text-center py-4">
        Vous avez joué tous vos contrats.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full px-2 py-2">
      {contracts.map((contract, index) => (
        <Button
          key={index}
          variant="outline"
          className={`bg-felt-dark/60 text-card text-sm rounded-lg border-card/30
            hover:bg-yellow-600/80 hover:text-white hover:border-transparent transition-colors h-auto py-3
            ${contract === GameState.gameState.currentContract?.contract
              ? 'ring-2 ring-yellow-400'
              : ''}`}
          onClick={() => onContractClick(contract)}
        >
          {contract.name}
        </Button>
      ))}
    </div>
  );
};

export default ContractList;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/ContractList.tsx
git commit -m "refactor: ContractList — grille 2×3 shadcn Button"
```

---

## Task 9 : Refactoriser ReussiteArea

**Files:**
- Modify: `src/components/ReussiteArea.tsx`

- [ ] **Réécrire `src/components/ReussiteArea.tsx`**

```tsx
import { useGameContext } from '../utils/gameUtils';

type Card = { value: string; suit: string }
const SUITS = ['♥', '♦', '♣', '♠'];
const isRed = (suit: string) => suit === '♥' || suit === '♦';

const ReussiteArea = () => {
  const { GameState } = useGameContext();

  const getCardsBySuit = (suit: string): Card[] =>
    GameState.gameState.currentPlayer.startedHand.filter(c => c.suit === suit);

  return (
    <div className="bg-felt-dark/50 rounded-xl p-2 mx-2 flex flex-col gap-1 shrink-0">
      {SUITS.map(suit => {
        const cards = getCardsBySuit(suit);
        if (cards.length === 0) return null;
        return (
          <div key={suit} className="flex gap-1 flex-wrap items-center">
            <span className={`text-sm font-bold w-5 ${isRed(suit) ? 'text-red-400' : 'text-card'}`}>
              {suit}
            </span>
            {cards.map((card, i) => (
              <span key={i} className={`text-sm ${isRed(suit) ? 'text-red-400' : 'text-card'}`}>
                {card.value}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ReussiteArea;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/ReussiteArea.tsx
git commit -m "refactor: ReussiteArea Tailwind"
```

---

## Task 10 : Refactoriser Ranking

**Files:**
- Modify: `src/components/Ranking.tsx`

- [ ] **Réécrire `src/components/Ranking.tsx`**

```tsx
import { useGameContext } from '../utils/gameUtils';
import { useSocketContext } from '../utils/socketUtils';
import { Button } from '@/components/ui/button';

interface RankingProps {
  isGameOver?: boolean;
}

const Ranking = ({ isGameOver = false }: RankingProps) => {
  const { GameState } = useGameContext();
  const { SocketState } = useSocketContext();
  const ranking = GameState.gameState.ranking;

  const handleNewGame = () => {
    const roomId = GameState.roomsState.rooms.find(room =>
      room.players.some(p => p.uid === SocketState.uid)
    )?.roomId;
    if (roomId) SocketState.socket?.emit('gobackgame', { roomIdGoBackGame: roomId });
  };

  if (isGameOver) {
    return (
      <div className="fixed inset-0 bg-felt flex flex-col items-center justify-center gap-6 z-50">
        <h2 className="text-card text-2xl font-bold">Partie terminée !</h2>
        <div className="bg-felt-dark/70 rounded-xl p-4 w-full max-w-xs mx-4">
          <p className="text-card font-semibold text-sm mb-3 text-center">Classement final</p>
          <div className="flex flex-col gap-2">
            {ranking.map((player, index) => (
              <div key={player.uid} className="flex justify-between text-card text-sm">
                <span>{index + 1}. {player.name}</span>
                <span className="font-mono">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>
        <Button
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
          onClick={handleNewGame}
        >
          Nouvelle partie
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-felt-dark/70 rounded-xl p-3 mx-2 my-1 shrink-0">
      <p className="text-card font-semibold text-sm mb-2">Classement</p>
      <div className="flex flex-col gap-1">
        {ranking.map((player, index) => (
          <div key={player.uid} className="flex justify-between text-card text-sm">
            <span>{index + 1}. {player.name}</span>
            <span className="font-mono">{player.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
```

- [ ] **Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/Ranking.tsx
git commit -m "refactor: Ranking — overlay fin de partie + shadcn Button"
```

---

## Task 11 : Refactoriser Board (layout + uid)

**Files:**
- Modify: `src/components/Board.tsx`

Changements clés :
- `socketId` → `uid` pour `isTheGoodPlayer`, `isTheCurrentPlayer`, `roomId`
- Mise à jour props `PlayedCards` : `folds` + `players`
- Layout `min-h-[100dvh] flex flex-col`
- Suppression de l'ancien import `react-modal` (non présent ici)
- BoardHeader toujours affiché (plus de condition sur `currentContract`)

- [ ] **Réécrire `src/components/Board.tsx`**

```tsx
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import BoardHeader from './BoardHeader';
import PlayedCards from './PlayedCards';
import ReussiteArea from './ReussiteArea';
import Hand from './Hand';
import ContractList from './ContractList';
import { Contract, Player, Room } from '../backend/gameInterface';
import { useEffect, useRef, useState } from 'react';
import { Card } from '../backend/Card';
import toast, { Toaster } from 'react-hot-toast';
import Ranking from './Ranking';

const Board = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();
  const [highLightedCard, setHighLightedCard] = useState<number | undefined>(undefined);

  const cardClickCount = useRef(0);
  const selectedCardIndex = useRef<number | undefined>(undefined);

  // Identité par uid (stable après reconnexion)
  const isTheGoodPlayer: Player | undefined = GameState.gameState.players.find(
    (player) => player.uid === SocketState.uid
  );
  const isTheCurrentPlayer: Player | undefined =
    GameState.gameState.currentPlayer.uid === SocketState.uid
      ? GameState.gameState.currentPlayer
      : undefined;

  const roomId: string | undefined = GameState.roomsState.rooms.find((room: Room) =>
    room.players.find((player: Player) => player.uid === SocketState.uid)
  )?.roomId;

  const showRanking =
    GameState.gameState.ranking.length > 0 &&
    GameState.gameState.ranking.some(p => p.score !== 0);

  const availableContracts = GameState.gameState.contracts.filter(
    contract =>
      !isTheCurrentPlayer?.chosenContracts.some(cc => cc.contract.name === contract.name)
  );

  const handleCardClick = (cardIndex: number) => {
    const cardClicked: Card | undefined = isTheCurrentPlayer?.startedHand[cardIndex];
    cardClickCount.current += 1;

    if (cardClickCount.current === 1) {
      selectedCardIndex.current = cardIndex;
      setHighLightedCard(cardIndex);
    } else {
      setHighLightedCard(undefined);
      if (selectedCardIndex.current !== undefined && cardClicked) {
        SocketState.socket?.emit('card_played', {
          cardClicked,
          playerCardClicked: isTheCurrentPlayer,
        });
      }
      cardClickCount.current = 0;
      selectedCardIndex.current = undefined;
    }
  };

  const handleContractClick = (contract: Contract) => {
    if (isTheCurrentPlayer) {
      const contractIndex = GameState.gameState.contracts.indexOf(contract);
      SocketState.socket?.emit('choose_contract', {
        playerContract: isTheCurrentPlayer,
        contractIndex,
        roomId,
      });
    }
  };

  useEffect(() => {
    const socket = SocketState.socket;
    if (!socket) return;

    const handleError = (errorMessage: string) => {
      toast.error(errorMessage, {
        style: {
          background: '#1f2937',
          color: '#fafaf5',
          border: '1px solid #ef4444',
        },
        duration: 5000,
        position: 'top-center',
      });
      cardClickCount.current = 0;
      selectedCardIndex.current = undefined;
      setHighLightedCard(undefined);
    };

    socket.on('error', handleError);
    return () => { socket.off('error', handleError); };
  }, [SocketState.socket]);

  const isGameOver = GameState.gameState.isOver;

  return (
    <div className="min-h-[100dvh] bg-felt flex flex-col">
      <Toaster />

      {isGameOver && <Ranking isGameOver />}

      {!isGameOver && (
        <>
          <BoardHeader />

          <PlayedCards
            folds={GameState.gameState.currentTurn.folds}
            players={GameState.gameState.players}
          />

          {GameState.gameState.currentContract?.contract.name === 'Réussite' && (
            <ReussiteArea />
          )}

          {showRanking && <Ranking />}

          <div className="flex-1" />

          <div className="flex flex-col">
            {isTheGoodPlayer && (
              <p className="h-8 flex items-center justify-center text-card text-sm font-semibold">
                {isTheGoodPlayer.name}
                {isTheCurrentPlayer && (
                  <span className="ml-2 text-yellow-400 text-xs">● À vous</span>
                )}
              </p>
            )}

            {isTheGoodPlayer && (
              <Hand
                cards={isTheGoodPlayer.startedHand}
                highlighted={highLightedCard}
                onCardClick={isTheCurrentPlayer ? handleCardClick : () => {}}
              />
            )}

            {isTheCurrentPlayer && !GameState.gameState.currentContract && (
              <div className="min-h-[144px]">
                <ContractList
                  contracts={availableContracts}
                  onContractClick={handleContractClick}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Board;
```

- [ ] **Vérifier que le build passe**

```bash
cd /var/www/vincent/react-barbu-v3 && npm run build 2>&1 | tail -8
```

Attendu : `✓ built in` sans erreur TypeScript.

- [ ] **Commit**

```bash
git add src/components/Board.tsx
git commit -m "refactor: Board — layout mobile 100dvh, uid, PlayedCards v2"
```

---

## Task 12 : Refactoriser ListOfGames (shadcn + uid)

**Files:**
- Modify: `src/components/ListOfGames.tsx`

Remplace `react-modal` par `Dialog` shadcn. Comparaisons d'identité migrées vers `uid`. Le `socket.id` est toujours envoyé dans les events pour le backend mais n'est plus utilisé pour les conditions d'affichage.

- [ ] **Réécrire `src/components/ListOfGames.tsx`**

```tsx
import React, { useState } from 'react';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Room } from '../backend/gameInterface';

const playersBadgeVariant = (count: number): string => {
  if (count === 4) return 'bg-green-600 hover:bg-green-600 text-white';
  if (count === 3) return 'bg-yellow-600 hover:bg-yellow-600 text-white';
  if (count === 2) return 'bg-orange-500 hover:bg-orange-500 text-white';
  return 'bg-red-600 hover:bg-red-600 text-white';
};

const ListOfGames = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (SocketState.socket && pseudo.trim()) {
      SocketState.socket.emit('create_game', {
        uid: SocketState.uid,
        socketId: SocketState.socket.id,
        pseudo: pseudo.trim(),
      });
    }
    setPseudo('');
    setCreateOpen(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (SocketState.socket && pseudo.trim()) {
      SocketState.socket.emit('join_game', {
        roomId: roomIdToJoin,
        uid: SocketState.uid,
        socketId: SocketState.socket.id,
        pseudo: pseudo.trim(),
      });
      setJoinedRooms(prev => [...prev, roomIdToJoin]);
    }
    setPseudo('');
    setJoinOpen(false);
  };

  const openJoin = (roomId: string) => {
    setRoomIdToJoin(roomId);
    setJoinOpen(true);
  };

  const isInRoom = (room: Room) =>
    room.players.some(p => p.uid === SocketState.uid);

  const isCreator = (room: Room) =>
    room.players[0]?.uid === SocketState.uid;

  const rooms = GameState.roomsState.rooms;

  return (
    <div className="min-h-[100dvh] bg-felt-dark flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-card text-4xl font-serif">🃏 BARBU</h1>

      <Button
        className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
        onClick={() => setCreateOpen(true)}
      >
        + Créer une partie
      </Button>

      <div className="w-full max-w-sm">
        <Table>
          <TableCaption className="text-card/60 text-sm">
            {rooms.length === 0 ? 'Aucune partie en cours' : 'Parties disponibles'}
          </TableCaption>
          <TableHeader>
            <TableRow className="border-card/20 hover:bg-transparent">
              <TableHead className="text-card/80">Id</TableHead>
              <TableHead className="text-card/80">Joueurs</TableHead>
              <TableHead className="text-card/80">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map(room => (
              <TableRow key={room.roomId} className="border-card/10 hover:bg-card/5">
                <TableCell className="text-card font-mono text-sm">{room.name}</TableCell>
                <TableCell>
                  <Badge className={playersBadgeVariant(room.players.length)}>
                    {room.players.length}/4
                  </Badge>
                </TableCell>
                <TableCell>
                  {GameState.gameState.startedGame && isInRoom(room) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-card border-card/30 hover:bg-card/10 text-xs"
                      onClick={() =>
                        SocketState.socket?.emit('gobackgame', {
                          roomIdGoBackGame: room.roomId,
                        })
                      }
                    >
                      Revenir
                    </Button>
                  ) : isCreator(room) && room.players.length === 4 ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white text-xs"
                      onClick={() =>
                        SocketState.socket?.emit('start_game', { roomId: room.roomId })
                      }
                    >
                      Commencer
                    </Button>
                  ) : joinedRooms.includes(room.roomId) || isInRoom(room) ? (
                    <Badge variant="secondary" className="text-xs bg-card/20 text-card/70">
                      en attente…
                    </Badge>
                  ) : room.players.length < 4 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-card border-card/30 hover:bg-card/10 text-xs"
                      onClick={() => openJoin(room.roomId)}
                    >
                      Rejoindre
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog — Créer */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-felt border-card/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-card">Choisir un pseudo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <Input
              className="bg-felt-dark border-card/30 text-card placeholder:text-card/40 mb-4"
              placeholder="Pseudo"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-500 text-white w-full"
              >
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog — Rejoindre */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="bg-felt border-card/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-card">Choisir un pseudo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit}>
            <Input
              className="bg-felt-dark border-card/30 text-card placeholder:text-card/40 mb-4"
              placeholder="Pseudo"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-500 text-white w-full"
              >
                Rejoindre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListOfGames;
```

- [ ] **Vérifier le build complet**

```bash
cd /var/www/vincent/react-barbu-v3 && npm run build 2>&1 | tail -8
```

Attendu : `✓ built in` sans aucune erreur TypeScript.

- [ ] **Commit**

```bash
git add src/components/ListOfGames.tsx
git commit -m "refactor: ListOfGames — shadcn Dialog/Table/Badge, uid"
```

---

## Task 13 : Supprimer react-modal, build prod, redémarrer

**Files:**
- Modify: `package.json` (suppression react-modal)

- [ ] **Désinstaller react-modal**

```bash
cd /var/www/vincent/react-barbu-v3
npm uninstall react-modal @types/react-modal
```

- [ ] **Build production complet**

```bash
npm run build 2>&1 | tail -10
```

Attendu : `✓ built in` avec bundle JS < 350 KB gzip.

- [ ] **Redéployer nginx (pas de rebuild backend nécessaire)**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

- [ ] **Commit final**

```bash
git add package.json package-lock.json
git commit -m "refactor: supprimer react-modal — remplacé par shadcn Dialog"
git push
```

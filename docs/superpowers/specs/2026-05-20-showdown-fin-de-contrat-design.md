# Showdown fin de contrat — Design

**Date** : 2026-05-20  
**Statut** : Approuvé

---

## Objectif

Afficher un écran de célébration (confettis plein écran + nom du vainqueur/perdant) pendant 6 secondes à la fin de chaque contrat, avant de passer à la sélection du contrat suivant.

---

## Architecture

### Backend — événement `hand_result`

Dans `Game.ts / endHand()`, juste avant la réinitialisation de l'état :

1. Snapshot des scores avant `calculateHandScore` → `scoresBefore`
2. Appel `calculateHandScore` → `updatedPlayers`
3. Calcul des deltas : `scoreDelta = updatedPlayers[i].score - scoresBefore[i]`
4. Émission socket :

```ts
this.serverSocket.io.emit('hand_result', {
  contractName: string,
  winner: { name: string, scoreDelta: number } | null,
  loser:  { name: string, scoreDelta: number } | null,
  scores: { name: string, scoreDelta: number }[]
})
```

**Règles de détermination winner/loser :**
- `winner` = joueur avec le `scoreDelta` le plus élevé (le moins pénalisé ou le plus récompensé)
- `loser` = joueur avec le `scoreDelta` le plus bas (le plus pénalisé), `null` si identique à winner
- Pour Réussite : winner = finishOrder[0], loser = `null` (contrat positif)
- Si tous les deltas sont 0 (ex. "Le barbu" où personne n'a pris le roi) : winner = `null`, loser = `null`

L'événement est émis **avant** `updateGameState` de réinitialisation, pour que les clients aient les données à jour.

### Frontend — composant `HandResultOverlay`

**Nouveau fichier** : `src/components/HandResultOverlay.tsx`

Props :
```ts
interface HandResultOverlayProps {
  contractName: string
  winner: { name: string; scoreDelta: number } | null
  loser:  { name: string; scoreDelta: number } | null
  scores: { name: string; scoreDelta: number }[]
  onDone: () => void
}
```

Comportement :
- Au montage : lance `canvas-confetti` en burst (couleurs vives)
- Timer de 6 secondes avec `setTimeout` → appelle `onDone`
- Barre de progression CSS animée (6s, se vide de gauche à droite)

Structure visuelle :
```
┌─────────────────────────────────────┐
│  [overlay bg-black/70 plein écran]  │
│  [canvas confettis par-dessus]      │
│                                     │
│     [Nom du contrat — petit]        │
│                                     │
│   🏆 Alice gagne !    +100 pts      │  ← winner (vert)
│   💀 Bob prend tout   -70 pts       │  ← loser  (rouge)
│                                     │
│   Alice  +100  Bob  -70  ...        │  ← tous les scores
│                                     │
│   [████████░░░░░░░░░░░░░░░]  6s     │  ← barre progression
└─────────────────────────────────────┘
```

**Intégration dans `Board.tsx`** :
- `useEffect` sur l'événement socket `hand_result` → stocke les données dans `handResult` state local
- Rendu conditionnel : `{handResult && <HandResultOverlay ... onDone={() => setHandResult(null)} />}`
- L'overlay se pose par-dessus le board existant (pas de unmount du board)

### Dépendance

- `canvas-confetti` + `@types/canvas-confetti` ajoutés via npm

---

## Cas limites

| Cas | Comportement |
|-----|-------------|
| Tous deltas à 0 | Affiche le nom du contrat + scores, sans winner/loser |
| "Le barbu" personne n'a le roi | winner = null, loser = null |
| Reconnexion pendant les 6s | L'événement `hand_result` n'est pas rejoué — l'écran de showdown est sauté, le joueur tombe directement sur la sélection du contrat (acceptable) |
| Fin de partie (`isOver`) | `endHand` ne réinitialise pas → pas de `hand_result` émis pour la dernière manche, on va directement sur l'écran `Ranking` |

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/backend/Game.ts` | Ajout émission `hand_result` dans `endHand()` |
| `src/backend/gameInterface.ts` | Ajout type `HandResult` exporté |
| `src/components/HandResultOverlay.tsx` | Nouveau composant |
| `src/components/Board.tsx` | Écoute `hand_result`, state `handResult`, rendu conditionnel |
| `package.json` | Ajout `canvas-confetti` |

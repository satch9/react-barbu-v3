# UI Refactor — Barbu v3

**Date :** 2026-05-19  
**Scope :** Refactorisation complète de l'interface React (SPA Vite + Socket.IO) pour rendre le jeu jouable et agréable sur mobile (iPhone 11, portrait). Aucun changement backend ou logique Socket.IO.

---

## 1. Stack technique

### Installation
- **Tailwind CSS v3** : `npm install -D tailwindcss postcss autoprefixer` + `npx tailwindcss init -p`
- **shadcn/ui** : `npx shadcn@latest init` (preset Default, base color Stone)
- Composants shadcn installés : `Dialog`, `Button`, `Table`, `Badge`, `Input`
- Suppression de `src/App.css` (583 lignes → 0)
- `src/index.css` contient uniquement les directives Tailwind : `@tailwind base/components/utilities`

### Config Tailwind (`tailwind.config.js`)
```js
theme: {
  extend: {
    colors: {
      felt:      '#1a6b3c',   // vert tapis
      'felt-dark': '#134f2d', // vert tapis foncé
      card:      '#fafaf5',   // blanc cassé cartes
    }
  }
},
content: ['./index.html', './src/**/*.{ts,tsx}']
```

### Résolution alias `@`
Ajouter dans `vite.config.ts` :
```ts
resolve: { alias: { '@': '/src' } }
```
Et dans `tsconfig.json` : `"paths": { "@/*": ["./src/*"] }`

---

## 2. Layout général — mobile-first

- Conteneur racine : `min-h-[100dvh] bg-felt flex flex-col` — `100dvh` évite le bug iOS de la barre navigateur
- **Aucun scroll vertical** sur aucun écran — tout tient dans la fenêtre visible
- Toutes les dimensions sont exprimées en `px` fixes ou `h-*` Tailwind pour garantir le respect du `100dvh`

### Budget hauteur Board (iPhone 11 portrait — 812px)
| Zone | Hauteur |
|---|---|
| Header contrat | 40px |
| Zone pli joué | 112px |
| Classement (conditionnel) | auto |
| Nom joueur | 32px |
| Main ligne 1 (7 cartes) | 80px |
| Main ligne 2 (6 cartes) | 80px |
| Contrats 2×3 (conditionnel) | 144px |
| **Total** | **≤ 568px** ✓ |

---

## 3. Écran Lobby (`ListOfGames`)

### Structure
```
bg-felt-dark  min-h-[100dvh]  flex flex-col items-center justify-center p-4
  ├── Titre "🃏 BARBU"  (font-serif text-card text-4xl)
  ├── Button shadcn "+ Créer une partie"  (variant default, mb-6)
  └── Table shadcn (pleine largeur, max-w-sm)
        colonnes : Id | Joueurs | Action
```

### Détails colonnes
- **Id** : `text-card font-mono text-sm`
- **Joueurs** : `Badge` shadcn — rouge `1/4`, orange `2/4`, jaune `3/4`, vert `4/4`
- **Action** :
  - Bouton `Rejoindre` (variant outline) — visible si `players < 4` et `uid ≠ room.players[*].uid`
  - Texte `en attente…` (Badge gris) — si le joueur a déjà rejoint
  - Bouton `Commencer` (variant default vert) — visible si `players === 4` et `room.players[0].uid === SocketState.uid`
  - Bouton `Revenir à la partie` — si `gameState.startedGame`

### Comparaison identité
**Remplacement de `socketId` par `uid`** dans toutes les conditions d'affichage de `ListOfGames` et `Board`. Le `uid` est stable grâce au localStorage (implémenté dans le fix de reconnexion).

### Modales
- `Dialog` shadcn pour "Créer" et "Rejoindre"
- Contenu : `Input` pseudo + `Button` "Valider"
- Remplace les `react-modal` actuels → suppression de la dépendance `react-modal`

---

## 4. Composant `CardGame`

### Rendu
```
w-10 h-16  bg-card rounded-md shadow-md  flex flex-col justify-between p-1
  ├── valeur + couleur (top-left)  text-sm font-bold
  ├── couleur centrée              text-2xl
  └── valeur + couleur (bottom-right, rotate-180)  text-sm font-bold
```

### Couleurs
- ♥ ♦ : `text-red-600`
- ♠ ♣ : `text-gray-900`

### État sélectionné
```
ring-2 ring-yellow-400 -translate-y-2 transition-transform duration-150
```

---

## 5. Composant `Hand`

### Structure
```
flex flex-col gap-1 w-full
  ├── ligne 1 : flex justify-center gap-1  →  cartes[0..6]  (7 cartes)
  └── ligne 2 : flex justify-center gap-1  →  cartes[7..12] (6 cartes)
```

### Calcul largeur (iPhone 11 — 375px)
- 7 cartes × 40px + 6 gaps × 4px = 304px → centré sur 375px, marge 35px de chaque côté ✓

---

## 6. Composant `ContractList`

```
grid grid-cols-2 gap-2  w-full px-2
  └── Button shadcn (variant outline) × N contrats
        bg-felt-dark/60  text-card  text-sm  rounded-lg
        hover:bg-yellow-600/80  transition-colors
```

- Visible uniquement pour le dealer (`isTheCurrentPlayer`) quand `currentContract === null`
- Si tous les contrats sont joués : `<p className="text-card/70 text-sm text-center">Vous avez joué tous vos contrats.</p>`

---

## 7. Composant `Board`

### Structure flex column
```
min-h-[100dvh] bg-felt flex flex-col
  ├── BoardHeader       h-10
  ├── PlayedCards       h-28
  ├── (Ranking)         flex-none (conditionnel)
  ├── spacer            flex-1
  ├── nom joueur        h-8
  ├── Hand              (2 × h-20)
  └── ContractList      h-36 (conditionnel)
```

### `BoardHeader`
```
h-10  bg-felt-dark/80  flex items-center justify-center
  text-card text-sm font-semibold
  "Contrat : {nom} — Dealer : {pseudo}"
```

### `PlayedCards`
```
h-28  flex items-center justify-center gap-3
  └── pour chaque joueur (4 emplacements fixes) :
        flex flex-col items-center gap-1
          ├── CardGame | placeholder (border-dashed rounded-md w-10 h-16)
          └── text-xs text-card/70  (nom joueur)
```

---

## 8. Composant `Ranking`

```
bg-felt-dark/70  rounded-xl  p-3  mx-2
  ├── titre "Classement"  text-card font-semibold text-sm mb-2
  └── liste ordonnée :
        flex justify-between  text-card text-sm
        "{position}. {nom}"  |  "{score} pts"
```

Fin de partie : overlay plein écran + bouton "Nouvelle partie" (émet `gobackgame`).

---

## 9. Toasts d'erreur

Mise à jour du style dans `Board.tsx` :
```tsx
toast.error(msg, {
  style: { background: '#1f2937', color: '#fafaf5', border: '1px solid #ef4444' },
  duration: 5000,
  position: 'top-center',
})
```

---

## 10. Dépendances à supprimer

- `react-modal` → remplacé par `Dialog` shadcn

---

## 11. Fichiers modifiés

| Fichier | Action |
|---|---|
| `src/App.css` | Suppression |
| `src/index.css` | Remplacement par directives Tailwind |
| `src/App.tsx` | Classes Tailwind |
| `src/components/ListOfGames.tsx` | Refacto complet + shadcn Dialog/Table/Button/Badge |
| `src/components/Board.tsx` | Refacto complet + comparaisons uid |
| `src/components/BoardHeader.tsx` | Tailwind |
| `src/components/Hand.tsx` | 2 lignes + Tailwind |
| `src/components/CardGame.tsx` | Refacto complet |
| `src/components/ContractList.tsx` | Grid 2×3 + shadcn Button |
| `src/components/PlayedCards.tsx` | 4 emplacements fixes |
| `src/components/Ranking.tsx` | Tailwind |
| `src/components/ReussiteArea.tsx` | Tailwind |
| `tailwind.config.js` | Création |
| `postcss.config.js` | Création |
| `vite.config.ts` | Alias `@` |
| `tsconfig.json` | Paths `@` |
| `package.json` | + tailwindcss, shadcn; - react-modal |

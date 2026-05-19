# Design : Dialog réactif + Page règles

## Contexte

Deux améliorations UX liées à la création de partie et à l'onboarding des joueurs :

1. **Dialog réactif** : la taille du jeu (32 ou 52 cartes) doit être choisie en premier car elle détermine le nombre de joueurs autorisés. L'UI doit refléter cette dépendance de façon immédiate et évidente.

2. **Page règles** : une page dédiée accessible depuis le lobby, utile aux joueurs souhaitant jouer avec de vraies cartes. Elle liste les contrats et fournit les tables de distribution (quelles séries retirer selon le nombre de joueurs).

---

## Feature 1 — Dialog réactif (ListOfGames.tsx)

### Comportement

- La section "Taille du jeu" est affichée **en premier** dans le dialog.
- La section "Nombre de joueurs" est affichée **en dessous** et se met à jour immédiatement selon la taille choisie.
- **32 cartes** → boutons [2] [3] [4] (max 4). Si `maxPlayers > 4` au moment du switch, reset à 4.
- **52 cartes** → boutons [2] [3] [4] [5] [6] [7] [8] (max 8).
- Les boutons hors plage sont absents (pas désactivés), rendant la contrainte évidente.

### Règles de plage

| Taille | Joueurs min | Joueurs max |
|--------|-------------|-------------|
| 32 cartes | 2 | 4 |
| 52 cartes | 2 | 8 |

### Fichier modifié

- `src/components/ListOfGames.tsx`

---

## Feature 2 — Page règles

### Navigation

Pas de React Router — navigation par état, cohérente avec le pattern existant (`startedGame ? <Board> : <ListOfGames>`).

- Ajouter `showRules: boolean` géré localement dans `App.tsx` (ou via un state passé en prop).
- Bouton **"Règles"** dans le header de `ListOfGames`.
- Bouton **"← Retour"** en haut de la page règles.
- Rendu : `showRules ? <RulesPage /> : <ListOfGames />` (uniquement quand `!startedGame`).

### Nouveau composant

`src/components/RulesPage.tsx`

### Contenu

#### 1. Les 6 contrats

| Contrat | Objectif | Points |
|---------|----------|--------|
| Le barbu | Ne pas prendre le Roi ♥ | −70 |
| Pas de cœurs | Ne pas prendre de cœurs | −5 par cœur |
| Pas de plis | Ne pas prendre de plis | −5 par pli |
| Pas de dames | Ne pas prendre de dames | −15 par dame |
| Salade | Combiner les 4 contrats ci-dessus | cumulatif |
| Réussite | Vider sa main en premier | +100 (1er), +50 (2e) |

#### 2. Tables de distribution — 32 cartes

| Joueurs | Séries à retirer | Cartes/joueur |
|---------|-----------------|---------------|
| 2 | aucune | 16 |
| 3 | 7, 8 | 8 |
| 4 | aucune | 8 |

#### 3. Tables de distribution — 52 cartes

| Joueurs | Séries à retirer | Cartes/joueur |
|---------|-----------------|---------------|
| 2 | aucune | 26 |
| 3 | les 2 | 16 |
| 4 | aucune | 13 |
| 5 | les 2, 3, 4 | 8 |
| 6 | les 2 | 8 |
| 7 | les 2 à 7 | 4 |
| 8 | les 2 | 6 |

### Style

Cohérent avec l'existant : `bg-felt-dark`, `text-card`, composants Shadcn (Table, Badge, Button).

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/components/ListOfGames.tsx` | Réordonner sections dialog + filtrage réactif joueurs |
| `src/components/RulesPage.tsx` | Nouveau composant page règles |
| `src/App.tsx` | Ajouter `showRules` state + rendu conditionnel |

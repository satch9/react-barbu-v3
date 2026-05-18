# Logique du jeu Barbu — État de développement

> Document généré sur la base du code source de `react-barbu-v3`.  
> Il décrit toutes les situations possibles **en l'état actuel** du projet, y compris les chemins incomplets ou buggés.

---

## Table des matières

1. [Connexion et handshake](#1-connexion-et-handshake)
2. [Lobby — gestion des rooms](#2-lobby--gestion-des-rooms)
3. [Démarrage de la partie](#3-démarrage-de-la-partie)
4. [Phase de choix de contrat](#4-phase-de-choix-de-contrat)
5. [Phase de jeu — déroulement d'un pli](#5-phase-de-jeu--déroulement-dun-pli)
6. [Calcul du résultat d'un pli (par contrat)](#6-calcul-du-résultat-dun-pli-par-contrat)
7. [Fin de manche et classement](#7-fin-de-manche-et-classement)
8. [Fin de partie](#8-fin-de-partie)
9. [Déconnexion](#9-déconnexion)
10. [Situations non implémentées ou buggées](#10-situations-non-implémentées-ou-buggées)

---

## 1. Connexion et handshake

### 1.1 Nouvelle connexion

```
Client se connecte (Socket.IO)
  → serveur génère uid (UUID v4)
  → users[uid] = socket.id
  → callback(uid, socketIds[], gameState, roomsState)
  → serveur émet "user_connected" à tous les autres sockets
```

**État résultant côté client :**
- `SocketState.uid` = uid reçu
- `SocketState.players` = liste de tous les `socket.id` connectés
- `GameState.gameState` et `GameState.roomsState` initialisés depuis le serveur

### 1.2 Reconnexion

Condition : `socket.id` déjà présent dans `users` (ne peut pas se produire en pratique car Socket.IO génère un nouvel `id` à chaque connexion — ce cas est donc **mort code**).

```
Handshake reçu, socket.id déjà connu
  → uid retrouvé par recherche inverse dans users
  → callback(uid, socketIds[], gameState, roomsState)
  → aucune émission "user_connected"
```

### 1.3 Erreur de connexion

Si le backend n'est pas démarré :
- `socketService.connect()` échoue après 5 tentatives (`reconnectionAttempts: 5`)
- L'événement `reconnect_failed` déclenche `callbacks.onError("Unable to connect to the web socket")`
- Côté `Board.tsx`, l'erreur est captée par `socket.on("error", …)` et affichée via `react-hot-toast`
- **Aucun état de chargement persistant** n'est géré dans `App.tsx` (le flag `loading` passe à `false` immédiatement après le mount)

---

## 2. Lobby — gestion des rooms

### 2.1 Affichage de la liste

`ListOfGames` est affiché dès que `GameState.gameState.startedGame === false`.

```
roomsState.rooms = []
  → affiche uniquement "Aucune partie en cours" + bouton Créer

roomsState.rooms.length > 0
  → affiche le bouton Créer en haut
  → affiche chaque room dans un tableau avec nom, nb joueurs, actions
```

### 2.2 Créer une partie

```
Joueur clique "Créer"
  → modal s'ouvre (saisie pseudo)
  → submit → socket.emit("create_game", { uid, socketId, pseudo })

Serveur (handleCreateGame) :
  → Game.createRoom() : génère roomId (UUID) + roomName (6 caractères aléatoires)
  → Crée un Player (uid, name, socketId)
  → gameState.players.push(newCreator)
  → room.players.push(newCreator)
  → émet "gameState" + "roomsState" à tous

État résultant :
  → room créée avec 1 joueur
  → bouton "Rejoindre" visible pour les autres joueurs
  → bouton "en attente …" visible pour le créateur
```

**Cas particulier :** la condition `room.players[0].socketId !== SocketState.socket?.id` empêche le créateur de voir son propre bouton "Rejoindre". La room s'affiche pour lui sans action disponible tant qu'elle n'est pas pleine.

### 2.3 Rejoindre une partie

```
Joueur clique "Rejoindre"
  → stocke roomId dans joinedRoom[] (état local)
  → modal s'ouvre (saisie pseudo)
  → submit → socket.emit("join_game", { roomId, uid, socketId, pseudo })

Serveur (handleJoinGame) :
  → retrouve la room par roomId
  → crée un Player
  → gameState.players.push(newPlayer)
  → room.players.push(newPlayer)
  → socket.join(roomId) — le socket rejoint la room Socket.IO
  → émet "gameState" + "roomsState" à tous

État résultant :
  → room contient N+1 joueurs
  → le joueur qui vient de rejoindre voit "en attente …"
```

**Cas "room introuvable" :** log serveur, aucune réponse au client (pas d'émission d'erreur).

### 2.4 Démarrer la partie (4 joueurs)

Condition côté client pour afficher le bouton "Commencer" :
```
room.players.length === 4
AND room.players[0].socketId === SocketState.socket?.id
```

Seul le **premier joueur** (créateur) peut démarrer.

```
socket.emit("start_game", { roomId })
→ serveur gère dans handleStartGame
→ voir §3
```

### 2.5 Revenir à une partie en cours

Bouton "Revenir à la partie" s'affiche quand :
```
GameState.gameState.startedGame === true
AND la condition "Commencer" n'est pas remplie
```

```
socket.emit("gobackgame", { roomIdGoBackGame })

Serveur (handleGoBackGame) :
  → retrouve la room
  → log "Room found"
  → aucune action supplémentaire (incomplet)
  → émet "gameState" + "roomsState"
```

**État résultant :** aucun changement d'état — fonctionnalité non implémentée.

---

## 3. Démarrage de la partie

```
Serveur (Game.startGame) :
  1. deck.shuffle()          → mélange les 52 cartes (Fisher-Yates)
  2. deck.dealCardsToPlayers → 13 cartes par joueur, triées par customCompare
  3. Synchronise startedHand dans gameState.players
  4. Tire un index aléatoire [0–3] → dealer (currentPlayer)
  5. startingPlayer = players[(dealerIndex + 1) % 4]
  6. currentTurn = { dealer, startingPlayer, folds: [] }
  7. startedGame = true

Serveur émet :
  → "started_game" (déclenche GAME_STARTED: true côté client)
  → "gameState" + "roomsState"
```

**Affichage résultant :**
- `App.tsx` bascule de `<ListOfGames>` vers `<Board>`
- La main de chaque joueur est visible uniquement pour lui (`isTheGoodPlayer`)
- Le dealer est `currentPlayer` — c'est lui qui choisit le contrat en premier

---

## 4. Phase de choix de contrat

### Condition d'affichage

```tsx
// Board.tsx:168
(isTheCurrentPlayer && GameState.gameState.currentRound === 0)
```

La liste des contrats n'est visible que pour `currentPlayer` **et uniquement au round 0** (avant tout choix). Dès qu'un contrat est choisi, `currentRound` passe à 1 et la liste disparaît — voir §10.

### Les 6 contrats disponibles

| # | Nom | Valeur | maxNumberOfTurns | Description |
|---|-----|--------|-----------------|-------------|
| 0 | Le barbu | -70 | 0 | Le joueur qui prend le roi de cœur perd 70 pts |
| 1 | Pas de coeurs | -5 | 13 | -5 pts par cœur pris |
| 2 | Pas de plis | -5 | 13 | -5 pts par pli pris |
| 3 | Pas de dames | -15 | 0 | -15 pts par dame prise |
| 4 | Salade | [-70,-5,-5,-15] | 13 | Combinaison des 4 contrats précédents |
| 5 | Réussite | [100,50] | 0 | 100 pts au 1er sans cartes, 50 pts au 2e |

### Flux du choix

```
currentPlayer clique sur un contrat
  → handleContractClick → socket.emit("choose_contract", {
      playerContract: isTheCurrentPlayer,
      contractIndex,
      roomId
    })

Serveur (handleChooseContract) :
  1. chooseContract(p, contractIndex, roomId)
     → currentContract = { player, contract, successful: false }
     → room.currentContract mis à jour
  2. updateChosenContracts(p, contractIndex)
     → player.chosenContracts.push(newChosenContract)
     → currentPlayer.chosenContracts mis à jour
     → currentRound += 1  ← BUG (voir §10)
  3. nextPlayer()
     → currentPlayer = players[(currentIndex + 1) % 4]
     → room.players : isPlaying basculé sur le suivant
  4. émet "gameState" + "roomsState"
```

**État résultant :**
- `currentContract` contient le contrat choisi
- `BoardHeader` s'affiche : "X a choisi le contrat : Y / C'est à Z de poser sa carte"
- `ContractList` disparaît (currentRound !== 0)
- Le jeu de cartes devient interactif pour le premier joueur à poser

---

## 5. Phase de jeu — déroulement d'un pli

### Identification du joueur actif

```tsx
// Board.tsx
isTheGoodPlayer    = players.find(p => p.socketId === socket.id)
isTheCurrentPlayer = currentPlayer.socketId === socket.id ? currentPlayer : undefined
```

Seul `isTheCurrentPlayer` peut jouer une carte (le handler `onCardClick` est no-op pour les autres).

### Mécanique de clic sur une carte

Logique à **deux clics** — implémentée avec des variables `let` (bug — voir §10) :

```
1er clic sur une carte :
  → cardIndex mis en surbrillance (highlighted)
  → carte mémorisée dans selectedCardIndex

2e clic (sur n'importe quelle carte du composant Hand) :
  → socket.emit("card_played", { cardClicked, playerCardClicked })
  → surbrillance retirée
```

### Traitement serveur (Game.cardPlayed)

```
Serveur reçoit card_played :
  1. playerIndex = findPlayerIndexByName(playerClickedCards.name)
  2. validateCardPlay(cardClicked, playerClickedCards, currentTurn)
     → Si une carte a déjà été jouée dans le pli (folds[0] !== undefined)
       ET le joueur a des cartes de la même couleur
       ET il joue une couleur différente
       → throw CustomError("Vous devez jouer la même couleur que la première carte jouée")
       → émet "error" à la room → toast.error() côté client
  3. updatePlayerState(player, cardClicked)
     → player.startedHand.filter(≠ cardClicked)  ← retire la carte jouée
     → player.myFoldsDuringTurn.push(cardClicked)
  4. updateRoomsStateAfterPlay(playerIndex, cardClicked)
     → même opération sur room.players[playerIndex]
  5. updatedCurrentTurnFolds[playerIndex] = cardClicked
     → tableau de taille MAX_PLAYERS (4), initialisé à null

Cas A — pli incomplet (< 4 cartes) :
  → gameState.currentTurn.folds = updatedCurrentTurnFolds
  → nextPlayer() → passage au joueur suivant

Cas B — pli complet (4 cartes) :
  → updatedCurrentTurnFolds.sort(customCompare)
  → calculateTurnResult(sortedIndexedFolds)
```

### Ordre de jeu dans un pli

L'ordre suit `currentPlayer → nextPlayer()` de façon cyclique, indexé sur `players[]`. Le `startingPlayer` défini au lancement n'est **pas utilisé** pour forcer l'ordre du 1er pli.

---

## 6. Calcul du résultat d'un pli (par contrat)

### Dispatcher (calculateTurnResult)

```typescript
// Seul "Le barbu" est traité — les autres contrats n'ont pas de calcul de fin de pli
if (currentContract.contract.name === 'Le barbu') {
    if (hasKingOfHearts) {
        → Contracts.calculateScore(...)  // attribution de points
    }
    // Toujours appelé, roi présent ou non :
    nextRound()
    nextDealer()
}
// Pour tous les autres contrats : aucun traitement → le pli est ignoré
```

### 6.1 Le barbu (-70 pts)

Le score est attribué uniquement si le **roi de cœur (♥K)** est dans le pli.

**Point 1 — Toutes les cartes sont des cœurs, la plus haute est ♥K :**
```
player.myFoldsDuringTurn.every(suit === '♥')
AND myFoldsDuringTurn[0].value === 'K'
→ player.score += -70
```

**Point 2 — Toutes les cartes sont des cœurs, la plus haute n'est PAS ♥K mais ♥K est présent :**
```
myFoldsDuringTurn.every(suit === '♥')
AND myFoldsDuringTurn[0].value !== 'K'
AND myFoldsDuringTurn.some(suit === '♥' AND value === 'K')
→ cherche le joueur avec la carte de cœur la plus haute
→ highestCardPlayer.score += -70
```

⚠️ La comparaison de valeur `playerHighestCard.value > highestCard.value` est une comparaison de chaînes (`'K' > 'J'` = true), pas un ordre de jeu réel.

**Point 3 — ♥K est dans le pli mais 3 cartes ne sont pas des cœurs :**
```
myFoldsDuringTurn.some(suit === '♥' AND value === 'K')
AND filter(suit === '♥').length === 1
AND filter(suit !== '♥').length === 3
AND myFoldsDuringTurn[0].value !== 'K'
→ même logique que Point 2 pour attribuer les points
```

**Point 4 — Aucune carte n'est un cœur :**
```
myFoldsDuringTurn.every(suit !== '♥')
→ console.log("point4")  ← non implémenté
→ aucun point attribué
```

### 6.2 Pas de coeurs (-5 pts par cœur)

```
Appelable via calculateScore() mais jamais déclenché depuis calculateTurnResult()

Logique prévue :
  Pour currentPlayer uniquement :
    numberOfPlis = count(myFoldsDuringTurn où suit === '♥')
    score += -5 * numberOfPlis
```

### 6.3 Pas de plis (-5 pts par pli)

```
Jamais déclenché depuis calculateTurnResult()

Logique prévue :
  Pour currentPlayer uniquement :
    numberOfPlis = floor(myFoldsDuringTurn.length / 4)  (+1 si reste)
    score += -5 * numberOfPlis
```

### 6.4 Pas de dames (-15 pts par dame)

```
Jamais déclenché depuis calculateTurnResult()

Logique prévue :
  Pour currentPlayer uniquement :
    numberOfDames = count(myFoldsDuringTurn où value === 'Q')
    score += -15 * numberOfDames
```

### 6.5 Salade (combinaison)

```
Jamais déclenché depuis calculateTurnResult()

Logique prévue :
  Pour currentPlayer uniquement :
    kingOfHearts = count(suit === '♥' AND value === 'K')
    numberOfCoeurs = count(suit === '♥')
    numberOfDames = count(value === 'Q')
    score += (-70 * kingOfHearts) + (-5 * numberOfCoeurs) + (-5 * numberOfDames)

⚠️ numberOfPlis est déclaré mais jamais calculé (reste à 0)
```

### 6.6 Réussite (+100 / +50 pts)

```
Jamais déclenché depuis calculateTurnResult()

Logique prévue :
  Pour currentPlayer uniquement :
    numberOfPlayersWithNoCards = count(players où startedHand.length === 0)
    Si === 1 → score += 100
    Si === 2 → score += 50
```

---

## 7. Fin de manche et classement

### nextRound()

Appelé uniquement depuis `calculateTurnResult` après un pli du contrat "Le barbu".

```
Si isOver === true :
  → endGame()   (isOver n'est jamais true → chemin inaccessible)
Sinon :
  → currentRound += 1
  → calculateRanking()
  → rooms : isGameInProgress = false, isPlaying = false, startedHand = []
```

### nextDealer()

```
Appelé juste après nextRound() :
  → currentDealerIndex = index du dealer actuel dans players[]
  → nextDealerIndex = (currentDealerIndex + 1) % 4
  → currentTurn.dealer = players[nextDealerIndex]
  → currentTurn.startingPlayer = players[(nextDealerIndex + 1) % 4]
  → currentPlayer = players[nextDealerIndex]
  → room.players : isPlaying basculé
```

### calculateRanking()

```
players.sort() par score décroissant (tri en place — mute players[])
ranking = players.map avec position = index + 1
gameState.ranking = ranking
```

**Affichage :** `<Ranking>` s'affiche dans `Board` dès que `player.score !== 0` pour au moins un joueur.

---

## 8. Fin de partie

### endGame()

```
Appelé depuis nextRound() si isOver === true
(isOver n'est jamais mis à true → cette fonction n'est jamais appelée)

Logique prévue :
  → currentRound = 0
  → rooms : isOver = true
```

**Situation actuelle :** la partie ne se termine jamais. Après le premier pli du Barbu résolu, le jeu relance un cycle dealer → mais la liste de contrats ne réapparaît pas (currentRound !== 0), rendant la partie bloquée.

---

## 9. Déconnexion

```
socket.on("disconnect")
  → uid retrouvé via getUidFromSocketID(socket.id)
  → delete users[uid]
  → émet "user_disconnected" (uid) à tous

Côté client :
  → SocketDispatch REMOVE_USER : retire l'uid de players[]
  → Aucune mise à jour de gameState.players (isDisconnected reste false)
  → Si la partie était en cours : elle continue normalement côté serveur
    (le joueur déconnecté a toujours ses cartes, le pli peut se bloquer)
```

---

## 10. Situations non implémentées ou buggées

### 10.1 La liste des contrats disparaît définitivement après le 1er choix

**Cause :** `currentRound` est incrémenté dans `updateChosenContracts()` à chaque choix.  
**Effet :** La condition `currentRound === 0` dans `Board.tsx:168` devient fausse dès le 2e round — aucun joueur ne peut plus choisir de contrat.

### 10.2 La mécanique de double-clic est cassée

**Cause :** `cardClickCount` et `selectedCardIndex` sont des `let` dans le corps du composant React. Ils sont réinitialisés à chaque rendu.  
**Effet :** La première sélection (surbrillance) fonctionne, mais le 2e clic peut ne pas déclencher l'émission si un rendu intermédiaire a eu lieu.

### 10.3 Seul "Le barbu" déclenche un calcul de score

Les 5 autres contrats (`Pas de coeurs`, `Pas de plis`, `Pas de dames`, `Salade`, `Réussite`) ont leurs fonctions de calcul implémentées dans `Contracts.ts`, mais `calculateTurnResult` ne les appelle jamais (seul `'Le barbu'` a un `case` dans le `if`).

### 10.4 "Le barbu" — Point 4 non implémenté

Quand aucune carte du pli n'est un cœur, aucun point n'est attribué (TODO `console.log("point4")`).

### 10.5 La partie ne se termine jamais

`gameState.isOver` n'est jamais passé à `true` — `endGame()` est inaccessible.

### 10.6 Un seul Game global pour toutes les rooms

`ServerSocket` instancie un unique `Game`. Si deux rooms jouent simultanément, elles partagent le même `gameState`, ce qui provoque des interférences.

### 10.7 "Revenir à la partie" ne fait rien

`handleGoBackGame` dans `Game.ts` se contente de logger "Room found". Aucune transition d'écran n'est déclenchée.

### 10.8 Sécurité — actions non vérifiées côté serveur

N'importe quel client peut émettre `card_played` avec `playerCardClicked` pointant vers un autre joueur. Le serveur n'utilise que `players.find(name === ...)` sans vérifier que le socket émetteur est bien ce joueur.

### 10.9 `startingPlayer` non utilisé pour l'ordre du 1er pli

`currentTurn.startingPlayer` est défini mais l'ordre de jeu est piloté uniquement par `nextPlayer()` (rotation circulaire depuis `currentPlayer`). Le joueur qui devrait commencer (le suivant du dealer) ne commence pas forcément.

### 10.10 Ordre du tri dans Deck.sort()

```typescript
// Deck.ts:43 — tri par localeCompare sur value
a.value.localeCompare(b.value)
// Résultat : '10' < '2' < '3' … (ordre lexicographique)
// Correct à utiliser : customCompare (déjà utilisé dans dealCardsToPlayers)
```

### 10.11 Pas de gestion du cas "room pleine à rejoindre"

Si un joueur émet `join_game` sur une room déjà à 4 joueurs, le serveur l'ajoute quand même (pas de vérification `players.length < MAX_PLAYERS`).

---

## Récapitulatif des états UI possibles

| Condition | Composant affiché |
|---|---|
| `startedGame === false` | `ListOfGames` |
| `startedGame === true` | `Board` |
| `currentContract !== null` | `BoardHeader` |
| `currentTurn.folds.length > 0` | `PlayedCards` |
| `currentContract.name === "Réussite"` | `ReussiteArea` |
| `isTheGoodPlayer !== undefined` | `Hand` (main du joueur) |
| `isTheCurrentPlayer && currentRound === 0` | `ContractList` |
| `players.some(score !== 0)` | `Ranking` |

---

## Récapitulatif des événements Socket.IO

### Client → Serveur

| Événement | Payload | Effet |
|---|---|---|
| `handshake` | callback | Reçoit uid, players, gameState, roomsState |
| `create_game` | { uid, socketId, pseudo } | Crée room + joueur |
| `join_game` | { uid, socketId, pseudo, roomId } | Rejoint room |
| `start_game` | { roomId } | Distribue les cartes, démarre |
| `choose_contract` | { playerContract, contractIndex, roomId } | Choisit contrat + passe au suivant |
| `card_played` | { cardClicked, playerCardClicked } | Joue une carte dans le pli |
| `gobackgame` | { roomIdGoBackGame } | Aucun effet (non implémenté) |
| `message` | string | Broadcast aux autres |

### Serveur → Client

| Événement | Payload | Traitement |
|---|---|---|
| `user_connected` | string[] | UPDATE_USERS |
| `user_disconnected` | uid | REMOVE_USER |
| `gameState` | GameState | SET_GAME_STATE |
| `roomsState` | RoomsState | SET_ROOMS_STATE |
| `started_game` | — | GAME_STARTED: true |
| `error` | string | toast.error() |

# Spec : Validation du choix de contrat (double-clic et tour invalide)

## Problème

Un joueur peut choisir deux contrats de suite en cliquant rapidement avant que la mise à jour du serveur n'arrive côté client. Aucune validation n'existe côté serveur pour rejeter un choix si une manche est déjà en cours ou si ce n'est pas le tour du joueur.

## Objectif

Garantir qu'un joueur ne peut choisir qu'un seul contrat par tour, en protégeant à la fois la logique métier (serveur) et l'interface (client).

---

## Architecture

### Côté serveur — `src/backend/socket.ts` › `handleChooseContract`

Ajouter deux gardes au début du handler, avant tout appel à `game.chooseContract()` :

1. **Manche déjà en cours** : si `this.game.gameState.currentContract !== null`, rejeter.
2. **Mauvais joueur** : si `playerContract.uid !== this.game.gameState.currentPlayer.uid`, rejeter.

En cas de rejet, émettre une erreur ciblée au socket demandeur via le mécanisme `handleError` existant (ou `socket.emit('error', message)`).

Ces deux conditions sont suffisantes ; aucune autre logique n'est modifiée.

### Côté client — `src/components/Board.tsx`

Ajouter un état local `isSubmittingContract` (booléen, `false` par défaut).

- Dans `handleContractClick` : passer à `true` immédiatement avant l'`emit`.
- Condition d'affichage de `ContractList` : ajouter `&& !isSubmittingContract` à la condition existante `isTheCurrentPlayer && !currentContract`.
- Remettre à `false` dans l'`useEffect` qui réagit à `currentPlayerUid` (déjà présent pour les toasts), ce qui correspond à la réception de la mise à jour d'état serveur.

Ce verrou est purement cosmétique/UX ; la validation serveur reste la vraie protection.

---

## Flux après correction

```
Joueur clique sur un contrat
  → isSubmittingContract = true (UI désactivée immédiatement)
  → socket.emit('choose_contract', ...)
  → Serveur : currentContract null ? currentPlayer correct ? → OK
  → chooseContract() + updateChosenContracts() + nextPlayer()
  → updateGameStateAndRoomState()
  → Client reçoit le nouvel état → useEffect se déclenche
  → isSubmittingContract = false (UI réactivée pour le prochain joueur)
```

---

## Ce qui ne change pas

- La logique `nextPlayer()` et `nextDealer()` n'est pas modifiée.
- La condition `availableContracts` (filtrage des contrats déjà joués) reste inchangée.
- La fin de partie (`newRound >= players.length * Contracts.CONTRACTS.length`) reste inchangée.

---

## Tests manuels

- Cliquer deux fois rapidement sur deux contrats différents → seul le premier est pris en compte.
- Tenter d'émettre `choose_contract` depuis la console alors que `currentContract` est déjà défini → le serveur rejette avec une erreur.
- Le tour passe correctement au joueur suivant après un choix valide.

# Validation du choix de contrat — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empêcher un joueur de choisir deux contrats de suite (double-clic ou émission rapide) en validant côté serveur et en verrouillant l'UI côté client.

**Architecture:** Deux gardes ajoutées dans `handleChooseContract` (socket.ts) rejettent tout choix si une manche est déjà en cours ou si ce n'est pas le tour du joueur. Un état local `isSubmittingContract` dans Board.tsx masque la liste des contrats dès le premier clic et se remet à false à la prochaine mise à jour d'état.

**Tech Stack:** TypeScript, React (useState/useEffect), Socket.IO

---

## Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/backend/socket.ts` (L.114-126) | Ajouter 2 gardes dans `handleChooseContract` |
| `src/components/Board.tsx` (L.18, L.74-83, L.219-226) | Ajouter état `isSubmittingContract` + l'utiliser dans la condition d'affichage et le handler |

---

## Tâche 1 : Validation serveur dans `handleChooseContract`

**Fichiers :**
- Modifier : `src/backend/socket.ts:114-126`

- [ ] **Étape 1 : Ajouter les deux gardes dans `handleChooseContract`**

Remplacer le handler existant (L.114-126) par :

```typescript
handleChooseContract({ playerContract, contractIndex, roomId }: { playerContract: Player, contractIndex: number, roomId: string }) {
    // Rejeter si une manche est déjà en cours
    if (this.game.gameState.currentContract !== null) {
        this.io.to(playerContract.socketId).emit('error', 'Un contrat est déjà en cours.');
        return;
    }

    // Rejeter si ce n'est pas le tour de ce joueur
    if (playerContract.uid !== this.game.gameState.currentPlayer.uid) {
        this.io.to(playerContract.socketId).emit('error', "Ce n'est pas votre tour.");
        return;
    }

    this.game.chooseContract(playerContract, contractIndex, roomId);
    this.game.updateChosenContracts(playerContract, contractIndex);

    // Pour la Réussite, le dealer reste actif jusqu'à ce qu'il annonce la valeur.
    // Pour les autres contrats, on passe au joueur suivant immédiatement.
    const isReussite = this.game.gameState.currentContract?.contract.name === 'Réussite';
    if (!isReussite) {
        this.game.nextPlayer();
    }

    this.updateGameStateAndRoomState();
}
```

- [ ] **Étape 2 : Vérifier la compilation TypeScript**

```bash
cd /var/www/vincent/react-barbu-v3/src/backend && npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/backend/socket.ts
git commit -m "feat(contrats): rejeter choix invalide côté serveur (double-clic, mauvais tour)"
```

---

## Tâche 2 : Verrou UI dans `Board.tsx`

**Fichiers :**
- Modifier : `src/components/Board.tsx:18, 74-83, 219-226`

- [ ] **Étape 1 : Ajouter l'état `isSubmittingContract`**

À la ligne 18, ajouter `isSubmittingContract` à la déclaration des états existants :

```typescript
const [highLightedCard, setHighLightedCard] = useState<number | undefined>(undefined);
const [isSubmittingContract, setIsSubmittingContract] = useState(false);
```

- [ ] **Étape 2 : Activer le verrou dans `handleContractClick`**

Remplacer `handleContractClick` (L.74-83) par :

```typescript
const handleContractClick = (contract: Contract) => {
    if (isTheCurrentPlayer && !isSubmittingContract) {
      const contractIndex = GameState.gameState.contracts.indexOf(contract);
      setIsSubmittingContract(true);
      SocketState.socket?.emit('choose_contract', {
        playerContract: isTheCurrentPlayer,
        contractIndex,
        roomId,
      });
    }
  };
```

- [ ] **Étape 3 : Remettre le verrou à false en cas d'erreur serveur**

Dans le handler `handleError` à l'intérieur du deuxième `useEffect` (L.116-129), ajouter `setIsSubmittingContract(false)` :

```typescript
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
  setIsSubmittingContract(false);
  cardClickCount.current = 0;
  selectedCardIndex.current = undefined;
  setHighLightedCard(undefined);
};
```

> **Pourquoi :** si le serveur rejette le choix (erreur), `currentPlayerUid` ne change pas et le verrou resterait bloqué à `true` sans cette ligne.

- [ ] **Étape 4 : Remettre le verrou à false lors du changement de joueur courant**

Dans l'`useEffect` existant qui réagit à `currentPlayerUid` (L.92-110), ajouter `setIsSubmittingContract(false)` au début du callback, avant les conditions de retour :

```typescript
useEffect(() => {
    setIsSubmittingContract(false);
    if (!currentPlayerUid || currentPlayerUid === prevCurrentPlayerUid.current) return;
    prevCurrentPlayerUid.current = currentPlayerUid;
    if (!currentPlayerName) return;

    if (currentPlayerUid === SocketState.uid) {
      toast('🎴 À vous de jouer !', {
        style: { background: '#1a6b3c', color: '#fafaf5', border: '1px solid #facc15' },
        duration: 2000,
        position: 'top-center',
      });
    } else {
      toast(`Tour de ${currentPlayerName}`, {
        style: { background: '#1f2937', color: '#fafaf5' },
        duration: 2000,
        position: 'top-center',
      });
    }
  }, [currentPlayerUid, currentPlayerName, SocketState.uid]);
```

- [ ] **Étape 5 : Utiliser le verrou dans la condition d'affichage de `ContractList`**

Remplacer la condition L.219 :

```typescript
{isTheCurrentPlayer && !currentContract && !isSubmittingContract && (
  <div className="min-h-[144px]">
    <ContractList
      contracts={availableContracts}
      onContractClick={handleContractClick}
    />
  </div>
)}
```

- [ ] **Étape 6 : Vérifier la compilation TypeScript**

```bash
cd /var/www/vincent/react-barbu-v3 && npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Étape 7 : Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat(contrats): verrouiller l'UI après le premier clic sur un contrat"
```

---

## Tests manuels

Une fois les deux tâches implémentées, tester les scénarios suivants :

1. **Double-clic rapide** — cliquer deux fois très rapidement sur deux contrats différents → seul le premier est accepté, aucun toast d'erreur visible si le verrou UI fonctionne.

2. **Émission directe depuis la console** (test du garde serveur) — ouvrir la DevTools et exécuter :
   ```js
   // Alors qu'un contrat est déjà en cours
   socket.emit('choose_contract', { playerContract: window.__myPlayer, contractIndex: 0, roomId: '...' })
   ```
   → Toast d'erreur rouge « Un contrat est déjà en cours. » doit apparaître.

3. **Rotation normale** — chaque joueur choisit son contrat à tour de rôle ; le tour passe correctement après chaque choix.

4. **Réussite** — le dealer annonce la valeur avant que le tour passe ; le verrou se lève correctement après l'annonce.

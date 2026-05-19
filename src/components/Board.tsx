import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import BoardHeader from './BoardHeader';
import PlayedCards from './PlayedCards';
import ReussiteArea from './ReussiteArea';
import ReussiteAnnouncePicker from './ReussiteAnnouncePicker';
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
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  const cardClickCount = useRef(0);
  const selectedCardIndex = useRef<number | undefined>(undefined);
  const prevCurrentPlayerUid = useRef<string>('');

  // Identité par uid (stable après reconnexion)
  const isTheGoodPlayer: Player | undefined = GameState.gameState.players.find(
    (player) => player.uid === SocketState.uid
  );
  const isTheCurrentPlayer: Player | undefined =
    GameState.gameState.currentPlayer.uid === SocketState.uid
      ? GameState.gameState.currentPlayer
      : undefined;

  const room = GameState.roomsState.rooms.find((r: Room) =>
    r.players.find((player: Player) => player.uid === SocketState.uid),
  );
  const roomId = room?.roomId;
  const deckSize: 32 | 52 = room?.deckSize ?? 52;

  const currentContract = GameState.gameState.currentContract;
  const isReussite = currentContract?.contract.name === 'Réussite';
  const reussite = GameState.gameState.reussite;
  const needsAnnounce = isReussite && reussite && reussite.announcedValue === null;
  const isDealer = isTheCurrentPlayer && currentContract?.player.uid === SocketState.uid;

  const showRanking =
    GameState.gameState.ranking.length > 0 &&
    GameState.gameState.ranking.some(p => p.score !== 0);

  const availableContracts = GameState.gameState.contracts.filter(
    contract =>
      !isTheCurrentPlayer?.chosenContracts.some(cc => cc.contract.name === contract.name),
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

  const handleAnnounce = (value: string) => {
    SocketState.socket?.emit('announce_reussite', { value });
  };

  // Toast "À qui est le tour" quand le joueur courant change
  const currentPlayerUid = GameState.gameState.currentPlayer.uid;
  const currentPlayerName = GameState.gameState.currentPlayer.name;
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
      setIsSubmittingContract(false);
      cardClickCount.current = 0;
      selectedCardIndex.current = undefined;
      setHighLightedCard(undefined);
    };

    const handlePlayerPassed = ({ name }: { uid: string; name: string }) => {
      toast(`${name} a passé son tour`, {
        icon: '⏭️',
        style: { background: '#1f2937', color: '#fafaf5' },
        duration: 2500,
        position: 'top-center',
      });
    };

    const handlePlayerBonus = () => {
      toast('As posé — rejoue !', {
        icon: '🂡',
        style: {
          background: '#1f2937',
          color: '#fafaf5',
          border: '1px solid #facc15',
        },
        duration: 2500,
        position: 'top-center',
      });
    };

    socket.on('error', handleError);
    socket.on('player_passed', handlePlayerPassed);
    socket.on('player_bonus', handlePlayerBonus);
    return () => {
      socket.off('error', handleError);
      socket.off('player_passed', handlePlayerPassed);
      socket.off('player_bonus', handlePlayerBonus);
    };
  }, [SocketState.socket]);

  const isGameOver = GameState.gameState.isOver;

  // Cartes jouables pour le joueur courant (Réussite uniquement, fourni par le serveur).
  // Pendant la phase d'annonce, aucune carte n'est jouable.
  const playableIndices = needsAnnounce
    ? []
    : isReussite && isTheCurrentPlayer
      ? GameState.gameState.playableCardIndices
      : undefined;

  return (
    <div className="min-h-[100dvh] bg-felt flex flex-col">
      <Toaster />

      {isGameOver && <Ranking isGameOver />}

      {!isGameOver && (
        <>
          <BoardHeader />

          {isReussite && reussite ? (
            <ReussiteArea chains={reussite.chains} deckSize={deckSize} />
          ) : (
            <PlayedCards
              folds={GameState.gameState.currentTurn.folds}
              players={GameState.gameState.players}
            />
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
                playableIndices={playableIndices}
              />
            )}

            {needsAnnounce && isDealer && (
              <ReussiteAnnouncePicker deckSize={deckSize} onAnnounce={handleAnnounce} />
            )}

            {isTheCurrentPlayer && !currentContract && !isSubmittingContract && (
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

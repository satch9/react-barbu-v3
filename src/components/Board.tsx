import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import BoardHeader from './BoardHeader';
import PlayedCards from './PlayedCards';
import ReussiteArea from './ReussiteArea';
import ReussiteAnnouncePicker from './ReussiteAnnouncePicker';
import Hand from './Hand';
import ContractList from './ContractList';
import { Contract, Player, Room, HandResult } from '../backend/gameInterface';
import HandResultOverlay from './HandResultOverlay';
import { useEffect, useRef, useState } from 'react';
import { Card } from '../backend/Card';
import toast, { Toaster } from 'react-hot-toast';
import Ranking from './Ranking';
import { getLiveHandScore, formatLiveScore, liveScoreColor } from '../utils/liveScore';

const Board = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();
  const [highLightedCard, setHighLightedCard] = useState<number | undefined>(undefined);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [handResult, setHandResult] = useState<HandResult | null>(null);

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

  const players = GameState.gameState.players;
  const numPlayers = players.length;

  // Score live de la manche en cours pour chaque joueur
  const liveScores: (number | null)[] = players.map(p =>
    getLiveHandScore(p, currentContract, numPlayers)
  );
  const liveScoreMap: Record<string, number | null> = Object.fromEntries(
    players.map((p, i) => [p.uid, liveScores[i]])
  );

  // Score live du joueur courant (pour affichage en bas)
  const myLiveScore = isTheGoodPlayer
    ? getLiveHandScore(isTheGoodPlayer, currentContract, numPlayers)
    : null;
  const myLiveScoreStr = formatLiveScore(myLiveScore);

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

  const isGameOver = GameState.gameState.isOver;

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
    if (isGameOver) setHandResult(null);
  }, [isGameOver]);

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

    const handleHandResult = (result: HandResult) => {
      setHandResult(result);
    };

    socket.on('error', handleError);
    socket.on('player_passed', handlePlayerPassed);
    socket.on('player_bonus', handlePlayerBonus);
    socket.on('hand_result', handleHandResult);
    return () => {
      socket.off('error', handleError);
      socket.off('player_passed', handlePlayerPassed);
      socket.off('player_bonus', handlePlayerBonus);
      socket.off('hand_result', handleHandResult);
    };
  }, [SocketState.socket]);

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

      {handResult && (
        <HandResultOverlay
          result={handResult}
          onDone={() => setHandResult(null)}
        />
      )}

      {isGameOver && <Ranking isGameOver />}

      {!isGameOver && (
        <>
          <BoardHeader onScoreClick={() => setShowScoreSheet(true)} />

          {showScoreSheet && (
            <Ranking onClose={() => setShowScoreSheet(false)} liveScores={liveScoreMap} />
          )}

          {isReussite && reussite ? (
            <ReussiteArea chains={reussite.chains} deckSize={deckSize} />
          ) : (
            <PlayedCards
              folds={GameState.gameState.currentTurn.folds}
              players={players}
            />
          )}

          <div className="flex-1" />

          <div className="flex flex-col">
            {isTheGoodPlayer && (
              <p className="h-8 flex items-center justify-center text-card text-sm font-semibold gap-2">
                {isTheGoodPlayer.name}
                {myLiveScoreStr !== null && (
                  <span className={`font-mono text-xs font-semibold ${liveScoreColor(myLiveScore)}`}>
                    {myLiveScoreStr}
                  </span>
                )}
                {isTheCurrentPlayer && (
                  <span className="text-yellow-400 text-xs">● À vous</span>
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

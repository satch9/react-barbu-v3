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

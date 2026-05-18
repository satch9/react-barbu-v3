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

    // useRef pour la mécanique double-clic (persist entre les rendus)
    const cardClickCount = useRef(0);
    const selectedCardIndex = useRef<number | undefined>(undefined);

    const isTheGoodPlayer: Player | undefined = GameState.gameState.players.find(
        (player) => player.socketId === SocketState.socket?.id
    );
    const isTheCurrentPlayer: Player | undefined =
        GameState.gameState.currentPlayer.socketId === SocketState.socket?.id
            ? GameState.gameState.currentPlayer
            : undefined;

    const roomId: string | undefined = GameState.roomsState.rooms.find((room: Room) =>
        room.players.find((player: Player) => player.socketId === SocketState.socket?.id)
    )?.roomId;

    const numberOfFolds = GameState.gameState.currentTurn?.folds.filter(Boolean).length ?? 0;

    const showRanking = GameState.gameState.ranking.length > 0 && GameState.gameState.ranking.some(p => p.score !== 0);

    // Filtre les contrats déjà choisis par le joueur courant
    const availableContracts = GameState.gameState.contracts.filter(
        contract => !isTheCurrentPlayer?.chosenContracts.some(cc => cc.contract.name === contract.name)
    );

    const handleCardClick = (cardIndex: number) => {
        const cardClicked: Card | undefined = isTheCurrentPlayer?.startedHand[cardIndex];

        cardClickCount.current += 1;

        if (cardClickCount.current === 1) {
            // Premier clic : sélectionne la carte
            selectedCardIndex.current = cardIndex;
            setHighLightedCard(cardIndex);
        } else {
            // Deuxième clic : joue la carte
            setHighLightedCard(undefined);
            if (selectedCardIndex.current !== undefined && cardClicked) {
                SocketState.socket?.emit("card_played", {
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
            SocketState.socket?.emit("choose_contract", {
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
                duration: 5000,
                position: 'top-center',
                icon: '🔥',
                iconTheme: { primary: '#000', secondary: '#fff' },
            });
            // Réinitialise la sélection de carte en cas d'erreur
            cardClickCount.current = 0;
            selectedCardIndex.current = undefined;
            setHighLightedCard(undefined);
        };

        socket.on("error", handleError);
        return () => { socket.off("error", handleError); };
    }, [SocketState.socket]);

    const isGameOver = GameState.gameState.isOver;

    return (
        <div className="board">
            <Toaster />

            {isGameOver && (
                <div className="game-over">
                    <h2>Partie terminée !</h2>
                    <Ranking />
                </div>
            )}

            {!isGameOver && (
                <>
                    {GameState.gameState.currentContract?.contract.name && <BoardHeader />}

                    {numberOfFolds > 0 && (
                        <PlayedCards cards={GameState.gameState.currentTurn.folds} />
                    )}

                    {GameState.gameState.currentContract?.contract.name === "Réussite" && (
                        <ReussiteArea />
                    )}

                    <div className="player-info">
                        {isTheGoodPlayer && (
                            <Hand
                                cards={isTheGoodPlayer.startedHand}
                                highlighted={highLightedCard}
                                onCardClick={isTheCurrentPlayer ? handleCardClick : () => { }}
                            />
                        )}

                        {isTheGoodPlayer && <h2>{isTheGoodPlayer.name}</h2>}

                        {/* Liste des contrats : visible uniquement pour le dealer avant qu'il choisisse */}
                        {isTheCurrentPlayer && !GameState.gameState.currentContract && availableContracts.length > 0 && (
                            <ContractList
                                contracts={availableContracts}
                                onContractClick={handleContractClick}
                            />
                        )}

                        {isTheCurrentPlayer && !GameState.gameState.currentContract && availableContracts.length === 0 && (
                            <p>Vous avez déjà joué tous les contrats.</p>
                        )}
                    </div>

                    {showRanking && <Ranking />}
                </>
            )}
        </div>
    );
};

export default Board;

//import toast, { Toaster } from 'react-hot-toast';
//import { useMediaQuery } from 'react-responsive';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import BoardHeader from './BoardHeader';
import PlayedCards from './PlayedCards';
import ReussiteArea from './ReussiteArea';
import Hand from './Hand';
import ContractList from './ContractList';
import { Contract, Player, Room } from '../backend/gameInterface';
import { useEffect, useState } from 'react';
import { Card } from '../backend/Card';
import toast, { Toaster } from 'react-hot-toast';
import Ranking from './Ranking';
//import { Card } from '../backend/Card';

/* const useCheckOrientation = () => {
    useEffect(() => {
        const checkOrientation = () => {
            const isPortraitOrientation = window.innerHeight > window.innerWidth;

            if (isPortraitOrientation) {
                toast.error('Merci de tourner votre téléphone en mode paysage', {
                    duration: 5000,
                    position: 'top-center',
                    icon: '🔥',
                    iconTheme: {
                        primary: '#000',
                        secondary: '#fff',
                    },
                });
            }
        };

        // Vérifiez l'orientation au chargement de la page et lors de chaque changement d'orientation
        checkOrientation();
        window.addEventListener('resize', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
        };
    }, []);
}; */

const Board = () => {

    //useCheckOrientation();

    const { SocketState } = useSocketContext();
    const { GameState } = useGameContext();
    const [highLightedCard, setHighLightedCard] = useState<number | undefined>(undefined)


    //console.log("SocketState", SocketState.socket);
    console.log("GameState state players", GameState.gameState.players);
    /* const isMobile = useMediaQuery({ maxWidth: 480 });*/

    let showRanking = false;
    GameState.gameState.players.forEach((player) => {
        if (player.score !== 0) {
            showRanking = true;
        }
    });


    const isTheGoodPlayer: Player | undefined = GameState.gameState.players.find((player) => player.socketId === SocketState.socket?.id);
    const isTheCurrentPlayer: Player | undefined = GameState.gameState.currentPlayer.socketId === SocketState.socket?.id ? GameState.gameState.currentPlayer : undefined;

    const roomId: string | undefined = GameState.roomsState.rooms.find((room: Room) => room.players.find((player: Player) => player.socketId === SocketState.socket?.id)?.socketId === SocketState.socket?.id)?.roomId

    const numberOfFolds = Object.values(GameState.gameState.currentTurn?.folds ?? {}).filter(fold => fold !== undefined).length;

    //console.log("numberOfFolds", numberOfFolds);

    let cardClickCount = 0;
    let selectedCardIndex: number | undefined = undefined;

    const handleCardClick = (cardIndex: number) => {
        // TODO: handle card click and update game state
        //console.log(`Card clicked => card: ${cardIndex}`);

        const cardClicked: Card | undefined = isTheCurrentPlayer?.startedHand[cardIndex];

        let newCardClickCount = cardClickCount + 1;
        let newSelectedCardIndex: number | undefined = selectedCardIndex;

        if (newCardClickCount === 1) {
            // La carte est montée du paquet
            newSelectedCardIndex = cardIndex;
            setHighLightedCard(cardIndex);
            //console.log("CARDCLICKCOUNT if", newCardClickCount);
        } else if (newCardClickCount === 2) {
            // La carte est jouée
            setHighLightedCard(undefined);
            //console.log("CARDCLICKCOUNT else if", newCardClickCount);
            newCardClickCount = 0;
            if (newSelectedCardIndex !== undefined) {
                SocketState.socket?.emit("card_played", { cardClicked: cardClicked, playerCardClicked: isTheCurrentPlayer });
                newSelectedCardIndex = undefined;
            }
            newCardClickCount = 0;
        }

        cardClickCount = newCardClickCount;
        selectedCardIndex = newSelectedCardIndex;
    };

    const handleContractClick = (contract: Contract) => {
        if (isTheCurrentPlayer) {
            const contractIndex = GameState.gameState.contracts.indexOf(contract);
            SocketState.socket?.emit("choose_contract", { playerContract: isTheCurrentPlayer, contractIndex, roomId });
        }
    };

    useEffect(() => {
        console.log("isTheGoodPlayer", isTheGoodPlayer);
        console.log("istheCurrentPlayer", isTheCurrentPlayer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        SocketState.socket?.on("error", (errorMessage: string) => {
            toast.error(errorMessage, {
                duration: 5000,
                position: 'top-center',
                icon: '🔥',
                iconTheme: {
                    primary: '#000',
                    secondary: '#fff',
                },
            });
            console.log("error", errorMessage)
        });

    }, [SocketState.socket]);

    return (
        <div className="board">
            <Toaster />
            {
                GameState.gameState.currentContract?.contract.name != undefined && <BoardHeader />
            }

            {
                numberOfFolds > 0 &&
                <PlayedCards cards={GameState.gameState.currentTurn.folds} />
            }

            {
                GameState.gameState.currentContract?.contract.name === "Réussite" && <ReussiteArea />
            }
            <div className="player-info">

                {
                    isTheGoodPlayer &&
                    <Hand
                        cards={isTheGoodPlayer.startedHand}
                        highlighted={highLightedCard}
                        onCardClick={isTheCurrentPlayer ? handleCardClick : () => { }}
                    />
                }

                {
                    isTheGoodPlayer &&
                    <h2>{isTheGoodPlayer.name}</h2>
                }
                {
                    (isTheCurrentPlayer && GameState.gameState.currentRound === 0) &&
                    <ContractList contracts={GameState.gameState.contracts} onContractClick={handleContractClick} />
                }


            </div>
            {
                showRanking && <Ranking />
            }
        </div>
    )

}

export default Board
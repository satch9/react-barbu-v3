//import toast, { Toaster } from 'react-hot-toast';
//import { useMediaQuery } from 'react-responsive';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import BoardHeader from './BoardHeader';
import PlayedCards from './PlayedCards';
import ReussiteArea from './ReussiteArea';
import Hand from './Hand';
import ContractList from './ContractList';
//import { useCallback } from 'react';
import { Contract, Player, Room } from '../backend/gameInterface';
import { useState } from 'react';
import { Card } from '../backend/Card';
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

    //console.log("SocketState", SocketState.socket);
    //console.log("GameState state", GameState.gameState);

    const [cardClickCount, setCardClickCount] = useState(0);
    const [highLightedCard, setHighLightedCard] = useState<number | undefined>(undefined)

    /* const isMobile = useMediaQuery({ maxWidth: 480 });*/

    const isTheGoodPlayer: Player | undefined = GameState.gameState.players.find((player) => player.socketId === SocketState.socket?.id);
    const isTheCurrentPlayer: Player | undefined = GameState.gameState.currentPlayer.socketId === SocketState.socket?.id ? GameState.gameState.currentPlayer : undefined;

    const roomId: string | undefined = GameState.roomsState.rooms.find((room: Room) => room.players.find((player: Player) => player.socketId === SocketState.socket?.id)?.socketId === SocketState.socket?.id)?.roomId

    const handleCardClick = (cardIndex: number) => {
        // TODO: handle card click and update game state
        console.log(`Card clicked => card: ${cardIndex}`);

        const cardClicked: Card | undefined = isTheCurrentPlayer?.startedHand[cardIndex];

        setCardClickCount(cardClickCount + 1);

        if (cardClickCount === 1) {
            // La carte est montée du paquet
            setHighLightedCard(cardIndex)
        } else if (cardClickCount === 2) {
            // La carte est jouée
            setHighLightedCard(undefined)
            setCardClickCount(0);
            SocketState.socket?.emit("card_played", { cardClicked: cardClicked, playerCardClicked: isTheCurrentPlayer })
        }
    };

    const handleContractClick = (contract: Contract) => {
        if (isTheCurrentPlayer) {
            const contractIndex = GameState.gameState.contracts.indexOf(contract);
            SocketState.socket?.emit("choose_contract", { playerContract: isTheCurrentPlayer, contractIndex, roomId });
        }
    };



    console.log("isTheGoodPlayer", isTheGoodPlayer)
    console.log("istheCurrentPlayer", isTheCurrentPlayer)


    return (
        <div className="board">
            {
                GameState.gameState.currentContract?.contract.name != undefined && <BoardHeader />
            }

            {
                GameState.gameState.currentPlayer.myFoldsDuringTurn.length > 0 &&
                <PlayedCards cards={GameState.gameState.currentPlayer.myFoldsDuringTurn} />
            }

            {
                GameState.gameState.currentContract?.contract.name === "Réussite" && <ReussiteArea />
            }
            <div className="player-info">

                {
                    isTheGoodPlayer && <Hand cards={isTheGoodPlayer.startedHand} highlighted={highLightedCard} onCardClick={handleCardClick} />
                }

                {
                    isTheGoodPlayer &&
                    <h2>{isTheGoodPlayer.name}</h2>
                }
                {
                    isTheCurrentPlayer &&
                    <ContractList contracts={GameState.gameState.contracts} onContractClick={handleContractClick} />
                }

            </div>
        </div>
    )

}

export default Board
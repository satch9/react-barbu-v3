import toast, { Toaster } from 'react-hot-toast';
import { useMediaQuery } from 'react-responsive';
import CardGame from './CardGame';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Player } from '../backend/gameInterface';
import { Card } from '../backend/Card';
import ContractButton from './ContractButton';

const Board = () => {
    const { SocketState } = useSocketContext();
    const { GameState } = useGameContext();

    //console.log("SocketState", SocketState.socket);
    //console.log("GameState state", GameState.gameState);

    const [clickedCard, setClickedCard] = useState<string[]>([]);

    const isMobile = useMediaQuery({ maxWidth: 480 });

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

    const handleContractChoice = useCallback((player: Player, index: number) => {
        // Ajoutez une condition pour vérifier si l'appel est autorisé
        if (!player || !SocketState.socket) {
            // Si la condition n'est pas remplie, ne faites rien
            return;
        }
        SocketState.socket?.emit('choose_contract', { player, contractIndex: index });
    }, [SocketState.socket]);

    const handleCardClicked = useCallback((card: Card | string, player: Player) => {
        console.log("clickedCards", clickedCard)
        console.log("handleCardClicked", card)
        console.log("handleCardClicked player", player)

        const cardIdentifier = typeof card === 'string' ? card : card.suit + card.value;

        if (clickedCard.includes(cardIdentifier)) {
            // La carte a déjà été cliquée, retirez-la de la div "boards-cards"
            console.log("1");
            setClickedCard((prevClickedCard) => prevClickedCard.filter((c) => c !== cardIdentifier));
        } else {
            console.log("2");
            // La carte n'a pas encore été cliquée, ajoutez-la à celles qui ont été cliquées
            setClickedCard((prevClickedCard) => [...prevClickedCard, cardIdentifier]);
        }

        SocketState.socket?.emit('card_played', { cardClicked: card, playerClickedCards: player });
    }, [SocketState.socket, clickedCard]);


    const memoizedComponent = useMemo(() => (
        <div className={`board-container ${isMobile ? 'mobile' : 'desktop'}`} key={"board-container"}>
            <Toaster />
            {GameState.gameState.players.map((player, playerIndex) => {
                if (player.socketId === SocketState.socket?.id) {
                    return (
                        <>
                            <div className="board-area-play" key={`board-area-play-${player.name}`} >

                                {
                                    GameState.gameState.currentContract?.contract && (
                                        <div className="board-chosen-contract" key={`board-chosen-contract-${player.name}`}>
                                            {GameState.gameState.currentContract?.player.name} a choisi {GameState.gameState.currentContract?.contract.name}
                                        </div>
                                    )
                                }

                                {
                                    GameState.gameState.currentContract?.contract.name !== "Réussite" && (
                                        <div className="board-cards" key={`board-cards-${player.name}`}>
                                            {
                                                player.myFoldsDuringTurn.map((cardsPlayed: Card, indexCardPlayed: number) => (
                                                    <div key={indexCardPlayed} className="board-cards-played">
                                                        <div className="card" key={cardsPlayed.suit + cardsPlayed.value} >
                                                            <span className={cardsPlayed.suit === '♥' || cardsPlayed.suit === '♦' ? 'suit card-red' : 'suit card-black'}>
                                                                {cardsPlayed.suit}
                                                            </span>
                                                            <span>{cardsPlayed.value}</span>
                                                        </div>

                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )
                                }

                                {
                                    GameState.gameState.currentContract?.contract.name === "Réussite" && (
                                        <div className="reussite-game" key={`reussite-game-${player.name}`} >
                                            {
                                                GameState.gameState.players.map((player, reussiteIndex) => (
                                                    <div key={reussiteIndex} className="reussite-player">
                                                        {player.name}
                                                        <div className="reussite-cards" key={`reussite-cards-${player.name}`}>
                                                            {Array(13).fill(null).map((cardPlacement, cardIndex) => (
                                                                <div key={cardIndex} className="reussite-card">
                                                                    {cardPlacement}
                                                                </div>))
                                                            }
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )
                                }

                            </div>
                            <div className="player" key={playerIndex}>

                                <div className="player-cards" key={`player-cards-${player.name}`}>
                                    {player.startedHand.map((cardStartedHand, cardStartedHandIndex) => (
                                        <CardGame
                                            card={cardStartedHand}
                                            key={cardStartedHandIndex}
                                            onClick={() => handleCardClicked(cardStartedHand, player)}
                                            highlighted={clickedCard.includes(cardStartedHand.suit + cardStartedHand.value)} />
                                    ))}
                                </div>
                                <div className="player-name" key={`player-name-${player.name}`}>{player.name}</div>
                            </div>
                            <div className="board-area-contracts" key={`board-area-contracts-${player.name}`}>
                                {
                                    GameState.gameState.currentPlayer.name === player.name && (
                                        GameState.gameState.contracts.map((contract, contractIndex) => (
                                            <ContractButton
                                                key={contractIndex}
                                                contract={contract}

                                                // eslint-disable-next-line no-restricted-syntax
                                                onClick={() => handleContractChoice(player, contractIndex)}
                                                contractIndex={contractIndex}
                                            />
                                        ))
                                    )
                                }
                            </div>
                        </>
                    );
                } else {
                    return (
                        <>

                        </>
                    )
                }
            })}
        </div>
    ), [isMobile, GameState.gameState.players, GameState.gameState.currentContract, GameState.gameState.currentPlayer.name, GameState.gameState.contracts, SocketState.socket?.id, clickedCard, handleCardClicked, handleContractChoice]);

    return memoizedComponent;
}

export default Board
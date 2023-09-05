import React, { useState } from "react";
import Modal from "react-modal";
import { useSocketContext } from "../utils/socketUtils";
import { useGameContext } from "../utils/gameUtils";


Modal.setAppElement("#root");

const screenWidth = window.screen.width;
//const screenHeight = window.screen.height;
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const customStyles = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        width: windowWidth <= 375 ? "70%" : screenWidth <= 768 ? "55%" : "50%",
        height: windowHeight >= 667 ? "50%" : windowHeight >= 480 ? "40%" : "35%",
        borderRadius: "10px",
    },
};

const ListOfGames = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsOpen1, setModalIsOpen1] = useState(false);
    const [pseudo, setPseudo] = useState("");
    const [roomIdJoinedGame, setRoomIdJoinedGame] = useState("");
    const [joinedRoom, setJoinedRoom] = useState<string[]>([]);

    const { SocketState } = useSocketContext();
    const { GameState } = useGameContext();

    const openModal = () => {
        setModalIsOpen(true);
    };

    const openModal1 = () => {
        setModalIsOpen1(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const closeModal1 = () => {
        setModalIsOpen1(false);
    };

    const handleCreateGame = () => {
        openModal();
    }

    const handleJoinGame = (roomIdChooseGame: string) => {
        openModal1();
        setRoomIdJoinedGame(roomIdChooseGame);
        setJoinedRoom((prevJoinedRoom) => [...prevJoinedRoom, roomIdChooseGame]);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPseudo(pseudo);
        if (SocketState.socket && pseudo !== "") {
            SocketState.socket.emit("create_game", {
                uid: SocketState.uid,
                socketId: SocketState.socket.id,
                pseudo: pseudo,
            });
        }
        closeModal();
    }

    const handleSubmit1 = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPseudo(pseudo);
        if (SocketState.socket && pseudo !== "") {
            SocketState.socket.emit("join_game", {
                roomId: roomIdJoinedGame,
                uid: SocketState.uid,
                socketId: SocketState.socket.id,
                pseudo: pseudo,
            });
        }
        closeModal1();
    }

    const handleStartGame = (roomIdStartGame: string) => {
        console.log("roomIdStartGame", roomIdStartGame);
        SocketState.socket?.emit("start_game", { roomId: roomIdStartGame });
    }

    const handleGoBackGame = (roomIdGoBackGame: string) => {
        console.log("roomIdGoBackGame", roomIdGoBackGame);
        SocketState.socket?.emit("gobackgame", {
            roomIdGoBackGame: roomIdGoBackGame,
        });
    }


    return (
        <div className="listofgames">
            <h1>Barbu</h1>
            {GameState.roomsState.rooms.length !== 0 && (
                <button className="btn-create" onClick={handleCreateGame}>
                    Créer
                </button>
            )}

            <table>
                <caption>Liste des jeux</caption>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Players</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {GameState.roomsState.rooms.length !== 0 &&
                        GameState.roomsState.rooms.map((room, index) => (
                            <tr key={index}>
                                <td>{room.name}</td>
                                <td className="tooltip">
                                    {room.players.length}
                                    <span className="tooltiptext">
                                        {room.players.map((player, index) => (
                                            <p key={index}>{player.name}</p>
                                        ))}
                                    </span>
                                </td>
                                <td className="btn-actions">
                                    {GameState.roomsState.rooms.length === 0 && (
                                        <button className="btn-create" onClick={handleCreateGame}>
                                            Créer
                                        </button>
                                    )}
                                    {GameState.roomsState.rooms.length !== 0 &&
                                        room.players.length !== 4 &&
                                        !joinedRoom.includes(room.roomId) &&
                                        room.players[0].socketId !== SocketState.socket?.id && (
                                            <button
                                                className="btn-join"
                                                onClick={() => handleJoinGame(room.roomId)}
                                            >
                                                Rejoindre
                                            </button>
                                        )
                                    }
                                    {
                                        joinedRoom.includes(room.roomId) && (
                                            <p>en attente ...</p>
                                        )
                                    }
                                    {GameState.roomsState.rooms.length !== 0 &&
                                        room.players.length === 4 &&
                                        room.players[0].socketId === SocketState.socket?.id ? (
                                        <button
                                            className="btn-start"
                                            onClick={() => handleStartGame(room.roomId)}
                                        >
                                            Commencer
                                        </button>
                                    ) : GameState.gameState.startedGame ? (
                                        <button
                                            className="btn-goback"
                                            onClick={() => handleGoBackGame(room.roomId)}
                                        >
                                            Revenir à la partie
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}

                    {!GameState.roomsState.rooms.length && (
                        <tr>
                            <td colSpan={2}>Aucune partie en cours</td>
                            <td></td>
                            <td>
                                <button className="btn-create" onClick={handleCreateGame}>
                                    Créer
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
            >
                <div className="modal">
                    <div className="modal_close_container">
                        <button className="modal__close" onClick={closeModal}>
                            X
                        </button>
                    </div>

                    <h2>Choisir son pseudo</h2>

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                        />

                        <button className="btn btn-modal" type="submit">
                            Choisir
                        </button>
                    </form>
                </div>
            </Modal>
            <Modal
                isOpen={modalIsOpen1}
                onRequestClose={closeModal1}
                style={customStyles}
            >
                <div className="modal">
                    <div className="modal_close_container">
                        <button className="modal__close" onClick={closeModal1}>
                            X
                        </button>
                    </div>

                    <h2>Choisir son pseudo</h2>

                    <form onSubmit={handleSubmit1}>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                        />

                        <button className="btn btn-modal" type="submit">
                            Choisir
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    )

}

export default ListOfGames;
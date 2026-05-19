import React, { useState } from 'react';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Room } from '../backend/gameInterface';

const playersBadgeVariant = (count: number, max: number): string => {
  if (count === max) return 'bg-green-600 hover:bg-green-600 text-white';
  if (count >= max - 1) return 'bg-yellow-600 hover:bg-yellow-600 text-white';
  if (count >= 2) return 'bg-orange-500 hover:bg-orange-500 text-white';
  return 'bg-red-600 hover:bg-red-600 text-white';
};

const ListOfGames = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [deckSize, setDeckSize] = useState<32 | 52>(52);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

  const handleDeckSizeChange = (size: 32 | 52) => {
    setDeckSize(size);
    if (size === 32 && maxPlayers > 4) {
      setMaxPlayers(4);
    }
  };

  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (SocketState.socket && pseudo.trim()) {
      SocketState.socket.emit('create_game', {
        uid: SocketState.uid,
        socketId: SocketState.socket.id,
        pseudo: pseudo.trim(),
        deckSize,
        maxPlayers,
      });
    }
    setPseudo('');
    setCreateOpen(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (SocketState.socket && pseudo.trim()) {
      SocketState.socket.emit('join_game', {
        roomId: roomIdToJoin,
        uid: SocketState.uid,
        socketId: SocketState.socket.id,
        pseudo: pseudo.trim(),
      });
      setJoinedRooms(prev => [...prev, roomIdToJoin]);
    }
    setPseudo('');
    setJoinOpen(false);
  };

  const openJoin = (roomId: string) => {
    setRoomIdToJoin(roomId);
    setJoinOpen(true);
  };

  const isInRoom = (room: Room) =>
    room.players.some(p => p.uid === SocketState.uid);

  const isCreator = (room: Room) =>
    room.players[0]?.uid === SocketState.uid;

  const rooms = GameState.roomsState.rooms;

  return (
    <div className="min-h-[100dvh] bg-felt-dark flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-card text-4xl font-serif">🃏 BARBU</h1>

      <Button
        className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
        onClick={() => setCreateOpen(true)}
      >
        + Créer une partie
      </Button>

      <div className="w-full max-w-sm">
        <Table>
          <TableCaption className="text-card/60 text-sm">
            {rooms.length === 0 ? 'Aucune partie en cours' : 'Parties disponibles'}
          </TableCaption>
          <TableHeader>
            <TableRow className="border-card/20 hover:bg-transparent">
              <TableHead className="text-card/80">Id</TableHead>
              <TableHead className="text-card/80">Joueurs</TableHead>
              <TableHead className="text-card/80">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map(room => (
              <TableRow key={room.roomId} className="border-card/10 hover:bg-card/5">
                <TableCell className="text-card font-mono text-sm">{room.name}</TableCell>
                <TableCell>
                  <Badge className={playersBadgeVariant(room.players.length, room.maxPlayers)}>
                    {room.players.length}/{room.maxPlayers}
                  </Badge>
                </TableCell>
                <TableCell>
                  {GameState.gameState.startedGame && isInRoom(room) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-card border-card/30 hover:bg-card/10 text-xs"
                      onClick={() =>
                        SocketState.socket?.emit('gobackgame', {
                          roomIdGoBackGame: room.roomId,
                        })
                      }
                    >
                      Revenir
                    </Button>
                  ) : isCreator(room) && room.players.length === room.maxPlayers ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white text-xs"
                      onClick={() =>
                        SocketState.socket?.emit('start_game', { roomId: room.roomId })
                      }
                    >
                      Commencer
                    </Button>
                  ) : joinedRooms.includes(room.roomId) || isInRoom(room) ? (
                    <Badge variant="secondary" className="text-xs bg-card/20 text-card/70">
                      en attente…
                    </Badge>
                  ) : room.players.length < room.maxPlayers ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-card border-card/30 hover:bg-card/10 text-xs"
                      onClick={() => openJoin(room.roomId)}
                    >
                      Rejoindre
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog — Créer */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-felt border-card/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-card">Nouvelle partie</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <Input
              className="bg-felt-dark border-card/30 text-card placeholder:text-card/40 mb-4"
              placeholder="Pseudo"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              required
              autoFocus
            />
            <div className="mb-4">
              <p className="text-card/80 text-xs mb-2">Taille du jeu</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={`text-card border-card/30 text-sm ${
                    deckSize === 52
                      ? 'bg-yellow-600/80 hover:bg-yellow-600/80 border-transparent'
                      : 'bg-felt-dark/40 hover:bg-felt-dark/60'
                  }`}
                  onClick={() => handleDeckSizeChange(52)}
                >
                  52 cartes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`text-card border-card/30 text-sm ${
                    deckSize === 32
                      ? 'bg-yellow-600/80 hover:bg-yellow-600/80 border-transparent'
                      : 'bg-felt-dark/40 hover:bg-felt-dark/60'
                  }`}
                  onClick={() => handleDeckSizeChange(32)}
                >
                  32 cartes
                </Button>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-card/80 text-xs mb-2">Nombre de joueurs</p>
              <div className="flex gap-2 flex-wrap">
                {(deckSize === 32 ? [2, 3, 4] : [2, 3, 4, 5, 6, 7, 8]).map(n => (
                  <Button
                    key={n}
                    type="button"
                    variant="outline"
                    className={`text-card border-card/30 text-sm w-10 ${
                      maxPlayers === n
                        ? 'bg-yellow-600/80 hover:bg-yellow-600/80 border-transparent'
                        : 'bg-felt-dark/40 hover:bg-felt-dark/60'
                    }`}
                    onClick={() => setMaxPlayers(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-500 text-white w-full"
              >
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog — Rejoindre */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="bg-felt border-card/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-card">Choisir un pseudo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit}>
            <Input
              className="bg-felt-dark border-card/30 text-card placeholder:text-card/40 mb-4"
              placeholder="Pseudo"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-500 text-white w-full"
              >
                Rejoindre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListOfGames;

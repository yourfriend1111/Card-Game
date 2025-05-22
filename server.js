const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Game state management
const rooms = new Map();
const players = new Map();

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = [];
    this.gameState = {
      phase: 1,
      turn: 1,
      currentPlayer: null,
      players: {},
      board: Array(30).fill().map(() => Array(30).fill(null)),
      gameStarted: false
    };
    this.maxPlayers = 2;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }
    
    this.players.push(player);
    this.gameState.players[player.id] = {
      id: player.id,
      name: player.name,
      health: 100,
      energy: 5,
      deck: [...player.deck],
      hand: [],
      field: [],
      isReady: false
    };
    
    player.roomId = this.id;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    delete this.gameState.players[playerId];
    
    if (this.players.length === 0) {
      return true; // Room should be deleted
    }
    
    if (this.gameState.gameStarted && this.players.length === 1) {
      // Game ends if a player leaves during gameplay
      this.endGame(this.players[0].id);
    }
    
    return false;
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
      this.gameState.players[playerId].isReady = isReady;
    }
  }

  canStartGame() {
    return this.players.length === 2 && this.players.every(p => p.isReady);
  }

  startGame() {
    if (!this.canStartGame()) return false;
    
    this.gameState.gameStarted = true;
    this.gameState.currentPlayer = this.players[0].id;
    
    // Initialize player hands
    this.players.forEach(player => {
      const gamePlayer = this.gameState.players[player.id];
      gamePlayer.hand = this.drawCards(player.id, 5);
    });
    
    return true;
  }

  drawCards(playerId, count) {
    const gamePlayer = this.gameState.players[playerId];
    const drawn = [];
    
    for (let i = 0; i < count && gamePlayer.deck.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * gamePlayer.deck.length);
      const card = gamePlayer.deck.splice(randomIndex, 1)[0];
      drawn.push(card);
    }
    
    gamePlayer.hand.push(...drawn);
    return drawn;
  }

  playCard(playerId, cardIndex, position) {
    if (!this.gameState.gameStarted) {
      throw new Error('Game has not started');
    }
    
    if (this.gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn');
    }
    
    const gamePlayer = this.gameState.players[playerId];
    const card = gamePlayer.hand[cardIndex];
    
    if (!card) {
      throw new Error('Invalid card');
    }
    
    if (gamePlayer.energy < card.energyCost) {
      throw new Error('Not enough energy');
    }
    
    // Validate position
    if (position.x < 0 || position.x >= 30 || position.y < 0 || position.y >= 30) {
      throw new Error('Invalid position');
    }
    
    // Check if position is on player's side
    const isPlayerSide = this.gameState.currentPlayer === this.players[0].id ? 
      position.y >= 15 : position.y < 15;
    
    if (!isPlayerSide && this.gameState.phase === 1) {
      throw new Error('Can only place cards on your side in phase 1');
    }
    
    if (this.gameState.board[position.y][position.x] !== null) {
      throw new Error('Position is occupied');
    }
    
    // Play the card
    gamePlayer.energy -= card.energyCost;
    gamePlayer.hand.splice(cardIndex, 1);
    
    // Place card on board
    const cardInstance = {
      ...card,
      id: Date.now() + Math.random(),
      ownerId: playerId,
      position: position,
      currentHealth: card.health || 0,
      canMove: false, // Units can't move the turn they're played
      hasMoved: false
    };
    
    this.gameState.board[position.y][position.x] = cardInstance;
    gamePlayer.field.push(cardInstance);
    
    return cardInstance;
  }

  endTurn() {
    const currentPlayerIndex = this.players.findIndex(p => p.id === this.gameState.currentPlayer);
    const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    const nextPlayer = this.players[nextPlayerIndex];
    
    this.gameState.currentPlayer = nextPlayer.id;
    
    // Reset movement for current player's units
    const currentGamePlayer = this.gameState.players[this.players[currentPlayerIndex].id];
    currentGamePlayer.field.forEach(unit => {
      unit.canMove = true;
      unit.hasMoved = false;
    });
    
    // If it's the original player's turn again, increment turn counter
    if (nextPlayerIndex === 0) {
      this.gameState.turn++;
      
      // Check for phase transition (turn 10)
      if (this.gameState.turn === 10 && this.gameState.phase === 1) {
        this.gameState.phase = 2;
        return { newPhase: true };
      }
    }
    
    // Generate energy and draw card for new turn
    const nextGamePlayer = this.gameState.players[nextPlayer.id];
    nextGamePlayer.energy = Math.min(nextGamePlayer.energy + 5, 10); // Max 10 energy
    
    // Draw a card if deck has cards
    if (nextGamePlayer.deck.length > 0) {
      this.drawCards(nextPlayer.id, 1);
    }
    
    return { newPhase: false };
  }

  moveUnit(playerId, unitId, newPosition) {
    if (this.gameState.phase !== 2) {
      throw new Error('Can only move units in phase 2');
    }
    
    if (this.gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn');
    }
    
    const gamePlayer = this.gameState.players[playerId];
    const unit = gamePlayer.field.find(u => u.id === unitId);
    
    if (!unit) {
      throw new Error('Unit not found');
    }
    
    if (unit.hasMoved) {
      throw new Error('Unit has already moved this turn');
    }
    
    // Validate movement range
    const distance = Math.abs(unit.position.x - newPosition.x) + 
                    Math.abs(unit.position.y - newPosition.y);
    
    if (distance > unit.speed) {
      throw new Error('Move distance exceeds unit speed');
    }
    
    // Check if new position is valid
    if (newPosition.x < 0 || newPosition.x >= 30 || 
        newPosition.y < 0 || newPosition.y >= 30) {
      throw new Error('Invalid position');
    }
    
    if (this.gameState.board[newPosition.y][newPosition.x] !== null) {
      throw new Error('Position is occupied');
    }
    
    // Move the unit
    this.gameState.board[unit.position.y][unit.position.x] = null;
    unit.position = newPosition;
    unit.hasMoved = true;
    this.gameState.board[newPosition.y][newPosition.x] = unit;
  }

  attackUnit(attackerId, targetId) {
    if (this.gameState.phase !== 2) {
      throw new Error('Can only attack in phase 2');
    }
    
    if (this.gameState.currentPlayer !== this.getCurrentPlayerForUnit(attackerId)) {
      throw new Error('Not your turn');
    }
    
    const attacker = this.findUnitById(attackerId);
    const target = this.findUnitById(targetId);
    
    if (!attacker || !target) {
      throw new Error('Unit not found');
    }
    
    if (attacker.ownerId === target.ownerId) {
      throw new Error('Cannot attack your own units');
    }
    
    // Check if attacker can attack
    if (attacker.hasAttacked) {
      throw new Error('Unit has already attacked this turn');
    }
    
    // Check range
    const distance = Math.abs(attacker.position.x - target.position.x) + 
                    Math.abs(attacker.position.y - target.position.y);
    
    if (distance > attacker.range) {
      throw new Error('Target is out of range');
    }
    
    // Apply damage
    target.currentHealth -= attacker.damage;
    attacker.hasAttacked = true;
    
    // Remove unit if health <= 0
    if (target.currentHealth <= 0) {
      this.removeUnitFromBoard(targetId);
    }
    
    return {
      attacker: attacker,
      target: target,
      destroyed: target.currentHealth <= 0
    };
  }

  findUnitById(unitId) {
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        const unit = this.gameState.board[y][x];
        if (unit && unit.id === unitId) {
          return unit;
        }
      }
    }
    return null;
  }

  getCurrentPlayerForUnit(unitId) {
    const unit = this.findUnitById(unitId);
    return unit ? unit.ownerId : null;
  }

  removeUnitFromBoard(unitId) {
    // Remove from board
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        const unit = this.gameState.board[y][x];
        if (unit && unit.id === unitId) {
          this.gameState.board[y][x] = null;
          
          // Remove from player's field
          const owner = this.gameState.players[unit.ownerId];
          if (owner) {
            owner.field = owner.field.filter(u => u.id !== unitId);
          }
          return;
        }
      }
    }
  }

  checkWinCondition() {
    const alivePlayers = this.players.filter(player => {
      const gamePlayer = this.gameState.players[player.id];
      return gamePlayer.field.some(unit => unit.currentHealth > 0);
    });
    
    if (alivePlayers.length === 1) {
      return alivePlayers[0].id;
    }
    
    return null;
  }

  endGame(winnerId) {
    this.gameState.gameStarted = false;
    return winnerId;
  }
}

// Utility functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createPlayer(socket, name, deck) {
  return {
    id: socket.id,
    name: name,
    deck: deck,
    socket: socket,
    roomId: null,
    isReady: false
  };
}

function handlePlayerLeaving(socket) {
  const player = players.get(socket.id);
  if (!player || !player.roomId) return;
  
  const room = rooms.get(player.roomId);
  if (!room) return;
  
  // Notify other players
  socket.to(player.roomId).emit('playerLeft', { 
    playerName: player.name,
    players: room.players.filter(p => p.id !== socket.id)
  });
  
  // Remove player from room
  const shouldDeleteRoom = room.removePlayer(socket.id);
  if (shouldDeleteRoom) {
    rooms.delete(player.roomId);
  }
  
  players.delete(socket.id);
  socket.leave(player.roomId);
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  socket.on('createRoom', (data) => {
    try {
      const roomId = generateRoomId();
      const room = new GameRoom(roomId);
      const player = createPlayer(socket, data.playerName, data.deck);
      
      room.addPlayer(player);
      rooms.set(roomId, room);
      players.set(socket.id, player);
      
      socket.join(roomId);
      socket.emit('roomCreated', { roomId, players: room.players });
      
      console.log(`Room created: ${roomId} by ${socket.id}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('joinRoom', (data) => {
    try {
      const room = rooms.get(data.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      const player = createPlayer(socket, data.playerName, data.deck);
      room.addPlayer(player);
      players.set(socket.id, player);
      
      socket.join(data.roomId);
      
      // Notify all players in the room
      io.to(data.roomId).emit('joinedRoom', { 
        roomId: data.roomId, 
        players: room.players 
      });
      
      // Notify others that a player joined
      socket.to(data.roomId).emit('playerJoined', { 
        playerName: data.playerName,
        players: room.players 
      });
      
      console.log(`Player ${socket.id} joined room ${data.roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('leaveRoom', () => {
    handlePlayerLeaving(socket);
  });
  
  socket.on('playerReady', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      room.setPlayerReady(socket.id, data.isReady);
      
      // Check if game can start
      if (room.canStartGame()) {
        const gameStarted = room.startGame();
        if (gameStarted) {
          io.to(player.roomId).emit('gameStarted', { 
            gameState: room.gameState 
          });
        }
      } else {
        // Just update ready status
        io.to(player.roomId).emit('playerReady', { 
          players: room.players,
          allReady: room.players.every(p => p.isReady)
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('playCard', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      const playedCard = room.playCard(socket.id, data.cardIndex, data.position);
      
      // Notify all players in the room
      io.to(player.roomId).emit('cardPlayed', {
        playerName: player.name,
        playerId: socket.id,
        card: playedCard,
        gameState: room.gameState
      });
      
      // Check win condition
      const winner = room.checkWinCondition();
      if (winner) {
        io.to(player.roomId).emit('gameEnded', { 
          winner: winner,
          gameState: room.gameState 
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('endTurn', () => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.gameState.currentPlayer !== socket.id) {
        throw new Error('Not your turn');
      }
      
      // Reset attack flags for current player's units
      const currentGamePlayer = room.gameState.players[socket.id];
      currentGamePlayer.field.forEach(unit => {
        unit.hasAttacked = false;
      });
      
      const turnResult = room.endTurn();
      
      io.to(player.roomId).emit('turnChanged', {
        gameState: room.gameState,
        newPhase: turnResult.newPhase
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('moveUnit', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      room.moveUnit(socket.id, data.unitId, data.position);
      
      io.to(player.roomId).emit('unitMoved', {
        playerName: player.name,
        unitId: data.unitId,
        position: data.position,
        gameState: room.gameState
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('attackUnit', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      const attackResult = room.attackUnit(data.attackerId, data.targetId);
      
      io.to(player.roomId).emit('unitAttacked', {
        playerName: player.name,
        attackResult: attackResult,
        gameState: room.gameState
      });
      
      // Check win condition
      const winner = room.checkWinCondition();
      if (winner) {
        io.to(player.roomId).emit('gameEnded', { 
          winner: winner,
          gameState: room.gameState 
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('forfeit', () => {
    try {
      const player = players.get(socket.id);
      if (!player || !player.roomId) {
        throw new Error('Player not in a room');
      }
      
      const room = rooms.get(player.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      // Find the other player as the winner
      const otherPlayer = room.players.find(p => p.id !== socket.id);
      if (otherPlayer) {
        io.to(player.roomId).emit('gameEnded', { 
          winner: otherPlayer.id,
          reason: 'forfeit',
          gameState: room.gameState 
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handlePlayerLeaving(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
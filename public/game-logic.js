// Game Logic - Core game mechanics and state management

// Game Constants
const BOARD_SIZE = 30;
const PHASE_1_ENERGY = 5;
const PHASE_2_ENERGY = 7;
const MAX_HEALTH = 100;
const HAND_SIZE = 5;

// Game State
let gameState = {
  phase: 1,
  turn: 1,
  currentPlayer: null,
  players: {},
  board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
  gameStarted: false,
  selectedUnit: null,
  placingCard: null,
  gameLog: []
};

// Player Data Structure
function createPlayer(id, name, deck) {
  return {
    id: id,
    name: name,
    health: MAX_HEALTH,
    energy: PHASE_1_ENERGY,
    maxEnergy: PHASE_1_ENERGY,
    deck: [...deck],
    hand: [],
    unitsOnBoard: [],
    isReady: false,
    territory: id === Object.keys(gameState.players)[0] ? 'top' : 'bottom'
  };
}

// Game Initialization
function initializeGame(player1, player2) {
  gameState = {
    phase: 1,
    turn: 1,
    currentPlayer: player1.id,
    players: {
      [player1.id]: createPlayer(player1.id, player1.name, player1.deck),
      [player2.id]: createPlayer(player2.id, player2.name, player2.deck)
    },
    board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
    gameStarted: true,
    selectedUnit: null,
    placingCard: null,
    gameLog: []
  };
  
  // Draw initial hands
  Object.values(gameState.players).forEach(player => {
    drawCards(player.id, HAND_SIZE);
  });
  
  addToGameLog('Game started! Phase 1 begins.');
  addToGameLog(`${gameState.players[gameState.currentPlayer].name}'s turn.`);
  
  return gameState;
}

// Card Drawing
function drawCards(playerId, count) {
  const player = gameState.players[playerId];
  if (!player) return;
  
  for (let i = 0; i < count && player.deck.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * player.deck.length);
    const card = player.deck.splice(randomIndex, 1)[0];
    player.hand.push(card);
  }
}

// Energy Management
function startTurn(playerId) {
  const player = gameState.players[playerId];
  if (!player) return;
  
  // Restore energy based on phase
  player.energy = gameState.phase === 1 ? PHASE_1_ENERGY : PHASE_2_ENERGY;
  player.maxEnergy = player.energy;
  
  // Draw a card
  drawCards(playerId, 1);
  
  // Reset unit movement in phase 2
  if (gameState.phase === 2) {
    player.unitsOnBoard.forEach(unit => {
      unit.hasMovedThisTurn = false;
      unit.hasAttackedThisTurn = false;
    });
  }
  
  addToGameLog(`${player.name} starts turn ${gameState.turn} with ${player.energy} energy.`);
}

// Card Placement
function canPlaceCard(card, x, y, playerId) {
  const player = gameState.players[playerId];
  if (!player) return false;
  
  // Check energy cost
  if (player.energy < card.energyCost) {
    return { valid: false, reason: 'Not enough energy' };
  }
  
  // Check if position is valid
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return { valid: false, reason: 'Position out of bounds' };
  }
  
  // Check if position is occupied
  if (gameState.board[y][x] !== null) {
    return { valid: false, reason: 'Position already occupied' };
  }
  
  // Check territory restrictions for phase 1
  if (gameState.phase === 1) {
    const isInPlayerTerritory = player.territory === 'top' ? 
      y < BOARD_SIZE / 2 : y >= BOARD_SIZE / 2;
    
    if (!isInPlayerTerritory && (card.type === 'Melee' || card.type === 'Ranged' || card.type === 'Flying' || card.type === 'Building')) {
      return { valid: false, reason: 'Can only place units in your territory during Phase 1' };
    }
  }
  
  // Check card type restrictions
  if (gameState.phase === 1 && !['Melee', 'Ranged', 'Flying', 'Building'].includes(card.type)) {
    return { valid: false, reason: 'Can only place unit and building cards in Phase 1' };
  }
  
  return { valid: true };
}

function placeCard(cardIndex, x, y, playerId) {
  const player = gameState.players[playerId];
  if (!player || cardIndex >= player.hand.length) return false;
  
  const card = player.hand[cardIndex];
  const placementCheck = canPlaceCard(card, x, y, playerId);
  
  if (!placementCheck.valid) {
    return { success: false, reason: placementCheck.reason };
  }
  
  // Create unit from card
  const unit = createUnitFromCard(card, x, y, playerId);
  
  // Place unit on board
  gameState.board[y][x] = unit;
  player.unitsOnBoard.push(unit);
  
  // Remove card from hand and deduct energy
  player.hand.splice(cardIndex, 1);
  player.energy -= card.energyCost;
  
  addToGameLog(`${player.name} placed ${card.name} at (${x}, ${y})`);
  
  return { success: true, unit: unit };
}

function createUnitFromCard(card, x, y, playerId) {
  const unit = {
    id: `unit_${Date.now()}_${Math.random()}`,
    name: card.name,
    type: card.type,
    x: x,
    y: y,
    ownerId: playerId,
    health: card.health || 1,
    maxHealth: card.health || 1,
    damage: card.damage || 0,
    speed: card.speed || 1,
    range: card.range || 1,
    hasMovedThisTurn: false,
    hasAttackedThisTurn: false,
    effects: [...(card.effects || [])],
    originalCard: { ...card }
  };
  
  return unit;
}

// Unit Movement (Phase 2)
function canMoveUnit(unit, newX, newY) {
  if (gameState.phase !== 2) {
    return { valid: false, reason: 'Units can only move in Phase 2' };
  }
  
  if (unit.hasMovedThisTurn) {
    return { valid: false, reason: 'Unit has already moved this turn' };
  }
  
  // Check bounds
  if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) {
    return { valid: false, reason: 'Position out of bounds' };
  }
  
  // Check if destination is occupied
  if (gameState.board[newY][newX] !== null) {
    return { valid: false, reason: 'Destination is occupied' };
  }
  
  // Check movement distance
  const distance = Math.abs(unit.x - newX) + Math.abs(unit.y - newY);
  if (distance > unit.speed) {
    return { valid: false, reason: `Unit can only move ${unit.speed} spaces` };
  }
  
  return { valid: true };
}

function moveUnit(unitId, newX, newY) {
  const unit = findUnitById(unitId);
  if (!unit) return { success: false, reason: 'Unit not found' };
  
  const moveCheck = canMoveUnit(unit, newX, newY);
  if (!moveCheck.valid) {
    return { success: false, reason: moveCheck.reason };
  }
  
  // Update board
  gameState.board[unit.y][unit.x] = null;
  gameState.board[newY][newX] = unit;
  
  // Update unit position
  unit.x = newX;
  unit.y = newY;
  unit.hasMovedThisTurn = true;
  
  const player = gameState.players[unit.ownerId];
  addToGameLog(`${player.name}'s ${unit.name} moved to (${newX}, ${newY})`);
  
  return { success: true };
}

// Combat System
function canAttack(attacker, targetX, targetY) {
  if (attacker.hasAttackedThisTurn) {
    return { valid: false, reason: 'Unit has already attacked this turn' };
  }
  
  const target = gameState.board[targetY][targetX];
  if (!target) {
    return { valid: false, reason: 'No target at that position' };
  }
  
  if (target.ownerId === attacker.ownerId) {
    return { valid: false, reason: 'Cannot attack your own units' };
  }
  
  // Check range
  const distance = Math.abs(attacker.x - targetX) + Math.abs(attacker.y - targetY);
  if (distance > attacker.range) {
    return { valid: false, reason: `Target is out of range (${attacker.range})` };
  }
  
  return { valid: true };
}

function attackUnit(attackerId, targetX, targetY) {
  const attacker = findUnitById(attackerId);
  if (!attacker) return { success: false, reason: 'Attacker not found' };
  
  const attackCheck = canAttack(attacker, targetX, targetY);
  if (!attackCheck.valid) {
    return { success: false, reason: attackCheck.reason };
  }
  
  const target = gameState.board[targetY][targetX];
  const attackerPlayer = gameState.players[attacker.ownerId];
  const targetPlayer = gameState.players[target.ownerId];
  
  // Deal damage
  target.health -= attacker.damage;
  attacker.hasAttackedThisTurn = true;
  
  addToGameLog(`${attackerPlayer.name}'s ${attacker.name} attacks ${targetPlayer.name}'s ${target.name} for ${attacker.damage} damage`);
  
  // Check if target is destroyed
  if (target.health <= 0) {
    destroyUnit(target);
    addToGameLog(`${target.name} is destroyed!`);
  }
  
  return { success: true, damage: attacker.damage, targetDestroyed: target.health <= 0 };
}

function destroyUnit(unit) {
  // Remove from board
  gameState.board[unit.y][unit.x] = null;
  
  // Remove from player's unit list
  const player = gameState.players[unit.ownerId];
  const index = player.unitsOnBoard.findIndex(u => u.id === unit.id);
  if (index !== -1) {
    player.unitsOnBoard.splice(index, 1);
  }
}

// Turn Management
function endTurn() {
  const currentPlayerId = gameState.currentPlayer;
  const playerIds = Object.keys(gameState.players);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  
  // Check if all players have taken their turn
  if (nextIndex === 0) {
    gameState.turn++;
    
    // Check for phase transition (after turn 10)
    if (gameState.turn > 10 && gameState.phase === 1) {
      gameState.phase = 2;
      addToGameLog('Phase 2 begins! Units can now move and new card types are available.');
    }
  }
  
  gameState.currentPlayer = playerIds[nextIndex];
  startTurn(gameState.currentPlayer);
  
  return gameState;
}

// Win Condition Check
function checkWinCondition() {
  const playerIds = Object.keys(gameState.players);
  
  for (let playerId of playerIds) {
    const player = gameState.players[playerId];
    
    // Check if player has no units left
    if (player.unitsOnBoard.length === 0 && gameState.phase === 2) {
      const winner = playerIds.find(id => id !== playerId);
      return { gameEnded: true, winner: winner, reason: 'Army eliminated' };
    }
    
    // Check if player's health reached 0 (if direct damage is implemented)
    if (player.health <= 0) {
      const winner = playerIds.find(id => id !== playerId);
      return { gameEnded: true, winner: winner, reason: 'Health depleted' };
    }
  }
  
  return { gameEnded: false };
}

// Utility Functions
function findUnitById(unitId) {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const unit = gameState.board[y][x];
      if (unit && unit.id === unitId) {
        return unit;
      }
    }
  }
  return null;
}

function getUnitsInRange(x, y, range, excludeOwnerId = null) {
  const units = [];
  
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
        const unit = gameState.board[newY][newX];
        if (unit && unit.ownerId !== excludeOwnerId) {
          const distance = Math.abs(dx) + Math.abs(dy);
          if (distance <= range) {
            units.push({ unit, distance });
          }
        }
      }
    }
  }
  
  return units;
}

function addToGameLog(message) {
  const logEntry = {
    turn: gameState.turn,
    phase: gameState.phase,
    message: message,
    timestamp: Date.now()
  };
  
  gameState.gameLog.push(logEntry);
  
  // Keep only last 50 log entries
  if (gameState.gameLog.length > 50) {
    gameState.gameLog.shift();
  }
}

function getValidPlacementPositions(card, playerId) {
  const validPositions = [];
  const player = gameState.players[playerId];
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const check = canPlaceCard(card, x, y, playerId);
      if (check.valid) {
        validPositions.push({ x, y });
      }
    }
  }
  
  return validPositions;
}

function getValidMovePositions(unit) {
  const validPositions = [];
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const check = canMoveUnit(unit, x, y);
      if (check.valid) {
        validPositions.push({ x, y });
      }
    }
  }
  
  return validPositions;
}

function getValidAttackTargets(unit) {
  const validTargets = [];
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const check = canAttack(unit, x, y);
      if (check.valid) {
        validTargets.push({ x, y, target: gameState.board[y][x] });
      }
    }
  }
  
  return validTargets;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    initializeGame,
    placeCard,
    moveUnit,
    attackUnit,
    endTurn,
    checkWinCondition,
    canPlaceCard,
    canMoveUnit,
    canAttack,
    findUnitById,
    getValidPlacementPositions,
    getValidMovePositions,
    getValidAttackTargets,
    BOARD_SIZE,
    PHASE_1_ENERGY,
    PHASE_2_ENERGY
  };
}
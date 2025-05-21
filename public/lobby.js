// Online Play Variables
let socket = null;
let currentRoom = null;
let playerData = {
  id: null,
  name: null,
  deck: [],
  isReady: false
};


// DOM Elements for Online Play
const modeButtons = document.querySelectorAll('.mode-btn');
const deckBuilderContainer = document.getElementById('deck-builder-container');
const onlineContainer = document.getElementById('online-container');
const roomSelection = document.getElementById('room-selection');
const gameLobby = document.getElementById('game-lobby');
const gameBoard = document.getElementById('game-board');
const roomIdInput = document.getElementById('room-id-input');
const joinRoomBtn = document.getElementById('join-room-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const deckSelector = document.getElementById('deck-selector');
const connectionStatus = document.getElementById('connection-status');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const currentRoomId = document.getElementById('current-room-id');
const playerList = document.getElementById('player-list');
const readyBtn = document.getElementById('ready-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn');
const messageOverlay = document.getElementById('message-overlay');
const messageContent = document.getElementById('message-content');

// Game Board Elements
const turnDisplay = document.getElementById('turn-display');
const currentPlayerDisplay = document.getElementById('current-player-display');
const yourHealth = document.getElementById('your-health');
const yourEnergy = document.getElementById('your-energy');
const opponentHealth = document.getElementById('opponent-health');
const endTurnBtn = document.getElementById('end-turn-btn');
const forfeitBtn = document.getElementById('forfeit-btn');
const opponentField = document.getElementById('opponent-field');
const yourField = document.getElementById('your-field');
const handCards = document.getElementById('hand-cards');

// Initialize Socket Connection
function initializeSocket() {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return;
  }
  
  try {
    // Disconnect existing socket if it exists
    if (socket) {
      socket.disconnect();
    }
    
    socket = io({
      transports: ['websocket', 'polling'], // Allow fallback to polling
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setupSocketEventListeners();
    updateConnectionStatus('connecting', 'Connecting...');
    console.log('Socket initialization started');
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    updateConnectionStatus('disconnected', 'Connection failed');
    showMessage('Failed to connect to server. Please check if the server is running.', 'error');
  }
}

// Socket Event Listeners
function setupSocketEventListeners() {
  if (!socket) return;
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    updateConnectionStatus('connected', 'Connected');
    playerData.id = socket.id;
    showMessage('Connected to server!', 'success');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    updateConnectionStatus('disconnected', 'Disconnected');
    if (currentRoom) {
      showMessage('Connection lost. Returning to lobby.', 'error');
      leaveRoom();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    updateConnectionStatus('disconnected', 'Connection failed');
    showMessage('Failed to connect to server. Please try again.', 'error');
  });

  socket.on('roomCreated', (data) => {
    console.log('Room created:', data);
    currentRoom = data.roomId;
    joinLobby(data.roomId);
    showMessage(`Room created: ${data.roomId}`, 'success');
  });

  socket.on('joinedRoom', (data) => {
    console.log('Joined room:', data);
    currentRoom = data.roomId;
    joinLobby(data.roomId);
    updatePlayerList(data.players);
    showMessage(`Joined room: ${data.roomId}`, 'success');
  });

  socket.on('playerJoined', (data) => {
    updatePlayerList(data.players);
    showMessage(`${data.playerName} joined the room`, 'info');
  });

  socket.on('playerLeft', (data) => {
    updatePlayerList(data.players);
    showMessage(`${data.playerName} left the room`, 'info');
  });

  socket.on('playerReady', (data) => {
    updatePlayerList(data.players);
    if (data.allReady && data.players.length === 2) {
      showMessage('All players ready! Starting game...', 'success');
      setTimeout(() => startGame(data.gameState), 2000);
    }
  });

  socket.on('gameStarted', (data) => {
    console.log('Game started:', data);
    startGame(data.gameState);
  });

  socket.on('gameStateUpdate', (data) => {
    updateGameState(data.gameState);
  });

  socket.on('cardPlayed', (data) => {
    handleCardPlayed(data);
  });

  socket.on('turnChanged', (data) => {
    handleTurnChange(data);
  });

  socket.on('gameEnded', (data) => {
    handleGameEnd(data);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    showMessage(error.message || 'An error occurred', 'error');
  });
}

// Mode Switching
function setupModeButtons() {
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.id;
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (mode === 'deck-builder-mode-btn') {
        showDeckBuilder();
      } else if (mode === 'online-play-mode-btn') {
        showOnlinePlay();
      }
    });
  });
}

function showDeckBuilder() {
  deckBuilderContainer.classList.remove('hidden');
  onlineContainer.classList.add('hidden');
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function showOnlinePlay() {
  deckBuilderContainer.classList.add('hidden');
  onlineContainer.classList.remove('hidden');
  roomSelection.classList.remove('hidden');
  gameLobby.classList.add('hidden');
  gameBoard.classList.add('hidden');
  
  // Load deck options first
  loadDeckOptions();
  
  // Then initialize socket
  setTimeout(() => {
    initializeSocket();
  }, 100);
}

// Deck Management for Online Play
function loadDeckOptions() {
  console.log('Loading deck options...');
  const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
  console.log('Found saved decks:', savedDecks);
  
  deckSelector.innerHTML = '<option value="">Choose a saved deck...</option>';
  
  savedDecks.forEach((deck, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${deck.name} (${deck.cards.length} cards)`;
    deckSelector.appendChild(option);
  });
  
  if (savedDecks.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "No saved decks available";
    option.disabled = true;
    deckSelector.appendChild(option);
  }
}

function getSelectedDeck() {
  const selectedIndex = deckSelector.value;
  if (!selectedIndex && selectedIndex !== '0') {
    console.log('No deck selected');
    return null;
  }
  
  const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
  const savedDeck = savedDecks[selectedIndex];
  
  if (!savedDeck) {
    console.log('Saved deck not found at index:', selectedIndex);
    return null;
  }
  
  console.log('Selected deck:', savedDeck);
  
  // Convert saved deck format to card objects
  // Note: You'll need to make sure allCards is available in this scope
  if (typeof allCards === 'undefined') {
    console.error('allCards is not defined. Make sure card-classes.js is loaded.');
    return null;
  }
  
  const deck = savedDeck.cards.map(cardData => 
    allCards.find(c => c.name === cardData.name && c.type === cardData.type)
  ).filter(Boolean);
  
  console.log('Converted deck to card objects:', deck);
  return deck;
}

// Room Management
function createRoom() {
  console.log('Create room button clicked');
  
  // Check socket connection
  if (!socket) {
    showMessage('Not connected to server. Please wait...', 'error');
    initializeSocket();
    return;
  }
  
  if (!socket.connected) {
    showMessage('Connecting to server. Please wait...', 'error');
    return;
  }
  
  const selectedDeck = getSelectedDeck();
  console.log('Selected deck for room creation:', selectedDeck);
  
  if (!selectedDeck || selectedDeck.length === 0) {
    showMessage('Please select a valid deck', 'error');
    return;
  }
  
  if (selectedDeck.length < 10) { // Reduced minimum for testing
    showMessage(`Deck must have at least 10 cards (currently has ${selectedDeck.length})`, 'error');
    return;
  }
  
  playerData.deck = selectedDeck;
  playerData.name = `Player ${Math.floor(Math.random() * 1000)}`;
  
  console.log('Emitting createRoom event:', {
    playerName: playerData.name,
    deck: selectedDeck
  });
  
  // Show loading message
  showMessage('Creating room...', 'info');
  
  socket.emit('createRoom', { 
    playerName: playerData.name,
    deck: selectedDeck 
  });
}

function joinRoom() {
  console.log('Join room button clicked');
  
  const roomId = roomIdInput.value.trim();
  const selectedDeck = getSelectedDeck();
  
  if (!roomId) {
    showMessage('Please enter a room ID', 'error');
    return;
  }
  
  if (!socket || !socket.connected) {
    showMessage('Not connected to server. Please wait...', 'error');
    return;
  }
  
  if (!selectedDeck || selectedDeck.length === 0) {
    showMessage('Please select a valid deck', 'error');
    return;
  }
  
  if (selectedDeck.length < 10) { // Reduced minimum for testing
    showMessage(`Deck must have at least 10 cards (currently has ${selectedDeck.length})`, 'error');
    return;
  }
  
  playerData.deck = selectedDeck;
  playerData.name = `Player ${Math.floor(Math.random() * 1000)}`;
  
  console.log('Emitting joinRoom event');
  showMessage('Joining room...', 'info');
  
  socket.emit('joinRoom', { 
    roomId, 
    playerName: playerData.name,
    deck: selectedDeck 
  });
}

function leaveRoom() {
  console.log('Leaving room');
  if (socket && currentRoom) {
    socket.emit('leaveRoom');
  }
  currentRoom = null;
  playerData.isReady = false;
  roomSelection.classList.remove('hidden');
  gameLobby.classList.add('hidden');
  gameBoard.classList.add('hidden');
}

function joinLobby(roomId) {
  console.log('Joining lobby:', roomId);
  currentRoomId.textContent = roomId;
  roomSelection.classList.add('hidden');
  gameLobby.classList.remove('hidden');
  gameBoard.classList.add('hidden');
}

// Player Management
function updatePlayerList(players) {
  console.log('Updating player list:', players);
  playerList.innerHTML = '';
  
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.className = 'player-item';
    playerElement.innerHTML = `
      <div class="player-info">
        <span class="player-name">${player.name}</span>
        <span class="player-status ${player.isReady ? 'ready' : 'not-ready'}">
          ${player.isReady ? '✓ Ready' : '⏳ Not Ready'}
        </span>
      </div>
    `;
    playerList.appendChild(playerElement);
  });
  
  // Update ready button state
  const currentPlayer = players.find(p => p.id === playerData.id);
  if (currentPlayer) {
    playerData.isReady = currentPlayer.isReady;
    readyBtn.textContent = playerData.isReady ? 'Not Ready' : 'Ready';
    readyBtn.className = playerData.isReady ? 'ready-btn ready' : 'ready-btn';
  }
  
  // Check if all players are ready
  if (players.length === 2 && players.every(p => p.isReady)) {
    const allReadyElement = document.createElement('div');
    allReadyElement.className = 'all-players-joined';
    allReadyElement.textContent = 'All players ready! Game starting...';
    playerList.appendChild(allReadyElement);
  }
}

function toggleReady() {
  console.log('Toggle ready clicked');
  if (!currentRoom || !socket || !socket.connected) {
    showMessage('Not connected to a room', 'error');
    return;
  }
  
  playerData.isReady = !playerData.isReady;
  console.log('Emitting playerReady:', playerData.isReady);
  socket.emit('playerReady', { isReady: playerData.isReady });
}

// Game State Management
function startGame(initialGameState) {
  console.log('Starting game with state:', initialGameState);
  gameState = initialGameState;
  gameLobby.classList.add('hidden');
  gameBoard.classList.remove('hidden');
  
  // Initialize player stats
  const currentPlayer = gameState.players[playerData.id];
  if (currentPlayer) {
    yourHealth.textContent = currentPlayer.health;
    yourEnergy.textContent = currentPlayer.energy;
  }
  
  // Update opponent stats
  const opponentId = Object.keys(gameState.players).find(id => id !== playerData.id);
  if (opponentId && gameState.players[opponentId]) {
    opponentHealth.textContent = gameState.players[opponentId].health;
  }
  
  updateGameUI();
  drawInitialHand();
}

function updateGameState(newGameState) {
  gameState = newGameState;
  updateGameUI();
}

function updateGameUI() {
  // Update turn info
  turnDisplay.textContent = `Turn ${gameState.turn} - Phase ${gameState.phase}`;
  currentPlayerDisplay.textContent = gameState.currentPlayer === playerData.id ? 'Your Turn' : "Opponent's Turn";
  
  // Update player stats
  const currentPlayer = gameState.players[playerData.id];
  if (currentPlayer) {
    yourHealth.textContent = currentPlayer.health;
    yourEnergy.textContent = currentPlayer.energy;
  }
  
  // Update opponent stats
  const opponentId = Object.keys(gameState.players).find(id => id !== playerData.id);
  if (opponentId && gameState.players[opponentId]) {
    opponentHealth.textContent = gameState.players[opponentId].health;
  }
  
  // Enable/disable end turn button
  endTurnBtn.disabled = gameState.currentPlayer !== playerData.id;
  
  // Update board
  updateBoardDisplay();
}

function drawInitialHand() {
  // Draw 5 cards from deck
  const currentPlayer = gameState.players[playerData.id];
  if (currentPlayer && currentPlayer.hand) {
    updateHandDisplay(currentPlayer.hand);
  }
}

function updateHandDisplay(hand) {
  handCards.innerHTML = '';
  
  hand.forEach((card, index) => {
    const cardElement = createHandCardElement(card, index);
    handCards.appendChild(cardElement);
  });
}

function createHandCardElement(card, index) {
  const cardElement = document.createElement('div');
  cardElement.className = 'hand-card card';
  cardElement.dataset.cardIndex = index;
  
  cardElement.innerHTML = `
    <div class="card-header">
      <div class="card-name">${card.name}</div>
      <div class="card-cost">${card.energyCost}</div>
    </div>
    <div class="card-type">${card.type}</div>
    <div class="card-stats">
      ${card.health ? `<span>H: ${card.health}</span>` : ''}
      ${card.damage ? `<span>D: ${card.damage}</span>` : ''}
      ${card.speed ? `<span>S: ${card.speed}</span>` : ''}
      ${card.range ? `<span>R: ${card.range}</span>` : ''}
    </div>
  `;
  
  // Add click listener for playing cards
  cardElement.addEventListener('click', () => playCard(index));
  
  return cardElement;
}

function updateBoardDisplay() {
  // Clear both fields
  yourField.innerHTML = '';
  opponentField.innerHTML = '';
  
  // Create grid cells
  for (let i = 0; i < 25; i++) { // 5x5 grid for display
    const yourCell = document.createElement('div');
    yourCell.className = 'field-cell';
    yourCell.dataset.position = i;
    yourField.appendChild(yourCell);
    
    const opponentCell = document.createElement('div');
    opponentCell.className = 'field-cell';
    opponentCell.dataset.position = i;
    opponentField.appendChild(opponentCell);
  }
  
  // Add units to the board (simplified for 5x5 display)
  // In a real implementation, you'd map the 30x30 board to the display grid
}

// Game Actions
function playCard(cardIndex) {
  if (gameState.currentPlayer !== playerData.id) {
    showMessage("It's not your turn!", 'error');
    return;
  }
  
  const currentPlayer = gameState.players[playerData.id];
  const card = currentPlayer.hand[cardIndex];
  
  if (!card) return;
  
  if (currentPlayer.energy < card.energyCost) {
    showMessage('Not enough energy to play this card!', 'error');
    return;
  }
  
  // For now, just play the card to a random position
  // In a full implementation, you'd have position selection
  const position = { x: Math.floor(Math.random() * 5), y: Math.floor(Math.random() * 5) };
  
  socket.emit('playCard', {
    cardIndex,
    position
  });
}

function endTurn() {
  if (gameState.currentPlayer !== playerData.id) return;
  
  socket.emit('endTurn');
}

function forfeitGame() {
  if (confirm('Are you sure you want to forfeit the game?')) {
    socket.emit('forfeit');
  }
}

// Game Event Handlers
function handleCardPlayed(data) {
  showMessage(`${data.playerName} played ${data.card.name}`, 'info');
  updateGameState(data.gameState);
}

function handleTurnChange(data) {
  updateGameState(data.gameState);
  
  if (data.newPhase) {
    showMessage(`Phase ${data.gameState.phase} begins!`, 'info');
  }
}

function handleGameEnd(data) {
  const message = data.winner === playerData.id ? 'You won!' : 'You lost!';
  showMessage(message, data.winner === playerData.id ? 'success' : 'error');
  
  setTimeout(() => {
    leaveRoom();
  }, 3000);
}

// UI Helpers
function updateConnectionStatus(status, text) {
  if (statusIndicator && statusText) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
  }
}

function showMessage(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  if (messageContent && messageOverlay) {
    messageContent.textContent = message;
    messageContent.className = `message-content ${type}`;
    messageOverlay.classList.remove('hidden');
    
    setTimeout(() => {
      messageOverlay.classList.add('hidden');
    }, 3000);
  } else {
    // Fallback to alert if message overlay isn't available
    alert(message);
  }
}

// Event Listeners Setup for Online Play
function setupOnlineEventListeners() {
  console.log('Setting up online event listeners');
  
  // Check if elements exist before adding listeners
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', createRoom);
    console.log('Create room button listener added');
  } else {
    console.error('Create room button not found');
  }
  
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', joinRoom);
  }
  
  if (readyBtn) {
    readyBtn.addEventListener('click', toggleReady);
  }
  
  if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', leaveRoom);
  }
  
  if (endTurnBtn) {
    endTurnBtn.addEventListener('click', endTurn);
  }
  
  if (forfeitBtn) {
    forfeitBtn.addEventListener('click', forfeitGame);
  }
  
  // Close message overlay on click
  if (messageOverlay) {
    messageOverlay.addEventListener('click', () => {
      messageOverlay.classList.add('hidden');
    });
  }
  
  // Enter key for room joining
  if (roomIdInput) {
    roomIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') joinRoom();
    });
  }
}

// Initialize everything
function initializeOnlinePlay() {
  console.log('Initializing online play');
  setupOnlineEventListeners();
  setupModeButtons();
  
  // Check if we're starting in online mode
  const onlineModeBtn = document.getElementById('online-play-mode-btn');
  if (onlineModeBtn && onlineModeBtn.classList.contains('active')) {
    showOnlinePlay();
  }
}

// Add to existing initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing online play');
  initializeOnlinePlay();
});

// Debug function to check connection status
function checkConnection() {
  if (socket) {
    console.log('Socket exists:', socket.connected);
    console.log('Socket ID:', socket.id);
  } else {
    console.log('Socket is null');
  }
}

// Make debug function available globally
window.checkConnection = checkConnection;
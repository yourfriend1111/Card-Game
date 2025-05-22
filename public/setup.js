// Core Deck Builder Variables
let phase1Deck = [];
let phase2Deck = [];
let currentFilter = 'all';
let searchTerm = '';
let phase1DrawPile = [];
let phase2DrawPile = [];
let phase1Hand = []; // New: persistent hand for phase 1
let phase2Hand = []; // New: persistent hand for phase 2
let selectedCard = null;
let currentPhase = 1; // Phase 1: Combat units, Phase 2: Support cards

// Phase configuration
const PHASE_CONFIG = {
  1: {
    name: "Combat Phase",
    description: "Build your army with combat units (0-40 cards)",
    allowedTypes: ['Melee', 'Ranged', 'Flying', 'Building'],
    minCards: 0,
    maxCards: 40
  },
  2: {
    name: "Support Phase", 
    description: "Add support cards to enhance your strategy (0-40 cards)",
    allowedTypes: ['Elite', 'Terrain', 'Equipment', 'Buff', 'Debuff'],
    minCards: 0,
    maxCards: 40
  }
};

// DOM Elements
const cardCollection = document.getElementById('card-collection');
const currentDeckElement = document.getElementById('current-deck');
const cardCountElement = document.getElementById('card-count');
const avgEnergyElement = document.getElementById('avg-energy');
const typeDistributionElement = document.getElementById('type-distribution');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const saveButton = document.getElementById('save-deck-btn');
const clearButton = document.getElementById('clear-deck-btn');
const deckNameInput = document.getElementById('deck-name');
const savedDecksList = document.getElementById('saved-decks-list');
const drawCardsBtn = document.getElementById('draw-cards-btn');
const cardDrawer = document.getElementById('card-drawer');
const drawnCardsElement = document.getElementById('drawn-cards');
const drawMoreBtn = document.getElementById('draw-more-btn');
const shuffleDeckBtn = document.getElementById('shuffle-deck-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const deckDrawInfo = document.getElementById('deck-draw-info');
const cardPreviewContainer = document.getElementById('card-preview-container');
const cardPreviewImage = document.getElementById('card-preview-image');
const cardPreviewInfo = document.getElementById('card-preview-info');

// Helper functions to get current deck
function getCurrentDeck() {
  return currentPhase === 1 ? phase1Deck : phase2Deck;
}

function setCurrentDeck(deck) {
  if (currentPhase === 1) {
    phase1Deck = deck;
  } else {
    phase2Deck = deck;
  }
}

function getCurrentDrawPile() {
  return currentPhase === 1 ? phase1DrawPile : phase2DrawPile;
}

function setCurrentDrawPile(pile) {
  if (currentPhase === 1) {
    phase1DrawPile = pile;
  } else {
    phase2DrawPile = pile;
  }
}

// New: Helper functions for hand management
function getCurrentHand() {
  return currentPhase === 1 ? phase1Hand : phase2Hand;
}

function setCurrentHand(hand) {
  if (currentPhase === 1) {
    phase1Hand = hand;
  } else {
    phase2Hand = hand;
  }
}

// Phase management functions
function switchPhase(newPhase) {
  if (newPhase === currentPhase) return;
  
  currentPhase = newPhase;
  updatePhaseUI();
  renderCardCollection();
  updateDeck();
  updateCardPreview(selectedCard); // Refresh preview for new phase context
  
  // Update hand display if drawer is open
  if (!cardDrawer.classList.contains('hidden')) {
    updateHandDisplay();
  }
}

function updatePhaseUI() {
  const config = PHASE_CONFIG[currentPhase];
  
  // Update phase indicator
  const phaseIndicator = document.getElementById('phase-indicator');
  if (phaseIndicator) {
    phaseIndicator.innerHTML = `
      <div class="phase-title">${config.name}</div>
      <div class="phase-description">${config.description}</div>
      <div class="phase-allowed-types">
        Allowed: ${config.allowedTypes.join(', ')}
      </div>
    `;
  }
  
  // Update phase buttons
  document.querySelectorAll('.phase-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.phase) === currentPhase);
  });
  
  // Update filter buttons to show only relevant types
  filterButtons.forEach(btn => {
    const filterType = btn.dataset.filter;
    if (filterType === 'all') {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = config.allowedTypes.includes(filterType) ? 'inline-block' : 'none';
    }
  });
  
  // Reset filter to 'all' when switching phases
  currentFilter = 'all';
  filterButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
}

function canAddCardToDeck(card) {
  const config = PHASE_CONFIG[currentPhase];
  const currentDeck = getCurrentDeck();
  
  // Check if card type is allowed in current phase
  if (!config.allowedTypes.includes(card.type)) {
    return {
      canAdd: false,
      reason: `${card.type} cards can only be added in ${card.type === 'Equipment' || card.type === 'Buff' || card.type === 'Debuff' || card.type === 'Terrain' || card.type === 'Elite' ? 'Support Phase' : 'Combat Phase'}`
    };
  }
  
  // Check phase-specific card limits
  if (currentDeck.length >= config.maxCards) {
    return {
      canAdd: false,
      reason: `${config.name} deck is full (${config.maxCards} cards max)`
    };
  }
  
  // Check individual card limit
  const cardCount = currentDeck.filter(c => c.name === card.name).length;
  if (cardCount >= 3) {
    return {
      canAdd: false,
      reason: `You can only have 3 copies of ${card.name} in your ${config.name.toLowerCase()} deck`
    };
  }
  
  return { canAdd: true };
}

// Card Element Creation Functions
function createCardElement(card, isInHand = false) {
  const cardElement = document.createElement('div');
  cardElement.className = 'card';
  cardElement.dataset.cardName = card.name;
  
  // Add different styling for hand cards
  if (isInHand) {
    cardElement.classList.add('hand-card');
  }
  
  // Add visual indicator for phase compatibility
  const config = PHASE_CONFIG[currentPhase];
  const isAllowed = config.allowedTypes.includes(card.type);
  
  if (!isAllowed && !isInHand) {
    cardElement.classList.add('phase-disabled');
  }

  if (card.imageUrl && card.imageUrl.trim()) {
    const img = document.createElement('img');
    img.src = card.imageUrl;
    img.alt = card.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    cardElement.appendChild(img);
    
    // Add phase indicator overlay for images (not in hand)
    if (!isAllowed && !isInHand) {
      const overlay = document.createElement('div');
      overlay.className = 'phase-overlay';
      overlay.textContent = 'Wrong Phase';
      cardElement.appendChild(overlay);
    }

    // Add play button overlay for hand cards
    if (isInHand) {
      const playOverlay = document.createElement('div');
      playOverlay.className = 'play-overlay';
      playOverlay.innerHTML = '<button class="play-btn">Play</button>';
      cardElement.appendChild(playOverlay);
    }
  } else {
    cardElement.innerHTML = `
      <div class="card-header">
        <div class="card-name">${card.name}</div>
        <div class="card-cost">${card.energyCost}</div>
      </div>
      <div class="card-type">${card.type}</div>
      <div class="card-stats">
        <span>H: ${card.health}</span>
        <span>S: ${card.speed}</span>
        <span>D: ${card.damage}</span>
        <span>R: ${card.range}</span>
      </div>
      <div class="card-ability">${card.ability}</div>
      ${!isAllowed && !isInHand ? '<div class="phase-indicator-text">Wrong Phase</div>' : ''}
      ${isInHand ? '<button class="play-btn">Play</button>' : ''}
    `;
  }

  // Event listeners
  if (isInHand) {
    // For hand cards, add play functionality
    const playBtn = cardElement.querySelector('.play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playCard(card);
      });
    }
    
    // Still allow preview on click
    cardElement.addEventListener('click', () => {
      document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
      cardElement.classList.add('selected');
      updateCardPreview(card);
    });
  } else {
    // For collection cards, update preview and select card
    cardElement.addEventListener('click', () => {
      document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
      cardElement.classList.add('selected');
      updateCardPreview(card);
    });
  }

  return cardElement;
}

// Render Functions
function renderCardCollection() {
  cardCollection.innerHTML = '';
  const config = PHASE_CONFIG[currentPhase];
  
  allCards.filter(card => {
    const matchesFilter = currentFilter === 'all' || card.type === currentFilter;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         card.ability.toLowerCase().includes(searchTerm.toLowerCase());
    // Show all cards but visually indicate which are allowed
    return matchesFilter && matchesSearch;
  }).forEach(card => cardCollection.appendChild(createCardElement(card)));
}

function updateDeck() {
  currentDeckElement.innerHTML = '';
  const currentDeck = getCurrentDeck();
  const config = PHASE_CONFIG[currentPhase];
  
  if (currentDeck.length === 0) {
    currentDeckElement.innerHTML = `<div class="empty-deck-message">Click a card to add it to your ${config.name.toLowerCase()} deck</div>`;
    updateDeckStats();
    return;
  }

  // Create header for current phase deck
  const deckHeader = document.createElement('div');
  deckHeader.className = 'deck-phase-header';
  deckHeader.innerHTML = `<h4>${config.name} Deck (${currentDeck.length}/${config.maxCards})</h4>`;
  currentDeckElement.appendChild(deckHeader);
  
  renderDeckSection(currentDeck);
  updateDeckStats();
}

function renderDeckSection(cards) {
  const grouped = {};
  cards.forEach(card => {
    grouped[card.name] = grouped[card.name] || { card, count: 0 };
    grouped[card.name].count++;
  });

  Object.values(grouped).forEach(({ card, count }) => {
    const el = document.createElement('div');
    el.className = 'deck-card';
    el.innerHTML = `
      <div class="deck-card-info">
        <div class="card-name">${card.name} (${card.energyCost})</div>
        <div class="card-type-badge">${card.type}</div>
        <div class="card-count">x${count}</div>
      </div>
      <div class="remove-card" data-card-name="${card.name}">&times;</div>
    `;
    el.querySelector('.remove-card').addEventListener('click', () => removeCardFromDeck(card.name));
    currentDeckElement.appendChild(el);
  });
}

function updateDeckStats() {
  const currentDeck = getCurrentDeck();
  const config = PHASE_CONFIG[currentPhase];
  const phase1Count = phase1Deck.length;
  const phase2Count = phase2Deck.length;
  
  cardCountElement.innerHTML = `
    Current: ${currentDeck.length}/${config.maxCards}<br>
    Combat: ${phase1Count}/${PHASE_CONFIG[1].maxCards}<br>
    Support: ${phase2Count}/${PHASE_CONFIG[2].maxCards}
  `;
  
  const avg = currentDeck.length ? 
    (currentDeck.reduce((s, c) => s + c.energyCost, 0) / currentDeck.length).toFixed(1) : 0;
  avgEnergyElement.textContent = `Avg Energy: ${avg}`;
  
  const typeCount = {};
  currentDeck.forEach(card => typeCount[card.type] = (typeCount[card.type] || 0) + 1);
  typeDistributionElement.textContent = Object.entries(typeCount)
    .map(([type, count]) => `${type}: ${count}`).join(', ') || 'Types: 0';
}

function loadSavedDecks() {
  savedDecksList.innerHTML = '';
  const decks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
  if (decks.length === 0) {
    savedDecksList.innerHTML = '<div class="empty-decks-message">No saved decks</div>';
    return;
  }
  decks.forEach((deck, index) => {
    const el = document.createElement('div');
    el.className = 'saved-deck-item';
    const totalCards = (deck.phase1Cards ? deck.phase1Cards.length : 0) + (deck.phase2Cards ? deck.phase2Cards.length : 0);
    el.innerHTML = `
      <div class="saved-deck-name">${deck.name} (${totalCards} cards)</div>
      <div class="saved-deck-details">
        Combat: ${deck.phase1Cards ? deck.phase1Cards.length : 0} | Support: ${deck.phase2Cards ? deck.phase2Cards.length : 0}
      </div>
      <div class="saved-deck-btns">
        <button class="saved-deck-btn load-btn" data-index="${index}">Load</button>
        <button class="saved-deck-btn delete-btn" data-index="${index}">Delete</button>
      </div>`;
    el.querySelector('.load-btn').addEventListener('click', () => {
      // Load both phase decks
      phase1Deck = (deck.phase1Cards || []).map(data => 
        allCards.find(c => c.name === data.name && c.type === data.type)).filter(Boolean);
      phase2Deck = (deck.phase2Cards || []).map(data => 
        allCards.find(c => c.name === data.name && c.type === data.type)).filter(Boolean);
      updateDeck();
    });
    el.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Delete this deck?')) {
        decks.splice(index, 1);
        localStorage.setItem('savedDecks', JSON.stringify(savedDecks));
        loadSavedDecks();
      }
    });
    savedDecksList.appendChild(el);
  });
}

function updateCardPreview(card) {
  selectedCard = card;
  
  if (!card) {
    cardPreviewContainer.classList.add('empty');
    cardPreviewInfo.innerHTML = '<div class="preview-empty-message">Select a card to view details</div>';
    cardPreviewImage.style.display = 'none';
    return;
  }
  
  cardPreviewContainer.classList.remove('empty');
  
  // Handle image display
  if (card.imageUrl && card.imageUrl.trim()) {
    cardPreviewImage.src = card.imageUrl;
    cardPreviewImage.style.display = 'block';
  } else {
    cardPreviewImage.style.display = 'none';
  }
  
  // Check if card can be added
  const canAdd = canAddCardToDeck(card);
  
  // Update card information
  cardPreviewInfo.innerHTML = `
    <div class="preview-header">
      <div class="preview-name">${card.name}</div>
      <div class="preview-cost">${card.energyCost}</div>
    </div>
    <div class="preview-type">${card.type}</div>
    <div class="preview-stats">
      ${card.health ? `<div class="preview-stat">Health: ${card.health}</div>` : ''}
      ${card.damage ? `<div class="preview-stat">Damage: ${card.damage}</div>` : ''}
      ${card.speed ? `<div class="preview-stat">Speed: ${card.speed}</div>` : ''}
      ${card.range ? `<div class="preview-stat">Range: ${card.range}</div>` : ''}
      ${card.dimension ? `<div class="preview-stat">Area: ${card.dimension}</div>` : ''}
    </div>
    <div class="preview-ability">
      <div class="preview-ability-title">Ability:</div>
      <div class="preview-ability-text">${card.ability}</div>
    </div>
    <div class="preview-actions">
      <button id="preview-add-btn" class="preview-action-btn ${!canAdd.canAdd ? 'disabled' : ''}" 
              ${!canAdd.canAdd ? 'disabled' : ''}>
        ${canAdd.canAdd ? 'Add to Deck' : 'Cannot Add'}
      </button>
      ${!canAdd.canAdd ? `<div class="preview-warning">${canAdd.reason}</div>` : ''}
    </div>
  `;
  
  // Add event listener to the "Add to Deck" button
  const addBtn = document.getElementById('preview-add-btn');
  if (canAdd.canAdd) {
    addBtn.addEventListener('click', () => addCardToDeck(card));
  }
}

// Card Management Functions
function addCardToDeck(card) {
  const canAdd = canAddCardToDeck(card);
  
  if (!canAdd.canAdd) {
    alert(canAdd.reason);
    return;
  }
  
  const currentDeck = getCurrentDeck();
  currentDeck.push(card);
  setCurrentDeck(currentDeck);
  updateDeck();
  updateCardPreview(card); // Refresh preview to update button state
}

function removeCardFromDeck(name) {
  const currentDeck = getCurrentDeck();
  const i = currentDeck.findIndex(card => card.name === name);
  if (i !== -1) {
    currentDeck.splice(i, 1);
    setCurrentDeck(currentDeck);
    updateDeck();
    if (selectedCard && selectedCard.name === name) {
      updateCardPreview(selectedCard); // Refresh preview to update button state
    }
  }
}

// New: Hand management functions
function updateHandDisplay() {
  drawnCardsElement.innerHTML = '';
  const currentHand = getCurrentHand();
  const config = PHASE_CONFIG[currentPhase];
  
  if (currentHand.length === 0) {
    drawnCardsElement.innerHTML = '<div class="empty-hand-message">No cards in hand</div>';
  } else {
    currentHand.forEach(card => {
      drawnCardsElement.appendChild(createCardElement(card, true));
    });
  }
  
  // Update header info
  const drawPile = getCurrentDrawPile();
  deckDrawInfo.innerHTML = `
    ${config.name} - Hand: ${currentHand.length} | Deck remaining: ${drawPile.length}
  `;
}

function playCard(card) {
  const currentHand = getCurrentHand();
  const cardIndex = currentHand.findIndex(c => c.name === card.name && c.type === card.type);
  
  if (cardIndex !== -1) {
    // Remove card from hand
    currentHand.splice(cardIndex, 1);
    setCurrentHand(currentHand);
    
    // Update display
    updateHandDisplay();
    
    // Show feedback
    console.log(`Played: ${card.name}`);
    
    // Optional: Add visual feedback
    const playMessage = document.createElement('div');
    playMessage.className = 'play-message';
    playMessage.textContent = `Played: ${card.name}`;
    playMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 255, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      font-weight: bold;
    `;
    document.body.appendChild(playMessage);
    
    setTimeout(() => {
      document.body.removeChild(playMessage);
    }, 1500);
  }
}

// Modified Card Draw Testing Functions
function drawCards(count = 5) {
  const currentDeck = getCurrentDeck();
  const config = PHASE_CONFIG[currentPhase];
  
  if (currentDeck.length === 0) {
    return alert(`${config.name} deck is empty. Add some cards first.`);
  }
  
  if (currentDeck.length < 5) {
    return alert(`${config.name} deck must have at least 5 cards to test draw.`);
  }
  
  let drawPile = getCurrentDrawPile();
  if (drawPile.length === 0) { 
    drawPile = [...currentDeck]; 
    shuffleDeck(drawPile);
    setCurrentDrawPile(drawPile);
  }
  if (drawPile.length < count) count = drawPile.length;
  
  // Get current hand and add new cards to it
  const currentHand = getCurrentHand();
  
  for (let i = 0; i < count; i++) {
    if (drawPile.length > 0) {
      currentHand.push(drawPile.pop());
    }
  }
  
  setCurrentDrawPile(drawPile);
  setCurrentHand(currentHand);
  
  // Update display
  updateHandDisplay();
  cardDrawer.classList.remove('hidden');
}

function shuffleDeck(pile) {
  for (let i = pile.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
}

// Initialization function
function initCardPreview() {
  // Initial empty state
  updateCardPreview(null);
}

function initPhaseSystem() {
  // Create phase selection UI
  const phaseControls = document.createElement('div');
  phaseControls.className = 'phase-controls';
  phaseControls.innerHTML = `
    <div class="phase-selection">
      <button class="phase-btn active" data-phase="1">Phase 1: Combat</button>
      <button class="phase-btn" data-phase="2">Phase 2: Support</button>
    </div>
    <div class="phase-indicator" id="phase-indicator"></div>
  `;
  
  // Insert phase controls before the app container
  const deckBuilderContainer = document.getElementById('deck-builder-container');
  deckBuilderContainer.parentNode.insertBefore(phaseControls, deckBuilderContainer);
  
  // Add event listeners for phase buttons
  document.querySelectorAll('.phase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const phase = parseInt(btn.dataset.phase);
      switchPhase(phase);
    });
  });
  
  // Initialize phase UI
  updatePhaseUI();
}

// Event Listeners Setup
function setupEventListeners() {
  // Search and Filter
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value;
    renderCardCollection();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderCardCollection();
    });
  });

  // Deck Management
  clearButton.addEventListener('click', () => {
    const config = PHASE_CONFIG[currentPhase];
    if (confirm(`Clear the entire ${config.name.toLowerCase()} deck?`)) {
      setCurrentDeck([]);
      updateDeck();
      updateCardPreview(null);
      // Clear the draw pile and hand for this phase
      setCurrentDrawPile([]);
      setCurrentHand([]);
      if (!cardDrawer.classList.contains('hidden')) {
        updateHandDisplay();
      }
    }
  });

  saveButton.addEventListener('click', () => {
    const deckName = deckNameInput.value.trim() || `Deck ${new Date().toLocaleTimeString()}`;
    if (phase1Deck.length === 0 && phase2Deck.length === 0) {
      return alert('Cannot save empty decks. Add cards to at least one phase.');
    }
    
    const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    const deck = { 
      name: deckName, 
      phase1Cards: phase1Deck.map(c => ({ name: c.name, type: c.type })),
      phase2Cards: phase2Deck.map(c => ({ name: c.name, type: c.type })),
      date: new Date().toISOString() 
    };
    
    const existing = savedDecks.findIndex(d => d.name === deck.name);
    if (existing !== -1 && !confirm('Replace existing deck?')) return;
    
    if (existing !== -1) savedDecks[existing] = deck;
    else savedDecks.push(deck);
    
    localStorage.setItem('savedDecks', JSON.stringify(decks));
    loadSavedDecks();
    deckNameInput.value = '';
  });

  // Card Draw Testing
  drawCardsBtn.addEventListener('click', () => drawCards(5));
  drawMoreBtn.addEventListener('click', () => drawCards(1));
  
  shuffleDeckBtn.addEventListener('click', () => { 
    const currentDeck = getCurrentDeck();
    const newPile = [...currentDeck];
    shuffleDeck(newPile);
    setCurrentDrawPile(newPile);
    // Clear current hand and draw fresh
    setCurrentHand([]);
    drawCards(5); 
  });
  
  closeDrawerBtn.addEventListener('click', () => { 
    cardDrawer.classList.add('hidden'); 
    // Clear hand and draw pile when closing
    setCurrentDrawPile([]);
    setCurrentHand([]);
  });
}

function init() {
  initPhaseSystem();
  renderCardCollection();
  updateDeck();
  loadSavedDecks();
  setupEventListeners();
  initCardPreview();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
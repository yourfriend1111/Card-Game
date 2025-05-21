// Core Deck Builder Variables
let currentDeck = [];
let currentFilter = 'all';
let searchTerm = '';
let drawPile = [];

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

function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = 'card';
  cardElement.dataset.cardName = card.name;

  if (card.imageUrl && card.imageUrl.trim()) {
    const img = document.createElement('img');
    img.src = card.imageUrl;
    img.alt = card.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    cardElement.appendChild(img);
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
    `;
  }

  cardElement.addEventListener('click', () => addCardToDeck(card));

  return cardElement;
}

function addCardToDeck(card) {
  const cardCount = currentDeck.filter(c => c.name === card.name).length;
  if (cardCount >= 3) {
    alert(`You can only have 3 copies of ${card.name} in your deck.`);
    return;
  }
  if (currentDeck.length >= 40) {
    alert('Your deck is full (40 cards max).');
    return;
  }
  currentDeck.push(card);
  updateDeck();
}

function updateDeck() {
  currentDeckElement.innerHTML = '';
  if (currentDeck.length === 0) {
    currentDeckElement.innerHTML = '<div class="empty-deck-message">Click a card to add it to your deck</div>';
    updateDeckStats();
    return;
  }

  const grouped = {};
  currentDeck.forEach(card => {
    grouped[card.name] = grouped[card.name] || { card, count: 0 };
    grouped[card.name].count++;
  });

  Object.values(grouped).forEach(({ card, count }) => {
    const el = document.createElement('div');
    el.className = 'deck-card';
    el.innerHTML = `
      <div class="deck-card-info">
        <div class="card-name">${card.name} (${card.energyCost})</div>
        <div class="card-count">x${count}</div>
      </div>
      <div class="remove-card" data-card-name="${card.name}">&times;</div>
    `;
    el.querySelector('.remove-card').addEventListener('click', () => removeCardFromDeck(card.name));
    currentDeckElement.appendChild(el);
  });

  updateDeckStats();
}

function removeCardFromDeck(name) {
  const i = currentDeck.findIndex(card => card.name === name);
  if (i !== -1) {
    currentDeck.splice(i, 1);
    updateDeck();
  }
}

function updateDeckStats() {
  cardCountElement.textContent = `Cards: ${currentDeck.length}/40`;
  const avg = currentDeck.length ? (currentDeck.reduce((s, c) => s + c.energyCost, 0) / currentDeck.length).toFixed(1) : 0;
  avgEnergyElement.textContent = `Avg Energy: ${avg}`;
  const typeCount = {};
  currentDeck.forEach(card => typeCount[card.type] = (typeCount[card.type] || 0) + 1);
  typeDistributionElement.textContent = Object.entries(typeCount).map(([type, count]) => `${type}: ${count}`).join(', ') || 'Types: 0';
}

function renderCardCollection() {
  cardCollection.innerHTML = '';
  allCards.filter(card => {
    const matchesFilter = currentFilter === 'all' || card.type === currentFilter;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || card.ability.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).forEach(card => cardCollection.appendChild(createCardElement(card)));
}

function setupEventListeners() {
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

  clearButton.addEventListener('click', () => {
    if (confirm('Clear the entire deck?')) {
      currentDeck = [];
      updateDeck();
    }
  });

  saveButton.addEventListener('click', () => {
    const deckName = deckNameInput.value.trim() || `Deck ${new Date().toLocaleTimeString()}`;
    if (currentDeck.length === 0) return alert('Cannot save an empty deck.');
    const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    const deck = { name: deckName, cards: currentDeck.map(c => ({ name: c.name, type: c.type })), date: new Date().toISOString() };
    const existing = savedDecks.findIndex(d => d.name === deck.name);
    if (existing !== -1 && !confirm('Replace existing deck?')) return;
    if (existing !== -1) savedDecks[existing] = deck;
    else savedDecks.push(deck);
    localStorage.setItem('savedDecks', JSON.stringify(savedDecks));
    loadSavedDecks();
    deckNameInput.value = '';
  });

  drawCardsBtn.addEventListener('click', () => drawCards(5));
  drawMoreBtn.addEventListener('click', () => drawCards(1));
  shuffleDeckBtn.addEventListener('click', () => { drawPile = [...currentDeck]; shuffleDeck(); drawCards(5); });
  closeDrawerBtn.addEventListener('click', () => { cardDrawer.classList.add('hidden'); drawPile = []; });
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
    el.innerHTML = `
      <div class="saved-deck-name">${deck.name} (${deck.cards.length} cards)</div>
      <div class="saved-deck-btns">
        <button class="saved-deck-btn load-btn" data-index="${index}">Load</button>
        <button class="saved-deck-btn delete-btn" data-index="${index}">Delete</button>
      </div>`;
    el.querySelector('.load-btn').addEventListener('click', () => {
      currentDeck = deck.cards.map(data => allCards.find(c => c.name === data.name && c.type === data.type)).filter(Boolean);
      updateDeck();
    });
    el.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Delete this deck?')) {
        decks.splice(index, 1);
        localStorage.setItem('savedDecks', JSON.stringify(decks));
        loadSavedDecks();
      }
    });
    savedDecksList.appendChild(el);
  });
}

function drawCards(count = 5) {
  if (currentDeck.length < 10) return alert('Deck must have at least 10 cards to test draw.');
  if (drawPile.length === 0) { drawPile = [...currentDeck]; shuffleDeck(); }
  if (drawPile.length < count) count = drawPile.length;
  const drawn = [];
  for (let i = 0; i < count; i++) if (drawPile.length > 0) drawn.push(drawPile.pop());
  drawnCardsElement.innerHTML = '';
  drawn.forEach(card => drawnCardsElement.appendChild(createCardElement(card)));
  deckDrawInfo.textContent = `Cards remaining: ${drawPile.length}`;
  cardDrawer.classList.remove('hidden');
}

function shuffleDeck() {
  for (let i = drawPile.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [drawPile[i], drawPile[j]] = [drawPile[j], drawPile[i]];
  }
}

function init() {
  renderCardCollection();
  updateDeck();
  loadSavedDecks();
  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);


// Add card preview functionality to app.js

// DOM Element for card preview
const cardPreviewContainer = document.getElementById('card-preview-container');
const cardPreviewImage = document.getElementById('card-preview-image');
const cardPreviewInfo = document.getElementById('card-preview-info');
let selectedCard = null;

// Create a function to update the card preview display
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
      <button id="preview-add-btn" class="preview-action-btn">Add to Deck</button>
    </div>
  `;
  
  // Add event listener to the "Add to Deck" button
  document.getElementById('preview-add-btn').addEventListener('click', () => addCardToDeck(card));
}

// Modify the createCardElement function to show preview on click
function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = 'card';
  cardElement.dataset.cardName = card.name;

  if (card.imageUrl && card.imageUrl.trim()) {
    const img = document.createElement('img');
    img.src = card.imageUrl;
    img.alt = card.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    cardElement.appendChild(img);
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
    `;
  }

  // Modified event listener to also update preview
  cardElement.addEventListener('click', () => {
    // Update the selected card indicator
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    
    // Update the card preview
    updateCardPreview(card);
  });

  return cardElement;
}

// Clear the preview when clearing the deck
const originalClearButton = clearButton.onclick;
clearButton.onclick = function() {
  if (confirm('Clear the entire deck?')) {
    currentDeck = [];
    updateDeck();
    updateCardPreview(null); // Clear the preview
  }
};

// Initialize the card preview
function initCardPreview() {
  // Initial empty state
  updateCardPreview(null);
}

// We need to extend the initialization without recursion
function extendedInit() {
  renderCardCollection();
  updateDeck();
  loadSavedDecks();
  setupEventListeners();
  initCardPreview();
}

// Replace the original init function's event listener
document.removeEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', extendedInit);
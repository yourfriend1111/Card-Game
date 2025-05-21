// Core Deck Builder Variables
let currentDeck = [];
let currentFilter = 'all';
let searchTerm = '';
let drawPile = [];
let selectedCard = null;

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

// Card Element Creation Functions
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

  // Event listener to update preview and select card
  cardElement.addEventListener('click', () => {
    // Update the selected card indicator
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    
    // Update the card preview
    updateCardPreview(card);
  });

  return cardElement;
}

// Render Functions
function renderCardCollection() {
  cardCollection.innerHTML = '';
  allCards.filter(card => {
    const matchesFilter = currentFilter === 'all' || card.type === currentFilter;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         card.ability.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).forEach(card => cardCollection.appendChild(createCardElement(card)));
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

function updateDeckStats() {
  cardCountElement.textContent = `Cards: ${currentDeck.length}/40`;
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
    el.innerHTML = `
      <div class="saved-deck-name">${deck.name} (${deck.cards.length} cards)</div>
      <div class="saved-deck-btns">
        <button class="saved-deck-btn load-btn" data-index="${index}">Load</button>
        <button class="saved-deck-btn delete-btn" data-index="${index}">Delete</button>
      </div>`;
    el.querySelector('.load-btn').addEventListener('click', () => {
      currentDeck = deck.cards.map(data => 
        allCards.find(c => c.name === data.name && c.type === data.type)).filter(Boolean);
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

// Initialization function
function initCardPreview() {
  // Initial empty state
  updateCardPreview(null);
}

function init() {
  renderCardCollection();
  updateDeck();
  loadSavedDecks();
  setupEventListeners();
  initCardPreview();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
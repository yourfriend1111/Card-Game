// User Interaction Functions

// Card Management Functions
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

function removeCardFromDeck(name) {
  const i = currentDeck.findIndex(card => card.name === name);
  if (i !== -1) {
    currentDeck.splice(i, 1);
    updateDeck();
  }
}

// Card Draw Testing Functions
function drawCards(count = 5) {
  if (currentDeck.length < 10) return alert('Deck must have at least 10 cards to test draw.');
  if (drawPile.length === 0) { 
    drawPile = [...currentDeck]; 
    shuffleDeck(); 
  }
  if (drawPile.length < count) count = drawPile.length;
  
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (drawPile.length > 0) drawn.push(drawPile.pop());
  }
  
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
    if (confirm('Clear the entire deck?')) {
      currentDeck = [];
      updateDeck();
      updateCardPreview(null); // Clear the preview when clearing the deck
    }
  });

  saveButton.addEventListener('click', () => {
    const deckName = deckNameInput.value.trim() || `Deck ${new Date().toLocaleTimeString()}`;
    if (currentDeck.length === 0) return alert('Cannot save an empty deck.');
    
    const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    const deck = { 
      name: deckName, 
      cards: currentDeck.map(c => ({ name: c.name, type: c.type })), 
      date: new Date().toISOString() 
    };
    
    const existing = savedDecks.findIndex(d => d.name === deck.name);
    if (existing !== -1 && !confirm('Replace existing deck?')) return;
    
    if (existing !== -1) savedDecks[existing] = deck;
    else savedDecks.push(deck);
    
    localStorage.setItem('savedDecks', JSON.stringify(savedDecks));
    loadSavedDecks();
    deckNameInput.value = '';
  });

  // Card Draw Testing
  drawCardsBtn.addEventListener('click', () => drawCards(5));
  drawMoreBtn.addEventListener('click', () => drawCards(1));
  
  shuffleDeckBtn.addEventListener('click', () => { 
    drawPile = [...currentDeck]; 
    shuffleDeck(); 
    drawCards(5); 
  });
  
  closeDrawerBtn.addEventListener('click', () => { 
    cardDrawer.classList.add('hidden'); 
    drawPile = []; 
  });
}
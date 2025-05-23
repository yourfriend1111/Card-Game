// DOM Elements
const deckBuilderBtn = document.getElementById('deckBuilderBtn');
const createLobbyBtn = document.getElementById('createLobbyBtn');
const joinLobbyBtn = document.getElementById('joinLobbyBtn');
const joinModal = document.getElementById('joinModal');
const lobbyCodeInput = document.getElementById('lobbyCodeInput');
const cancelBtn = document.getElementById('cancelBtn');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');

// Generate random lobby code
function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Simulate lobby existence check
function lobbyExists(code) {
    // For demo purposes, these codes "exist"
    const existingLobbies = ['GAME01', 'TEST12', 'DEMO99', 'PLAY42'];
    return existingLobbies.includes(code.toUpperCase());
}

// Event Listeners
deckBuilderBtn.addEventListener('click', () => {
    console.log('Navigating to Deck Builder...');
    window.location.href = '/deckbuilder';
});

createLobbyBtn.addEventListener('click', () => {
    const lobbyCode = generateLobbyCode();
    console.log(`Lobby created with code: ${lobbyCode}`);
    
    // Visual feedback
    createLobbyBtn.innerHTML = `
        <span class="btn-icon">✅</span>
        <span class="btn-text">Lobby Created!</span>
        <span class="btn-desc">Code: ${lobbyCode}</span>
    `;
    
    // Reset button after 3 seconds
    setTimeout(() => {
        createLobbyBtn.innerHTML = `
            <span class="btn-icon">➕</span>
            <span class="btn-text">Create Lobby</span>
            <span class="btn-desc">Start a new game</span>
        `;
    }, 3000);
});

joinLobbyBtn.addEventListener('click', () => {
    joinModal.classList.add('show');
    lobbyCodeInput.focus();
});

cancelBtn.addEventListener('click', () => {
    joinModal.classList.remove('show');
    lobbyCodeInput.value = '';
});

confirmJoinBtn.addEventListener('click', () => {
    const code = lobbyCodeInput.value.trim().toUpperCase();
    
    if (!code) {
        alert('Please enter a lobby code');
        return;
    }
    
    if (code.length !== 6) {
        alert('Lobby code must be 6 characters');
        return;
    }
    
    if (lobbyExists(code)) {
        console.log(`Joining lobby: ${code}`);
        console.log('Starting 1v1 game...');
        joinModal.classList.remove('show');
        lobbyCodeInput.value = '';
        
        // Visual feedback
        joinLobbyBtn.innerHTML = `
            <span class="btn-icon">🎮</span>
            <span class="btn-text">Joining Game...</span>
            <span class="btn-desc">Code: ${code}</span>
        `;
        
        // Reset button after 3 seconds
        setTimeout(() => {
            joinLobbyBtn.innerHTML = `
                <span class="btn-icon">🔗</span>
                <span class="btn-text">Join Lobby</span>
                <span class="btn-desc">Enter an existing game</span>
            `;
        }, 3000);
    } else {
        alert('Lobby not found. Please check the code and try again.');
    }
});

// Close modal when clicking outside
joinModal.addEventListener('click', (e) => {
    if (e.target === joinModal) {
        joinModal.classList.remove('show');
        lobbyCodeInput.value = '';
    }
});

// Handle Enter key in lobby code input
lobbyCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        confirmJoinBtn.click();
    }
});

// Handle Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && joinModal.classList.contains('show')) {
        joinModal.classList.remove('show');
        lobbyCodeInput.value = '';
    }
});

// Auto-uppercase lobby code input
lobbyCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});
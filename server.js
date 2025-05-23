const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Route for the root URL - serve the start screen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'start-screen.html'));
});

// Route for the deck builder page
app.get('/deckbuilder', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'deckbuilder.html'));
});

// Route for any other HTML pages you might have
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Catch-all route for any other requests
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
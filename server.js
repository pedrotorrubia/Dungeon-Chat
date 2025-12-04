
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());

// --- Database Helpers ---
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = { users: [], games: [], characters: [], chats: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Routes ---

// Login / Register (Auto-create user for simplicity)
app.post('/api/login', (req, res) => {
  const { username, email, avatarUrl, id } = req.body;
  const db = readDB();
  
  let user = db.users.find(u => u.username === username);
  if (!user) {
    user = { 
      id: id || Date.now().toString(), 
      username, 
      email, 
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=059669&color=fff` 
    };
    db.users.push(user);
    writeDB(db);
  }
  res.json(user);
});

// Get All Games
app.get('/api/games', (req, res) => {
  const db = readDB();
  res.json(db.games);
});

// Create Game
app.post('/api/games', (req, res) => {
  const game = req.body;
  const db = readDB();
  db.games.unshift(game);
  writeDB(db);
  res.json(game);
});

// Update Game (e.g. player count)
app.put('/api/games/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = readDB();
  const idx = db.games.findIndex(g => g.id === id);
  if (idx !== -1) {
    db.games[idx] = { ...db.games[idx], ...updates };
    writeDB(db);
    res.json(db.games[idx]);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Get Characters for a Game
app.get('/api/games/:gameId/characters', (req, res) => {
  const { gameId } = req.params;
  const db = readDB();
  // Filter characters that belong to this system/context. 
  // In a real app, characters would link to gameId directly.
  // For this mock, we return all characters or filter by system logic client-side.
  // Here we just return all characters the client filters.
  res.json(db.characters);
});

// Save/Update Character
app.post('/api/characters', (req, res) => {
  const char = req.body;
  const db = readDB();
  const idx = db.characters.findIndex(c => c.id === char.id);
  
  if (idx !== -1) {
    db.characters[idx] = char;
  } else {
    db.characters.push(char);
  }
  writeDB(db);
  res.json(char);
});

// Get Chat History
app.get('/api/games/:gameId/chat', (req, res) => {
  const { gameId } = req.params;
  const db = readDB();
  const history = db.chats[gameId] || [];
  res.json(history);
});

// Send Chat Message
app.post('/api/games/:gameId/chat', (req, res) => {
  const { gameId } = req.params;
  const message = req.body;
  const db = readDB();
  
  if (!db.chats[gameId]) db.chats[gameId] = [];
  
  db.chats[gameId].push(message);
  
  // Limit history size
  if (db.chats[gameId].length > 100) {
    db.chats[gameId] = db.chats[gameId].slice(-100);
  }
  
  writeDB(db);
  res.json(message);
});

// Serve Frontend (if built)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.send('Dungeon & Chat API Server Running. Frontend not found in /dist.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

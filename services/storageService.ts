
import { Character, GameSession, ChatMessage, User } from '../types';
import { MOCK_GAMES } from '../constants';

const API_URL = 'http://localhost:3001/api';
const KEYS = {
  USER: 'dnc_user',
  GAMES: 'dnc_games',
  CHARACTERS: 'dnc_characters',
  CHAT_PREFIX: 'dnc_chat_'
};

// Helper to handle API vs Local
// If API fails (server not running), fallback to LocalStorage
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.warn(`API unavailable for ${endpoint}, using local storage fallback.`);
    return null;
  }
}

// User Management
export const saveUserSession = async (user: User): Promise<void> => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  await apiRequest('/login', { method: 'POST', body: JSON.stringify(user) });
};

export const getUserSession = (): User | null => {
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const clearUserSession = () => {
  localStorage.removeItem(KEYS.USER);
};

// Game Management
export const getGames = async (): Promise<GameSession[]> => {
  const remote = await apiRequest<GameSession[]>('/games');
  if (remote) {
    // Sync local backup
    localStorage.setItem(KEYS.GAMES, JSON.stringify(remote));
    return remote;
  }

  const data = localStorage.getItem(KEYS.GAMES);
  if (!data) {
    localStorage.setItem(KEYS.GAMES, JSON.stringify(MOCK_GAMES));
    return MOCK_GAMES;
  }
  return JSON.parse(data);
};

export const saveGame = async (game: GameSession): Promise<void> => {
  const remote = await apiRequest<GameSession>('/games', { method: 'POST', body: JSON.stringify(game) });
  
  if (!remote) {
    // Fallback
    const data = localStorage.getItem(KEYS.GAMES);
    const games: GameSession[] = data ? JSON.parse(data) : [];
    const idx = games.findIndex(g => g.id === game.id);
    if (idx >= 0) games[idx] = game;
    else games.unshift(game);
    localStorage.setItem(KEYS.GAMES, JSON.stringify(games));
  }
};

// Character Management
export const getCharacters = async (gameId: string): Promise<Character[]> => {
  const remote = await apiRequest<Character[]>(`/games/${gameId}/characters`);
  if (remote) return remote;

  const data = localStorage.getItem(KEYS.CHARACTERS);
  const allChars: Character[] = data ? JSON.parse(data) : [];
  // Local filtering
  return allChars.filter(c => c.systemId === 'od2' || c.systemId === 't20' || c.systemId === 'alpha'); 
};

export const saveCharacter = async (character: Character): Promise<void> => {
  await apiRequest('/characters', { method: 'POST', body: JSON.stringify(character) });
  
  // Always save local backup for speed/offline
  const data = localStorage.getItem(KEYS.CHARACTERS);
  const allChars: Character[] = data ? JSON.parse(data) : [];
  const idx = allChars.findIndex(c => c.id === character.id);
  if (idx >= 0) {
    allChars[idx] = character;
  } else {
    allChars.push(character);
  }
  localStorage.setItem(KEYS.CHARACTERS, JSON.stringify(allChars));
};

// Chat Management
export const getChatHistory = async (gameId: string): Promise<ChatMessage[]> => {
  const remote = await apiRequest<ChatMessage[]>(`/games/${gameId}/chat`);
  if (remote) {
    return remote.map(m => ({...m, timestamp: new Date(m.timestamp)}));
  }

  const data = localStorage.getItem(KEYS.CHAT_PREFIX + gameId);
  if (!data) return [];
  return JSON.parse(data, (key, value) => {
    if (key === 'timestamp') return new Date(value);
    return value;
  });
};

export const saveChatMessage = async (gameId: string, message: ChatMessage): Promise<void> => {
  await apiRequest(`/games/${gameId}/chat`, { method: 'POST', body: JSON.stringify(message) });

  // Local fallback
  const data = localStorage.getItem(KEYS.CHAT_PREFIX + gameId);
  let history: ChatMessage[] = data ? JSON.parse(data) : [];
  history.push(message);
  if (history.length > 100) history.shift();
  localStorage.setItem(KEYS.CHAT_PREFIX + gameId, JSON.stringify(history));
};


import React, { useState, useEffect } from 'react';
import { AppView, User, GameSession, Character } from './types';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import GameInterface from './components/GameInterface';
import CharacterCreation from './components/CharacterCreation';
import Library from './components/Library';
import { getUserSession, saveUserSession, clearUserSession, saveGame, saveCharacter, getCharacters } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeGame, setActiveGame] = useState<GameSession | null>(null);
  const [playerCharacter, setPlayerCharacter] = useState<Character | undefined>(undefined);

  // Auto-login check
  useEffect(() => {
    const savedUser = getUserSession();
    if (savedUser) {
      setCurrentUser(savedUser);
      setView('DASHBOARD');
    }
  }, []);

  const handleLogin = async (user: User) => {
    await saveUserSession(user);
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    clearUserSession();
    setCurrentUser(null);
    setActiveGame(null);
    setPlayerCharacter(undefined);
    setView('LOGIN');
  };

  const handleJoinGame = async (game: GameSession) => {
    setActiveGame(game);
    await saveGame(game); // Sync game data if needed

    // Check if user is GM
    if (game.gmId === currentUser?.id) {
      setView('GAME');
    } else {
      // Check if player already has a character for this game
      const allChars = await getCharacters(game.id);
      
      const existingChar = allChars.find(c => c.playerName === currentUser?.username && c.systemId === game.systemId);

      if (existingChar) {
        setPlayerCharacter(existingChar);
        setView('GAME');
      } else {
        setView('CHARACTER_CREATION');
      }
    }
  };

  const handleCharacterCreated = async (character: Character) => {
    await saveCharacter(character);
    setPlayerCharacter(character);
    setView('GAME');
  };

  const handleExitGame = () => {
    setActiveGame(null);
    setPlayerCharacter(undefined);
    setView('DASHBOARD');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-white font-sans">
      {view === 'LOGIN' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {view === 'DASHBOARD' && currentUser && (
        <>
            <Dashboard 
            user={currentUser} 
            onJoinGame={handleJoinGame} 
            onLogout={handleLogout} 
            onOpenLibrary={() => setView('LIBRARY')}
            />
        </>
      )}

      {view === 'LIBRARY' && (
          <Library onClose={() => setView('DASHBOARD')} />
      )}

      {view === 'CHARACTER_CREATION' && currentUser && activeGame && (
        <CharacterCreation 
          user={currentUser}
          gameSession={activeGame}
          onComplete={handleCharacterCreated}
          onCancel={handleExitGame}
        />
      )}

      {view === 'GAME' && currentUser && activeGame && (
        <GameInterface 
          user={currentUser} 
          gameSession={activeGame} 
          playerCharacter={playerCharacter}
          onExit={handleExitGame} 
        />
      )}
    </div>
  );
};

export default App;

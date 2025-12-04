
import React, { useState, useEffect } from 'react';
import { User, GameSession } from '../types';
import { SYSTEMS } from '../constants';
import { getGames, saveGame } from '../services/storageService';

interface DashboardProps {
  user: User;
  onJoinGame: (game: GameSession) => void;
  onLogout: () => void;
  onOpenLibrary: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onJoinGame, onLogout, onOpenLibrary }) => {
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [games, setGames] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load games from storage on mount
  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const data = await getGames();
        setGames(data);
        setLoading(false);
    };
    load();
  }, []);

  // New Game State
  const [newGameName, setNewGameName] = useState('');
  const [newGameSystem, setNewGameSystem] = useState('od2');

  // Join Game State
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGameName.trim()) {
      const newGame: GameSession = {
        id: Date.now().toString(),
        name: newGameName,
        systemId: newGameSystem,
        gmId: user.id,
        gmName: user.username,
        playerCount: 0,
        description: 'Uma nova aventura começa...',
        bannerUrl: `https://picsum.photos/seed/${Date.now()}/400/200`,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      
      await saveGame(newGame);
      setGames(await getGames()); // Refresh list
      setShowNewGameModal(false);
      setNewGameName('');
      // Immediately join as GM
      onJoinGame(newGame);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGame = games.find(g => g.inviteCode === inviteCode);
    
    if (targetGame) {
        onJoinGame(targetGame);
        setShowJoinModal(false);
        setInviteCode('');
    } else {
        alert("Mesa não encontrada com este código.");
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center border border-emerald-400">
                <i className="fas fa-dungeon text-white text-sm"></i>
            </div>
            <h1 className="font-fantasy text-xl font-bold tracking-wide text-emerald-500">Dungeon & Chat</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenLibrary}
              className="text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
            >
              <i className="fas fa-book-open"></i> <span className="hidden sm:inline">Biblioteca</span>
            </button>
            <div className="h-6 w-px bg-gray-700 mx-1"></div>
            <div className="flex items-center gap-2">
              <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full border border-gray-600" />
              <span className="text-sm font-bold hidden sm:inline">{user.username}</span>
            </div>
            <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors ml-2" title="Sair">
              <i className="fas fa-sign-out-alt fa-lg"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold font-fantasy text-white">Salão das Guildas</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie suas campanhas e personagens.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-gray-600 px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:border-emerald-500/50"
            >
              <i className="fas fa-search"></i> Entrar com Código
            </button>
            <button 
              onClick={() => setShowNewGameModal(true)}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:shadow-emerald-500/20"
            >
              <i className="fas fa-plus"></i> Criar Mesa
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex justify-center py-20">
                <i className="fas fa-circle-notch fa-spin text-4xl text-emerald-600"></i>
            </div>
        )}

        {/* Game Grid */}
        {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map(game => (
                <div key={game.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl hover:border-emerald-500/50 transition-all group flex flex-col hover:-translate-y-1">
                <div className="h-32 bg-gray-700 relative overflow-hidden">
                    {game.bannerUrl && (
                    <img src={game.bannerUrl} alt={game.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono backdrop-blur-sm border border-white/10">
                    {SYSTEMS[game.systemId]?.name || game.systemId}
                    </div>
                    {game.gmId === user.id && (
                    <div className="absolute top-2 left-2 bg-yellow-600/90 px-2 py-1 rounded text-xs text-white font-bold backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <i className="fas fa-crown"></i> MESTRE
                    </div>
                    )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1 font-fantasy tracking-wide">{game.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <i className="fas fa-user-circle"></i> Mestre: {game.gmName}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10 italic">{game.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700/50">
                    <span className="text-xs text-gray-500">
                        <i className="fas fa-users mr-1"></i> {game.playerCount} Jogadores
                    </span>
                    <button 
                        onClick={() => onJoinGame(game)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-1.5 rounded text-sm font-bold transition-colors shadow-md"
                    >
                        {game.gmId === user.id ? 'Mestrar' : 'Jogar'}
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <div className="text-center py-20 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
            <div className="h-20 w-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                <i className="fas fa-dice-d20 text-4xl text-gray-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Nenhuma mesa encontrada</h3>
            <p className="text-gray-500 mt-2">Crie uma nova mesa para começar.</p>
          </div>
        )}
      </main>

      {/* New Game Modal */}
      {showNewGameModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl border border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-fantasy font-bold text-white">Criar Nova Mesa</h3>
              <button onClick={() => setShowNewGameModal(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateGame} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Aventura</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-emerald-500 outline-none"
                  placeholder="Ex: A Mina Perdida"
                  value={newGameName}
                  onChange={e => setNewGameName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sistema de Regras</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {Object.values(SYSTEMS).map(sys => (
                    <label key={sys.id} className={`flex items-start p-3 border rounded cursor-pointer transition-colors ${newGameSystem === sys.id ? 'bg-emerald-900/30 border-emerald-500' : 'bg-gray-900 border-gray-600 hover:border-gray-500'}`}>
                      <input 
                        type="radio" 
                        name="system" 
                        value={sys.id}
                        checked={newGameSystem === sys.id}
                        onChange={() => setNewGameSystem(sys.id)}
                        className="mt-1 mr-3 text-emerald-600 focus:ring-emerald-500 bg-gray-700 border-gray-600"
                      />
                      <div>
                        <span className="block text-sm font-bold text-white">{sys.name}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{sys.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewGameModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 transition-colors"
                >
                  Criar e Mestrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Game Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl border border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-fantasy font-bold text-white">Entrar em uma Mesa</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleJoinByCode} className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">Peça o código de convite ao Mestre da mesa.</p>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded p-4 text-white text-center text-2xl font-mono tracking-widest focus:border-emerald-500 outline-none uppercase"
                  placeholder="CODE123"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 transition-colors"
                >
                  Buscar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin({
        id: Date.now().toString(),
        username: username,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=059669&color=fff`
      });
    }
  };

  const handleGoogleLogin = () => {
    // Simulation of Google Login flow
    // In a real app, this would use the Google Identity Services SDK
    setTimeout(() => {
        const mockGoogleUser: User = {
            id: 'google-user-' + Math.floor(Math.random() * 10000),
            username: 'Aventureiro Google',
            email: 'aventureiro@gmail.com',
            avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c' 
        };
        onLogin(mockGoogleUser);
    }, 800); // Fake delay for realism
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-900 text-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 animate-fade-in relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-yellow-500 to-emerald-600"></div>

        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 border-2 border-emerald-400">
            <i className="fas fa-dungeon text-4xl text-white"></i>
          </div>
          <h1 className="text-4xl font-fantasy font-bold text-white mb-2">Dungeon & Chat</h1>
          <p className="text-gray-400">Seu portal para aventuras de RPG via chat.</p>
        </div>

        <div className="space-y-4">
            {/* Google Login Button */}
            <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-sm font-bold transition-all transform hover:-translate-y-0.5"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continuar com Google
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Ou entre como convidado</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Nome do Aventureiro
                </label>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-500"></i>
                </div>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 outline-none transition-all"
                    placeholder="Como deseja ser chamado?"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                </div>
            </div>

            <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all uppercase tracking-wide"
            >
                Entrar na Taverna
            </button>
            </form>
        </div>

        <div className="text-center text-xs text-gray-500 mt-4 border-t border-gray-700 pt-4">
          <p>Compatível com <span className="text-gray-400">Old Dragon 2e</span>, <span className="text-gray-400">Tormenta 20</span> e <span className="text-gray-400">3D&T Alpha</span>.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
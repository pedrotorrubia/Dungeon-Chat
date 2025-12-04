
import React from 'react';
import { MOCK_BOOKS, SYSTEMS } from '../constants';

interface LibraryProps {
  onClose: () => void;
}

const Library: React.FC<LibraryProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-800 w-full max-w-4xl h-[85%] rounded-xl shadow-2xl flex flex-col border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600/20 p-2 rounded-full">
                <i className="fas fa-book-open text-yellow-500 text-xl"></i>
            </div>
            <div>
                <h2 className="font-fantasy text-2xl text-white">Biblioteca Virtual</h2>
                <p className="text-gray-400 text-xs">Manuais, suplementos e aventuras</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors">
            <i className="fas fa-times fa-lg"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_BOOKS.map(book => (
              <div key={book.id} className="bg-gray-700 rounded-lg p-4 flex gap-4 border border-gray-600 hover:border-emerald-500 transition-all group hover:shadow-xl hover:-translate-y-1">
                <div className="w-24 h-36 bg-gray-900 flex-shrink-0 rounded overflow-hidden shadow-lg relative group-hover:shadow-emerald-500/20">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  {book.owned && (
                    <div className="absolute top-2 right-0 bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-bold shadow-md rounded-l">
                      ADQUIRIDO
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">{SYSTEMS[book.systemId]?.name}</span>
                    <h3 className="font-bold text-base text-gray-100 line-clamp-2 leading-tight mt-1 mb-2 group-hover:text-emerald-400 transition-colors">{book.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-3">{book.description}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t border-gray-600 pt-3">
                    {book.owned ? (
                      <button className="w-full text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
                        <i className="fas fa-book-reader"></i> Ler Agora
                      </button>
                    ) : (
                      <button className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
                        <span>Comprar</span>
                        <span className="bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-100">R$ {book.price.toFixed(2)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;

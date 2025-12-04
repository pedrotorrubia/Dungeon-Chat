
import React, { useState, useEffect, useRef } from 'react';
import { SYSTEMS, MOCK_MONSTERS } from '../constants';
import { Character, ChatMessage, MessageType, User, GameSession, Combatant } from '../types';
import DiceRoller from './DiceRoller';
import CharacterSheet from './CharacterSheet';
import Library from './Library';
import { askGameMasterAI } from '../services/geminiService';
import { saveChatMessage, getChatHistory, getCharacters, saveCharacter } from '../services/storageService';

interface GameInterfaceProps {
  user: User;
  gameSession: GameSession;
  playerCharacter?: Character;
  onExit: () => void;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ user, gameSession, playerCharacter, onExit }) => {
  const isGM = user.id === gameSession.gmId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showPlayerSheetModal, setShowPlayerSheetModal] = useState(false);
  
  // Player specific state
  const [myChar, setMyChar] = useState<Character | undefined>(playerCharacter);
  const [viewingOtherChar, setViewingOtherChar] = useState<Character | null>(null);

  // GM specific state
  const [players, setPlayers] = useState<Character[]>([]);
  const [viewingPlayerSheet, setViewingPlayerSheet] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'combat'>('players'); 
  
  // Stat Editor Modal
  const [statEdit, setStatEdit] = useState<{playerId: string, stat: 'hp' | 'gold' | 'xp' | null} | null>(null);
  const [statValue, setStatValue] = useState('');

  // Combat State
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [inCombat, setInCombat] = useState(false);
  
  // Monster Selection
  const [selectedMonster, setSelectedMonster] = useState(MOCK_MONSTERS[0]);
  const [monsterCount, setMonsterCount] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial data and Poll Chat
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
        const history = await getChatHistory(gameSession.id);
        if (isMounted) {
            if (history.length === 0 && isGM) {
                // Init system message
                const welcome: ChatMessage = {
                    id: 'init',
                    senderId: 'sys',
                    senderName: 'Sistema',
                    content: `Aventura iniciada: ${gameSession.name}\nSistema: ${SYSTEMS[gameSession.systemId]?.name}`,
                    type: MessageType.SYSTEM,
                    timestamp: new Date(),
                    isGM: true
                };
                setMessages([welcome]);
                saveChatMessage(gameSession.id, welcome);
            } else {
                setMessages(history);
            }

            // Load Characters
            if (isGM) {
                const chars = await getCharacters(gameSession.id);
                setPlayers(chars);
            }
        }
    };

    loadData();

    // Polling for Chat Updates (Simple "Live" Mechanism)
    const interval = setInterval(async () => {
        const history = await getChatHistory(gameSession.id);
        if (isMounted) setMessages(history);
        
        // GM also polls for updated character stats
        if (isGM) {
            const chars = await getCharacters(gameSession.id);
            if (isMounted) setPlayers(chars);
        }
    }, 3000);

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [gameSession.id, isGM]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = async (msg: ChatMessage) => {
      // Optimistic update
      setMessages(prev => [...prev, msg]);
      await saveChatMessage(gameSession.id, msg);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const isAiRequest = inputText.startsWith('/oraculo');
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.username,
      content: inputText,
      type: MessageType.TEXT,
      timestamp: new Date(),
      isGM: isGM
    };

    await addMessage(newMsg);
    setInputText('');

    if (isAiRequest) {
      setIsAiLoading(true);
      const query = newMsg.content.replace('/oraculo', '').trim();
      
      let context = `Mestre: ${gameSession.gmName}. `;
      if (isGM) {
        context += "O usuário é o Mestre do Jogo.";
      } else if (myChar) {
        context += `Personagem do jogador: ${myChar.name}, ${myChar.race} ${myChar.class}.`;
      }
      
      const aiResponseText = await askGameMasterAI(query, context);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'ai',
        senderName: 'Oráculo',
        content: aiResponseText,
        type: MessageType.AI,
        timestamp: new Date(),
        isGM: true
      };
      await addMessage(aiMsg);
      setIsAiLoading(false);
    }
  };

  const handleRoll = (formula: string, total: number, results: number[]) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.username,
      content: `Rolou ${formula}`,
      type: MessageType.ROLL,
      timestamp: new Date(),
      isGM: isGM,
      rollData: { formula, results, total }
    };
    addMessage(newMsg);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(gameSession.inviteCode);
    alert(`Código ${gameSession.inviteCode} copiado para a área de transferência!`);
  };

  // ---------------- GM Logic ----------------

  const applyStatChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statEdit || !statValue) return;

    const val = parseInt(statValue);
    if (isNaN(val)) return;

    const { playerId, stat } = statEdit;
    
    // Update local state and persistence
    const updatedPlayers = players.map(p => {
      if (p.id !== playerId) return p;
      let updatedChar = { ...p };
      
      if (stat === 'hp') {
        const newCurrent = Math.min(p.hp.max, Math.max(0, p.hp.current + val));
        updatedChar.hp = { ...p.hp, current: newCurrent };
      }
      if (stat === 'gold') updatedChar.gold = Math.max(0, (p.gold || 0) + val);
      if (stat === 'xp') updatedChar.xp = Math.max(0, p.xp + val);
      
      saveCharacter(updatedChar); // Persist
      return updatedChar;
    });

    setPlayers(updatedPlayers);

    const player = players.find(p => p.id === playerId);
    if(player && val !== 0) {
        const action = val > 0 ? 'recebeu' : 'perdeu';
        const label = stat === 'hp' ? 'PV' : stat === 'gold' ? 'PO' : 'XP';
        await addMessage({
            id: Date.now().toString(),
            senderId: 'sys',
            senderName: 'Sistema',
            content: `${player.name} ${action} ${Math.abs(val)} ${label}.`,
            type: MessageType.SYSTEM,
            timestamp: new Date(),
            isGM: true
        });
    }

    setStatEdit(null);
    setStatValue('');
  };

  // Combat Logic Helper: Roll dice formula string like "1d6+2"
  const rollFormula = (formula: string): number => {
    try {
      const parts = formula.toLowerCase().split('+');
      let total = 0;
      for (const part of parts) {
        if (part.includes('d')) {
          const [count, sides] = part.split('d').map(Number);
          for(let i=0; i<count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
          }
        } else {
          total += parseInt(part) || 0;
        }
      }
      return total;
    } catch {
      return 1;
    }
  };

  const addMonsters = () => {
      if (!selectedMonster) return;
      
      const newMonsters: Combatant[] = [];
      for(let i=0; i < monsterCount; i++) {
          const hp = rollFormula(selectedMonster.hp);
          // Initiative roll: d20 + mod
          const init = Math.floor(Math.random() * 20) + 1 + selectedMonster.initiative; 
          
          newMonsters.push({
              id: `m-${Date.now()}-${i}`,
              name: `${selectedMonster.name} ${monsterCount > 1 ? i+1 : ''}`,
              hp: hp,
              maxHp: hp,
              initiative: init,
              type: 'MONSTER',
              ac: selectedMonster.ac
          });
      }
      
      setCombatants([...combatants, ...newMonsters].sort((a, b) => b.initiative - a.initiative));
      setMonsterCount(1);
  };

  const addPlayersToCombat = () => {
      const playerCombatants: Combatant[] = players.map(p => {
          // Calculate AC dynamically based on equipment
          const dexMod = p.attributes.find(a => a.code === 'DES')?.modifier || 0;
          const armorBonus = p.equipment
            .filter(i => i.equipped && i.type === 'ARMOR')
            .reduce((total, item) => total + (item.ac || 0), 0);
          const ac = 10 + dexMod + armorBonus;

          return {
            id: p.id,
            name: p.name,
            hp: p.hp.current,
            maxHp: p.hp.max,
            initiative: Math.floor(Math.random() * 20) + 1 + dexMod, // Auto roll init for speed
            type: 'PLAYER',
            ac: ac
          };
      });
      
      const existingIds = new Set(combatants.map(c => c.id));
      const newCombatants = playerCombatants.filter(p => !existingIds.has(p.id));
      
      setCombatants([...combatants, ...newCombatants].sort((a, b) => b.initiative - a.initiative));
  };

  const nextTurn = () => {
      if (combatants.length === 0) return;
      let next = currentTurn + 1;
      if (next >= combatants.length) {
          next = 0;
          setRound(r => r + 1);
          addMessage({
            id: Date.now().toString(),
            senderId: 'sys',
            senderName: 'Combate',
            content: `--- Início da Rodada ${round + 1} ---`,
            type: MessageType.SYSTEM,
            timestamp: new Date(),
            isGM: true
          });
      }
      setCurrentTurn(next);
  };

  const removeCombatant = (id: string) => {
      setCombatants(combatants.filter(c => c.id !== id));
      if (currentTurn >= combatants.length - 1) setCurrentTurn(0);
  };

  // ---------------- Renders ----------------

  const renderGMSidebar = () => (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="font-fantasy text-yellow-500 text-lg flex items-center gap-2">
          <i className="fas fa-crown"></i> Mestre do Jogo
        </h2>
        <div className="mt-2 bg-gray-900 rounded p-2 text-xs flex justify-between items-center border border-gray-700 hover:border-emerald-500 group">
          <span className="text-gray-400">Código: <span className="font-mono font-bold text-emerald-400">{gameSession.inviteCode}</span></span>
          <button onClick={copyInviteCode} className="text-gray-500 hover:text-white transition-colors" title="Copiar Código">
            <i className="fas fa-copy"></i>
          </button>
        </div>
      </div>

      {/* Tabs GM */}
      <div className="flex border-b border-gray-700 bg-gray-800">
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'players' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:bg-gray-700'}`}
          >
            Jogadores
          </button>
          <button 
            onClick={() => setActiveTab('combat')}
            className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'combat' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-500 hover:bg-gray-700'}`}
          >
            Combate
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        
        {activeTab === 'players' && (
            <div className="space-y-3">
            {players.map(player => (
                <div key={player.id} className="bg-gray-800 rounded border border-gray-700 p-2 shadow-sm">
                <div 
                    className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-700 p-1 rounded transition-colors"
                    onClick={() => setViewingPlayerSheet(player)}
                >
                    <span className="font-bold text-sm text-white border-b border-dashed border-gray-500">{player.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">{player.race} {player.class}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="bg-gray-900 rounded p-1 text-center border border-gray-700">
                        <div className="text-red-400 font-bold mb-0.5">PV</div>
                        <div>{player.hp.current}/{player.hp.max}</div>
                        <button onClick={() => setStatEdit({playerId: player.id, stat: 'hp'})} className="mt-1 w-full bg-gray-800 hover:bg-gray-700 text-[10px] rounded"><i className="fas fa-edit"></i></button>
                    </div>
                    <div className="bg-gray-900 rounded p-1 text-center border border-gray-700">
                        <div className="text-yellow-400 font-bold mb-0.5">PO</div>
                        <div>{player.gold}</div>
                        <button onClick={() => setStatEdit({playerId: player.id, stat: 'gold'})} className="mt-1 w-full bg-gray-800 hover:bg-gray-700 text-[10px] rounded"><i className="fas fa-edit"></i></button>
                    </div>
                    <div className="bg-gray-900 rounded p-1 text-center border border-gray-700">
                        <div className="text-blue-400 font-bold mb-0.5">XP</div>
                        <div>{player.xp}</div>
                        <button onClick={() => setStatEdit({playerId: player.id, stat: 'xp'})} className="mt-1 w-full bg-gray-800 hover:bg-gray-700 text-[10px] rounded"><i className="fas fa-edit"></i></button>
                    </div>
                </div>
                </div>
            ))}
            {players.length === 0 && <p className="text-sm text-gray-500 text-center italic py-4">Nenhum jogador conectado.</p>}
            </div>
        )}

        {activeTab === 'combat' && (
            <div className="space-y-4">
                {/* Combat Controls */}
                <div className="bg-gray-800 p-2 rounded border border-gray-700 shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Gestão de Encontro</h4>
                        <div className="flex gap-1">
                            <button onClick={() => setInCombat(!inCombat)} className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${inCombat ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {inCombat ? 'Encerrar' : 'Iniciar'}
                            </button>
                            {inCombat && <button onClick={nextTurn} className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 shadow"><i className="fas fa-step-forward mr-1"></i> Próx</button>}
                        </div>
                    </div>
                    
                    {/* Add Monster Selector */}
                    <div className="space-y-2 mb-3 p-2 bg-gray-900/50 rounded border border-gray-700/50">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Adicionar Inimigos</label>
                        <select 
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-red-500"
                            value={selectedMonster.name}
                            onChange={(e) => setSelectedMonster(MOCK_MONSTERS.find(m => m.name === e.target.value) || MOCK_MONSTERS[0])}
                        >
                            {MOCK_MONSTERS.map(m => (
                                <option key={m.name} value={m.name}>{m.name} (CR {m.xp}xp)</option>
                            ))}
                        </select>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center bg-gray-800 rounded border border-gray-600 px-2">
                                <span className="text-xs text-gray-400 mr-2">Qtd:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    className="w-8 bg-transparent text-xs text-white py-1 outline-none text-center" 
                                    value={monsterCount} 
                                    onChange={e => setMonsterCount(parseInt(e.target.value) || 1)} 
                                />
                            </div>
                            <button onClick={addMonsters} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded font-bold transition-colors shadow">
                                <i className="fas fa-plus mr-1"></i> Adicionar
                            </button>
                        </div>
                    </div>
                    <button onClick={addPlayersToCombat} className="w-full bg-blue-900/40 hover:bg-blue-800/60 border border-blue-800 text-xs text-blue-200 py-1.5 rounded transition-colors">
                        <i className="fas fa-users mr-1"></i> Importar Jogadores
                    </button>
                </div>

                {/* Tracker */}
                <div className="space-y-1 pb-4">
                    {inCombat && <div className="text-center text-xs font-bold text-yellow-500 mb-2 bg-yellow-900/20 py-1 rounded border border-yellow-900/50">Rodada {round}</div>}
                    
                    {combatants.length > 0 ? (
                        combatants.map((c, idx) => (
                            <div key={c.id} className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${idx === currentTurn && inCombat ? 'bg-gradient-to-r from-indigo-900/60 to-gray-800 border-indigo-500 shadow-md translate-x-1' : 'bg-gray-800 border-gray-700'}`}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-bold min-w-[1.5rem] text-center ${idx === currentTurn && inCombat ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400'}`}>
                                        {c.initiative}
                                    </span>
                                    <div className="truncate">
                                        <div className={`text-sm font-bold truncate ${c.type === 'MONSTER' ? 'text-red-300' : 'text-blue-300'}`}>{c.name}</div>
                                        <div className="text-[10px] text-gray-400 flex gap-2">
                                            <span><i className="fas fa-heart text-red-500/70 mr-0.5"></i> {c.hp}/{c.maxHp}</span>
                                            <span><i className="fas fa-shield-alt text-gray-500 mr-0.5"></i> {c.ac}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeCombatant(c.id)} className="text-gray-600 hover:text-red-400 p-1"><i className="fas fa-times"></i></button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 border border-dashed border-gray-700 rounded bg-gray-800/50">
                            <p className="text-xs text-gray-500 italic">Combate vazio.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );

  const renderPlayerSidebar = () => {
      // Calculate derived stats for display in sidebar
      const dexMod = myChar ? (myChar.attributes.find(a => a.code === 'DES')?.modifier || 0) : 0;
      const armorBonus = myChar ? myChar.equipment.filter(i => i.equipped && i.type === 'ARMOR').reduce((total, item) => total + (item.ac || 0), 0) : 0;
      const totalAC = 10 + dexMod + armorBonus;

      // Filter party members (exclude self)
      const party = players.filter(p => p.id !== myChar?.id);

      return (
      <div className="h-full flex flex-col bg-gray-900 text-gray-200">
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <h2 className="font-fantasy text-emerald-500 text-xl truncate">{gameSession.name}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
             {myChar && (
                 <div className="bg-gray-800 rounded p-3 mb-4 border border-gray-700 shadow-lg">
                     <div className="flex items-center gap-3 mb-3">
                         <div className="w-12 h-12 rounded-full bg-gray-700 border border-emerald-500 overflow-hidden">
                             <img src={myChar.avatarUrl} alt="" className="w-full h-full object-cover"/>
                         </div>
                         <div className="overflow-hidden">
                             <h3 className="font-bold text-white text-lg leading-none truncate">{myChar.name}</h3>
                             <span className="text-xs text-emerald-400 truncate block">{myChar.race} {myChar.class} Nvl {myChar.level}</span>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 mb-3">
                         <div className="bg-gray-900/50 p-2 rounded text-center border border-gray-700/50">
                             <span className="text-[10px] text-gray-500 font-bold block uppercase">PV</span>
                             <span className="text-xl font-bold text-red-400">{myChar.hp.current}/{myChar.hp.max}</span>
                         </div>
                         <div className="bg-gray-900/50 p-2 rounded text-center border border-gray-700/50">
                             <span className="text-[10px] text-gray-500 font-bold block uppercase">CA</span>
                             <span className="text-xl font-bold text-blue-400">{totalAC}</span>
                         </div>
                     </div>
                     <button onClick={() => setShowPlayerSheetModal(true)} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-1.5 rounded text-sm font-bold shadow transition-colors">
                         <i className="fas fa-id-card mr-2"></i> Ficha Completa
                     </button>
                 </div>
             )}

             <div className="mt-4">
                 <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 px-2 border-b border-gray-800 pb-1">Grupo</h3>
                 <div className="space-y-2">
                     {party.map(p => (
                         <div key={p.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center cursor-pointer hover:border-gray-500 transition-colors" onClick={() => setViewingOtherChar(p)}>
                             <div className="flex items-center gap-2 overflow-hidden">
                                 <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                     <img src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.name}&background=random`} alt="" className="w-full h-full object-cover"/>
                                 </div>
                                 <div className="truncate">
                                     <div className="text-sm font-bold text-gray-200 truncate">{p.name}</div>
                                     <div className="text-[10px] text-gray-400 truncate">{p.race} {p.class}</div>
                                 </div>
                             </div>
                             <div className="text-xs font-bold text-gray-500">
                                 HP: {Math.floor((p.hp.current / p.hp.max) * 100)}%
                             </div>
                         </div>
                     ))}
                     {party.length === 0 && <p className="text-xs text-gray-600 text-center italic">Você está sozinho... por enquanto.</p>}
                 </div>
             </div>
          </div>
      </div>
  )};

  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden relative">
      
      {/* Sidebar */}
      <div className={`fixed inset-0 z-40 bg-black/80 lg:static lg:bg-transparent lg:w-80 lg:block flex-shrink-0 transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full w-80 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl relative z-50">
          <div className="p-2 lg:hidden flex justify-end">
             <button onClick={() => setShowSidebar(false)} className="text-gray-400 p-2 hover:text-white"><i className="fas fa-times"></i></button>
          </div>

          {isGM ? renderGMSidebar() : renderPlayerSidebar()}

          <div className="p-2 border-t border-gray-800 flex gap-2 bg-gray-900">
             <button 
                onClick={() => setShowLibrary(true)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-2 rounded border border-gray-700 transition flex items-center justify-center gap-2 text-sm"
             >
               <i className="fas fa-book-open"></i> Biblioteca
             </button>
             <button 
                onClick={onExit}
                className="bg-red-900/30 hover:bg-red-900 text-red-300 py-2 px-3 rounded border border-red-900/50 transition text-sm"
                title="Sair da Mesa"
             >
               <i className="fas fa-sign-out-alt"></i>
             </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        
        {/* Mobile Header */}
        <div className="lg:hidden h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between shadow-md z-30">
          <button onClick={() => setShowSidebar(true)} className={`${isGM ? 'text-yellow-500' : 'text-emerald-500'}`}>
            <i className={`fas ${isGM ? 'fa-crown' : 'fa-bars'} text-xl`}></i>
          </button>
          <span className="font-fantasy text-lg text-gray-200 truncate px-2">{gameSession.name}</span>
          <div className="flex gap-3">
            <button onClick={() => setShowLibrary(true)} className="text-gray-400">
              <i className="fas fa-book"></i>
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isGM ? 'items-start' : 'items-end'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 relative shadow-sm ${
                msg.type === MessageType.ROLL ? 'bg-indigo-900/80 border border-indigo-700' :
                msg.type === MessageType.AI ? 'bg-purple-900/80 border border-purple-700 text-purple-100' :
                msg.type === MessageType.SYSTEM ? 'bg-gray-700/50 text-gray-400 text-center w-full max-w-none border-none text-xs italic' :
                msg.isGM ? 'bg-gray-800 border border-gray-700' : 
                'bg-emerald-900/80 border border-emerald-700'
              } ${msg.type === MessageType.SYSTEM ? 'items-center' : ''}`}>
                
                {msg.type !== MessageType.SYSTEM && (
                  <span className={`text-xs font-bold mb-1 block ${msg.isGM ? 'text-yellow-500' : 'text-emerald-400'}`}>
                    {msg.type === MessageType.AI ? <><i className="fas fa-sparkles mr-1"></i>Oráculo</> : msg.senderName}
                  </span>
                )}
                
                {msg.type === MessageType.ROLL ? (
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold font-fantasy text-white">{msg.rollData?.total}</div>
                    <div className="text-xs text-gray-400 flex flex-col">
                      <span>Resultado</span>
                      <span className="font-mono bg-black/30 px-1 rounded">{msg.rollData?.formula}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                
                {msg.type !== MessageType.SYSTEM && (
                  <span className="text-[10px] text-gray-500 absolute bottom-1 right-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>
          ))}
          {isAiLoading && (
             <div className="flex items-center gap-2 text-purple-400 text-xs p-2 animate-pulse justify-center">
               <i className="fas fa-circle-notch fa-spin"></i> O Oráculo está consultando os pergaminhos...
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 p-3 z-30">
          <div className="mb-2">
            <DiceRoller onRoll={handleRoll} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua ação ou /oraculo..."
              className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
            <button 
              onClick={handleSendMessage}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Library Modal */}
      {showLibrary && <Library onClose={() => setShowLibrary(false)} />}

      {/* Stat Editor Modal (GM only) */}
      {statEdit && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-2xl border border-gray-600">
                  <h3 className="text-white font-bold mb-4">Editar {statEdit.stat?.toUpperCase()}</h3>
                  <form onSubmit={applyStatChange}>
                      <p className="text-xs text-gray-400 mb-2">Digite um valor positivo para adicionar ou negativo para remover.</p>
                      <input 
                        type="number" 
                        autoFocus
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mb-4 outline-none focus:border-emerald-500" 
                        placeholder="-5 ou 10" 
                        value={statValue} 
                        onChange={e => setStatValue(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setStatEdit(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500">Confirmar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Viewing Player Sheet (GM or Self) */}
      {(viewingPlayerSheet || showPlayerSheetModal) && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-gray-800 w-full max-w-2xl h-[90%] rounded-xl flex flex-col shadow-2xl overflow-hidden border border-gray-700">
                  <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                      <h3 className="text-white font-fantasy text-xl">
                          {isGM && viewingPlayerSheet ? `Ficha de ${viewingPlayerSheet.name}` : 'Sua Ficha'}
                      </h3>
                      <button 
                        onClick={() => isGM ? setViewingPlayerSheet(null) : setShowPlayerSheetModal(false)} 
                        className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
                      >
                          <i className="fas fa-times fa-lg"></i>
                      </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                      <CharacterSheet 
                        character={isGM ? viewingPlayerSheet! : myChar!} 
                        onUpdate={isGM ? (c) => {
                            // Update player locally and persist
                            const newPlayers = players.map(p => p.id === c.id ? c : p);
                            setPlayers(newPlayers);
                            saveCharacter(c);
                            setViewingPlayerSheet(c);
                        } : (c) => {
                            setMyChar(c);
                            saveCharacter(c);
                        }}
                        readOnly={isGM} 
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Viewing Other Player Modal (Player Party View) */}
      {viewingOtherChar && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-gray-800 w-full max-w-lg h-[80%] rounded-xl flex flex-col shadow-2xl border border-gray-700">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
                      <h3 className="text-white font-bold">Vendo: {viewingOtherChar.name}</h3>
                      <button onClick={() => setViewingOtherChar(null)} className="text-gray-400 hover:text-white"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="flex-1 overflow-hidden p-2">
                      <CharacterSheet character={viewingOtherChar} readOnly={true} />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default GameInterface;

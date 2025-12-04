
import React, { useState } from 'react';
import { SYSTEMS, getOD2Modifier, OD2_STARTING_GEAR, CLASS_FEATURES, RACE_FEATURES } from '../constants';
import { Character, Attribute, GameSession, User, RollingMethod, Item, InventoryItem } from '../types';

interface CharacterCreationProps {
  user: User;
  gameSession: GameSession;
  onComplete: (character: Character) => void;
  onCancel: () => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ user, gameSession, onComplete, onCancel }) => {
  const system = SYSTEMS[gameSession.systemId];
  const [step, setStep] = useState(1);
  const [rollMethod, setRollMethod] = useState<RollingMethod>('CLASSIC');
  
  // Data State
  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState(system.races[0]);
  const [selectedClass, setSelectedClass] = useState(system.classes[0]);
  const [attributes, setAttributes] = useState<Attribute[]>(
    system.attributes.map(code => ({ name: code, code: code, value: 0, modifier: 0 }))
  );
  const [statsRolled, setStatsRolled] = useState(false);
  const [gold, setGold] = useState(0);
  const [goldRolled, setGoldRolled] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState('');

  // ---------------- Logic ---------------- //

  const rollStats = () => {
    const newAttrs = attributes.map(attr => {
      let val = 0;
      if (rollMethod === 'CLASSIC' || rollMethod === 'ADVENTURER') {
        // 3d6
        val = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      } else if (rollMethod === 'HEROIC') {
        // 4d6 drop lowest
        const rolls = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ].sort((a, b) => a - b);
        val = rolls[1] + rolls[2] + rolls[3];
      }
      return { ...attr, value: val, modifier: getOD2Modifier(val) };
    });
    setAttributes(newAttrs);
    setStatsRolled(true);
  };

  const rollGold = () => {
    // 3d6 x 10 for Old Dragon 2
    const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    setGold(roll * 10);
    setGoldRolled(true);
  };

  const buyItem = (item: Item) => {
    if (gold >= item.cost) {
      setGold(gold - item.cost);
      const newItem: InventoryItem = {
        ...item,
        instanceId: Date.now().toString() + Math.random().toString(),
        equipped: false
      };
      setInventory([...inventory, newItem]);
    }
  };

  const removeItem = (index: number) => {
    const item = inventory[index];
    setGold(gold + item.cost);
    setInventory(inventory.filter((_, i) => i !== index));
  };

  const finishCreation = () => {
    // Calculate HP
    let hpMax = 8;
    if (['Guerreiro', 'Bárbaro', 'Paladino', 'Cavaleiro', 'Lutador'].includes(selectedClass)) hpMax = 10;
    if (['Mago', 'Arcanista'].includes(selectedClass)) hpMax = 4;
    if (['Ladrão', 'Ladino', 'Bardo'].includes(selectedClass)) hpMax = 6;
    const conMod = attributes.find(a => a.code === 'CON')?.modifier || 0;
    hpMax = Math.max(1, hpMax + conMod);

    const newChar: Character = {
      id: Date.now().toString(),
      name: name || user.username,
      race: selectedRace,
      class: selectedClass,
      level: 1,
      hp: { current: hpMax, max: hpMax },
      xp: 0,
      attributes,
      equipment: inventory,
      systemId: gameSession.systemId,
      gold,
      avatarUrl: user.avatarUrl,
      history,
      playerName: user.username
    };
    onComplete(newChar);
  };

  // ---------------- Render ---------------- //

  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-fantasy text-emerald-500">Criação de Personagem</h2>
            <p className="text-gray-400 text-sm">Passo {step} de 4</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* Step 1: Basic Info & Stats */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Nome</label>
                  <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="Nome do Herói" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Raça</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none" value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
                    {system.races.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1 italic">{RACE_FEATURES[selectedRace]}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Classe</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    {system.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1 italic">{CLASS_FEATURES[selectedClass]}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Método de Rolagem</label>
                  <div className="flex bg-gray-700 rounded p-1">
                    {(['CLASSIC', 'ADVENTURER', 'HEROIC'] as RollingMethod[]).map(m => (
                      <button 
                        key={m} 
                        onClick={() => { setRollMethod(m); setStatsRolled(false); }}
                        className={`flex-1 text-xs py-1 rounded ${rollMethod === m ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                      >
                        {m === 'CLASSIC' ? 'Clássico' : m === 'ADVENTURER' ? 'Aventureiro' : 'Heróico'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 text-center">
                    {rollMethod === 'CLASSIC' ? '3d6 na ordem.' : rollMethod === 'ADVENTURER' ? '3d6 organiza como quiser.' : '4d6 descarta o menor.'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-fantasy text-lg text-yellow-500">Atributos</h3>
                  <button onClick={rollStats} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded flex items-center gap-1">
                    <i className="fas fa-dice"></i> Rolar
                  </button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {attributes.map((attr, idx) => (
                    <div key={attr.code} className="bg-gray-800 p-2 rounded text-center border border-gray-700">
                      <span className="block text-xs font-bold text-gray-400 mb-1">{attr.name}</span>
                      <input 
                        type="number"
                        value={attr.value}
                        readOnly={rollMethod !== 'ADVENTURER'} // Simple logic: if adventurer, allow edit (manual arrange simulation)
                        onChange={(e) => {
                           if(rollMethod === 'ADVENTURER') {
                             const val = parseInt(e.target.value) || 0;
                             const newAttrs = [...attributes];
                             newAttrs[idx] = { ...attr, value: val, modifier: getOD2Modifier(val) };
                             setAttributes(newAttrs);
                           }
                        }}
                        className={`w-full bg-transparent text-xl font-bold text-center text-white outline-none ${rollMethod === 'ADVENTURER' ? 'border-b border-gray-600 focus:border-emerald-500' : ''}`}
                      />
                      <span className={`block text-xs mt-1 font-mono ${attr.modifier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Gold & Shop */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-gray-700/50 p-4 rounded border border-gray-600">
                <div>
                  <h3 className="font-bold text-white">Riqueza Inicial</h3>
                  <p className="text-xs text-gray-400">3d6 x 10 Peças de Ouro (PO)</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-yellow-500">{gold} PO</div>
                  {!goldRolled && (
                    <button onClick={rollGold} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm font-bold">
                      Rolar Ouro
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shop */}
                <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden flex flex-col h-80">
                  <div className="bg-gray-700 p-2 font-bold text-sm text-center">Loja de Equipamentos</div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {OD2_STARTING_GEAR.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => buyItem(item)}
                        disabled={gold < item.cost}
                        className={`w-full flex justify-between items-center p-2 rounded text-sm group ${gold >= item.cost ? 'hover:bg-gray-700 text-gray-300' : 'opacity-50 cursor-not-allowed text-gray-500'}`}
                      >
                        <div className="flex flex-col items-start">
                            <span className="font-bold">{item.name}</span>
                            <span className="text-[10px] text-gray-500">
                                {item.type === 'WEAPON' && `Dano: ${item.damage}`}
                                {item.type === 'ARMOR' && `CA: +${item.ac}`}
                                {item.type === 'GEAR' && `Equipamento`}
                            </span>
                        </div>
                        <span className="text-yellow-500 font-mono text-xs">{item.cost} PO</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inventory */}
                <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden flex flex-col h-80">
                  <div className="bg-gray-700 p-2 font-bold text-sm text-center">Mochila ({inventory.length} itens)</div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {inventory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-700/50 rounded text-sm text-white">
                        <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-gray-400">
                                {item.type === 'WEAPON' && `Dano: ${item.damage}`}
                                {item.type === 'ARMOR' && `CA: +${item.ac}`}
                            </span>
                        </div>
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    {inventory.length === 0 && <p className="text-center text-gray-500 text-xs mt-4">Mochila vazia.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: History */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-fantasy text-xl text-white">Sua História</h3>
              <p className="text-gray-400 text-sm">Quem é você? De onde veio? O que busca?</p>
              <textarea 
                className="w-full h-64 bg-gray-700/50 border border-gray-600 rounded p-4 text-white outline-none focus:border-emerald-500 resize-none"
                placeholder="Era uma noite escura e tempestuosa quando..."
                value={history}
                onChange={e => setHistory(e.target.value)}
              ></textarea>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-gray-700/30 p-4 rounded border border-gray-600">
                <div className="w-16 h-16 rounded-full bg-gray-600 overflow-hidden border-2 border-emerald-500">
                   <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-fantasy text-white">{name || 'Sem Nome'}</h3>
                  <p className="text-emerald-400">{selectedRace} {selectedClass} - Nível 1</p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {attributes.map(attr => (
                  <div key={attr.code} className="bg-gray-800 p-2 rounded text-center border border-gray-700">
                    <span className="text-[10px] text-gray-400 font-bold">{attr.name}</span>
                    <div className="text-lg font-bold text-white">{attr.value}</div>
                    <div className="text-xs text-emerald-400">{attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier}</div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-700/30 p-4 rounded border border-gray-600">
                <h4 className="font-bold text-white mb-2 border-b border-gray-600 pb-1">Equipamento</h4>
                <div className="flex flex-wrap gap-2">
                  {inventory.map((item, idx) => (
                    <span key={idx} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-600">{item.name}</span>
                  ))}
                  {inventory.length === 0 && <span className="text-gray-500 text-sm">Nenhum equipamento.</span>}
                </div>
                <div className="mt-2 text-right text-yellow-500 font-bold text-sm">Ouro Restante: {gold} PO</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-900 border-t border-gray-700 flex justify-between">
          {step === 1 ? (
            <button onClick={onCancel} className="text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
          ) : (
            <button onClick={() => setStep(step - 1)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors">Voltar</button>
          )}

          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={(step === 1 && !statsRolled)}
              className={`bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded transition-colors font-bold ${(step === 1 && !statsRolled) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Próximo
            </button>
          ) : (
            <button onClick={finishCreation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded transition-colors font-bold shadow-lg shadow-indigo-900/20">
              Finalizar Personagem
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CharacterCreation;

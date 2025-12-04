
import React, { useState } from 'react';
import { Character, Attribute, InventoryItem } from '../types';
import { getOD2Modifier } from '../constants';

interface CharacterSheetProps {
  character: Character;
  onUpdate?: (char: Character) => void;
  readOnly?: boolean; // If true, user cannot edit values (for inspecting others)
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onUpdate, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'equip' | 'bio'>('stats');

  const handleUpdate = (updatedChar: Character) => {
    if (onUpdate && !readOnly) {
        onUpdate(updatedChar);
    }
  };

  const handleAttrChange = (code: string, newValue: string) => {
    if (readOnly) return;
    const val = parseInt(newValue) || 0;
    const newAttrs = character.attributes.map(attr => 
      attr.code === code ? { ...attr, value: val, modifier: getOD2Modifier(val) } : attr
    );
    handleUpdate({ ...character, attributes: newAttrs });
  };

  const toggleEquip = (itemId: string) => {
      if(readOnly) return;
      
      const newEquipment = character.equipment.map(item => {
          if (item.instanceId === itemId) {
              return { ...item, equipped: !item.equipped };
          }
          return item;
      });
      handleUpdate({...character, equipment: newEquipment});
  };

  // Calculated Stats
  const dexMod = character.attributes.find(a => a.code === 'DES')?.modifier || 0;
  const strMod = character.attributes.find(a => a.code === 'FOR')?.modifier || 0;
  
  const equippedArmor = character.equipment.filter(i => i.equipped && i.type === 'ARMOR');
  const armorBonus = equippedArmor.reduce((total, item) => total + (item.ac || 0), 0);
  const totalAC = 10 + dexMod + armorBonus;

  const equippedWeapon = character.equipment.find(i => i.equipped && i.type === 'WEAPON');
  const attackBonus = Math.floor(character.level / 2) + 1; // Simplified BA logic
  const damageDisplay = equippedWeapon 
    ? `${equippedWeapon.damage} ${strMod >= 0 ? '+' : ''}${strMod}` 
    : `1d3 ${strMod >= 0 ? '+' : ''}${strMod} (Desarmado)`;

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden h-full flex flex-col border border-gray-700">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex items-center gap-4 relative overflow-hidden">
        {/* BG Decoration */}
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <i className="fas fa-dragon text-9xl text-white"></i>
        </div>

        <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-emerald-600 flex-shrink-0 z-10 shadow-lg">
          <img src={character.avatarUrl || "https://picsum.photos/100"} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 z-10">
          {readOnly ? (
             <h2 className="text-xl font-fantasy text-white font-bold">{character.name}</h2>
          ) : (
             <input 
                className="bg-transparent text-xl font-fantasy text-white font-bold w-full outline-none border-b border-transparent hover:border-gray-600 focus:border-emerald-500 transition-colors" 
                value={character.name} 
                onChange={(e) => handleUpdate({...character, name: e.target.value})}
             />
          )}
          
          <div className="text-sm text-gray-400 flex gap-2 items-center">
            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">{character.race}</span>
            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">{character.class}</span>
            <span className="text-emerald-500 font-bold">Nvl {character.level}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
             <div className="flex-1">
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5 uppercase font-bold tracking-wider">
                    <span>PV</span>
                    <span>{character.hp.current} / {character.hp.max}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded overflow-hidden">
                    <div 
                    className={`h-full transition-all ${character.hp.current < character.hp.max * 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, (character.hp.current / character.hp.max) * 100)}%` }}
                    ></div>
                </div>
             </div>
             <div className="text-xs font-mono text-yellow-500 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                <i className="fas fa-coins mr-1"></i>{character.gold}
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {['stats', 'equip', 'bio'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400 bg-gray-700/50' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'stats' ? 'Atributos' : tab === 'equip' ? 'Inventário' : 'História'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        {activeTab === 'stats' && (
          <div className="space-y-4">
             {/* Main Stats Grid */}
             <div className="grid grid-cols-3 gap-2">
                {character.attributes.map(attr => (
                <div key={attr.code} className="bg-gray-700/80 p-2 rounded border border-gray-600 flex flex-col items-center relative group">
                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">{attr.name}</span>
                    {readOnly ? (
                        <span className="text-xl font-bold text-white">{attr.value}</span>
                    ) : (
                        <input 
                        type="number" 
                        value={attr.value} 
                        onChange={(e) => handleAttrChange(attr.code, e.target.value)}
                        className="bg-transparent text-xl font-bold text-center w-full outline-none text-white appearance-none"
                        />
                    )}
                    <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${attr.modifier >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier}
                    </span>
                </div>
                ))}
            </div>

            {/* Combat Stats Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold">Classe de Armadura</div>
                    <div className="text-2xl font-fantasy text-white flex justify-center items-center gap-1">
                        <i className="fas fa-shield-alt text-gray-600"></i>
                        {totalAC}
                    </div>
                </div>
                <div className="text-center border-l border-gray-700">
                    <div className="text-xs text-gray-500 uppercase font-bold">Base de Ataque</div>
                    <div className="text-2xl font-fantasy text-white">
                        <span className="text-sm text-gray-500 mr-1">+</span>{attackBonus}
                    </div>
                </div>
                <div className="text-center border-l border-gray-700">
                    <div className="text-xs text-gray-500 uppercase font-bold">Dano</div>
                    <div className="text-sm font-bold text-white pt-1">
                        {damageDisplay}
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'equip' && (
          <div className="space-y-2">
            {character.equipment.map((item, idx) => (
              <div key={item.instanceId} className="bg-gray-700/50 p-2 rounded flex items-center justify-between border border-gray-600 group">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => toggleEquip(item.instanceId)}
                        disabled={readOnly}
                        className={`w-6 h-6 rounded flex items-center justify-center border ${item.equipped ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-600'} transition-colors ${(item.type === 'WEAPON' || item.type === 'ARMOR') && !readOnly ? 'cursor-pointer hover:border-emerald-400' : 'opacity-50 cursor-default'}`}
                        title={item.equipped ? "Equipado" : "Não Equipado"}
                    >
                        {(item.type === 'WEAPON' || item.type === 'ARMOR') && <i className="fas fa-check text-xs"></i>}
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <i className={`fas ${item.type === 'WEAPON' ? 'fa-khanda' : item.type === 'ARMOR' ? 'fa-shield-alt' : 'fa-box'} text-gray-500 text-xs`}></i>
                            <span className={`text-sm ${item.equipped ? 'text-emerald-200 font-bold' : 'text-gray-300'}`}>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 pl-5">
                            {item.type === 'WEAPON' && `Dano: ${item.damage}`}
                            {item.type === 'ARMOR' && `CA: +${item.ac}`}
                        </div>
                    </div>
                </div>
                {!readOnly && (
                    <button 
                        onClick={() => {
                            const newEquip = character.equipment.filter(i => i.instanceId !== item.instanceId);
                            handleUpdate({...character, equipment: newEquip});
                        }}
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button 
                onClick={() => {
                    const itemName = prompt("Nome do item:");
                    if(itemName) {
                        const newItem: InventoryItem = {
                            name: itemName,
                            cost: 0,
                            type: 'GEAR',
                            instanceId: Date.now().toString(),
                            equipped: false
                        };
                        handleUpdate({...character, equipment: [...character.equipment, newItem]});
                    }
                }}
                className="w-full py-2 border border-dashed border-gray-500 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i> Adicionar Item Manualmente
              </button>
            )}
          </div>
        )}

        {activeTab === 'bio' && (
          <textarea 
            className="w-full h-64 bg-gray-700/30 p-3 rounded text-sm text-gray-300 resize-none outline-none border border-gray-600 focus:border-emerald-500 leading-relaxed"
            placeholder="Histórico, anotações e detalhes do personagem..."
            disabled={readOnly}
            value={character.history || ''}
            onChange={(e) => handleUpdate({...character, history: e.target.value})}
          ></textarea>
        )}
      </div>
    </div>
  );
};

export default CharacterSheet;

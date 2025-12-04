import React, { useState } from 'react';

interface DiceRollerProps {
  onRoll: (formula: string, result: number, diceResults: number[]) => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll }) => {
  const [modifier, setModifier] = useState(0);

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    const total = result + modifier;
    const formula = `1d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
    onRoll(formula, total, [result]);
    setModifier(0); // Reset modifier after roll
  };

  return (
    <div className="bg-gray-800 p-2 rounded-lg shadow-lg flex flex-col gap-2">
      <div className="flex justify-between items-center px-2">
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rolagem Rápida</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mod:</span>
          <input 
            type="number" 
            value={modifier} 
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            className="w-12 bg-gray-700 text-white text-xs rounded px-1 py-0.5 border border-gray-600 focus:border-emerald-500 outline-none text-center"
          />
        </div>
      </div>
      <div className="flex justify-around gap-1">
        {[4, 6, 8, 10, 12, 20].map((sides) => (
          <button
            key={sides}
            onClick={() => rollDice(sides)}
            className="flex-1 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 flex flex-col items-center"
          >
            <i className={`fas fa-dice-${sides === 6 ? 'six' : 'd20'} mb-1`}></i>
            <span className="text-[10px]">d{sides}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiceRoller;
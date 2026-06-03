// client/src/components/shared/CreditDisplay.jsx
import React from 'react';
import { Coins, Plus } from 'lucide-react';
import { formatCredits } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function CreditDisplay({ credits = 0, lastCost = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface rounded-xl p-4 border border-white/5 flex flex-col justify-between space-y-4">
      {/* Current Balances block */}
      <div>
        <div className="flex items-center space-x-2 text-white/50 text-[10px] uppercase font-bold tracking-wider mb-2">
          <Coins className="w-3.5 h-3.5 text-warning" />
          <span>My Balance</span>
        </div>
        <h3 className="text-xl font-black text-warning tracking-wide">
          {formatCredits(credits)}
        </h3>
      </div>

      {/* Info display detailing latest generation expenses */}
      {lastCost > 0 && (
        <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold uppercase tracking-wider bg-white/5 p-2 rounded-lg border border-white/5">
          <span>Last Cost</span>
          <span className="text-white font-extrabold tracking-wide">
            -{formatCredits(lastCost)}
          </span>
        </div>
      )}

      {/* Add Credits trigger */}
      <button
        onClick={() => navigate('/credits')}
        className="w-full inline-flex items-center justify-center space-x-1 py-2 bg-warning/10 hover:bg-warning text-warning hover:text-darkBg border border-warning/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Purchase Pack</span>
      </button>
    </div>
  );
}

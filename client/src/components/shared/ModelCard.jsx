// client/src/components/shared/ModelCard.jsx
import React from 'react';
import { formatCredits } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Sparkles, Cpu } from 'lucide-react';

export default function ModelCard({ model, selected = false, onClick = null }) {
  const providerIcons = {
    bytedance: Sparkles,
    alibaba: Cpu,
    default: Cpu
  };

  const IconComponent = providerIcons[model.provider?.toLowerCase()] || providerIcons.default;

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-xl transition-all cursor-pointer premium-border hover-scale flex flex-col justify-between ${
        selected
          ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-glow'
          : 'bg-surface hover:bg-surface-elevated border-white/5'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${selected ? 'bg-primary/20 text-primary-hover' : 'bg-white/5 text-white/50'}`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">{model.name}</h4>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{model.provider}</p>
          </div>
        </div>
        
        {model.badge && (
          <Badge variant={selected ? 'featured' : 'primary'} className="text-[8px] px-1.5 font-black shrink-0">
            {model.badge}
          </Badge>
        )}
      </div>

      <p className="text-[10px] text-white/50 mt-2.5 leading-relaxed line-clamp-2 h-7">
        {model.description}
      </p>

      {/* Model price metrics in INR per second */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[9px] text-white/40 uppercase font-semibold tracking-wider">
        <span>Price / Sec</span>
        <span className="text-white font-black tracking-wide">
          {formatCredits(model.price_per_second)}/s
        </span>
      </div>
    </div>
  );
}

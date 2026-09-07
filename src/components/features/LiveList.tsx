import React from 'react';
import type { LiveEvent } from '../../types/live';
import { LiveItem } from './LiveItem';

interface Props {
  lives: LiveEvent[];
  checkedIds: string[];
  onToggle: (id: string) => void;
  onClickRow?: (id: string) => void;
}

export const LiveList: React.FC<Props> = ({ lives, checkedIds, onToggle, onClickRow }) => (
  <div className="mb-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar border-t border-b border-gray-800 py-3">
    <ul className="space-y-3">
      {lives.map(live => (
        <LiveItem 
          key={live.id} 
          live={live} 
          isChecked={checkedIds.includes(live.id)} 
          onToggle={onToggle} 
          onClickRow={onClickRow}
        />
      ))}
    </ul>
    
    <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    `}</style>
  </div>
);
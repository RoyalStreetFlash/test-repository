import React from 'react';
import type { LiveEvent } from '../../types/live';

interface Props {
  live: LiveEvent;
  isChecked: boolean;
  onToggle: (id: string) => void;
  onClickRow?: (id: string) => void;
}

export const LiveItem: React.FC<Props> = ({ live, isChecked, onToggle, onClickRow }) => {
  // 本日の日付（時刻を切り捨てた純粋な日付）を取得
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 日付文字列の構築
  let displayDate = "XX/XX 予定"; // dateが未定(null/空)のデフォルト表記
  let isFuture = true; 

  if (live.date) {
    displayDate = live.date;
    const liveDate = new Date(live.date);
    isFuture = !isNaN(liveDate.getTime()) && liveDate > today;
  }

  return (
    <li 
      onClick={() => onClickRow && onClickRow(live.id)}
      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
        isChecked ? 'bg-[#30363d] border-gray-500 shadow-inner' : 'bg-[#161b22] border-gray-800 hover:bg-gray-800/60'
      }`}
    >
      <div 
        onClick={(e) => {
          e.stopPropagation(); // 行のクリック（編集画面への遷移）を発火させずにチェックだけ切り替える
          onToggle(live.id);
        }}
        className={`w-6 h-6 rounded flex items-center justify-center mr-4 border-2 flex-shrink-0 ${
          isChecked ? 'bg-[#1abc9c] border-[#1abc9c]' : 'border-gray-600'
        }`}
      >
        {isChecked && <span className="text-white text-xs font-bold">✓</span>}
      </div>

      <div className="flex-grow">
        <div className="text-[10px] text-[#1abc9c] font-bold mb-0.5 uppercase tracking-wide">
          {displayDate}{isFuture && live.date ? ' 予定' : ''}
        </div>
        <div className="text-sm font-bold tracking-tight text-white mb-0.5">
          {live.artist}
        </div>
        <div className="text-sm font-bold tracking-tight text-white">
          {live.tourName}
        </div>
        <div className="text-[10px] text-gray-500 font-medium">
          {live.venue ? `@${live.venue}` : ''} {live.prefecture ? `(${live.prefecture})` : ''}
        </div>
      </div>
    </li>
  );
};
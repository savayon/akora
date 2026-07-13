import React, { useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

import { getAvatarColor } from '@/lib/avatarColor';

export const UserAvatar = ({ 
  name = '',
  uuid,
  avatarUrl,
  size = 'w-6 h-6', 
  iconSize = 'w-4 h-4', 
  containerClass = '',
  disableClick = false
}: { 
  name?: string;
  uuid?: string | null;
  avatarUrl?: string | null;
  size?: string; 
  iconSize?: string; 
  containerClass?: string;
  disableClick?: boolean;
}) => {
  const isDeleted = name === '(알 수 없음)' || uuid === null;
  const colorClass = isDeleted ? 'bg-white text-slate-300 border-slate-200' : getAvatarColor(uuid || name);
  const { openProfilePopover } = useAppStore();
  const avatarRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (disableClick || isDeleted || !uuid) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      openProfilePopover(uuid, rect);
    }
  };

  const cursorClass = (!disableClick && !isDeleted && uuid) ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all' : '';

  if (avatarUrl) {
    return (
      <div 
        ref={avatarRef}
        onClick={handleClick}
        data-user-avatar="true"
        className={`${size} rounded-full border overflow-hidden shrink-0 ${containerClass} ${isDeleted ? 'opacity-70 grayscale' : ''} ${cursorClass}`}
      >
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div 
      ref={avatarRef}
      onClick={handleClick}
      data-user-avatar="true"
      className={`${size} rounded-full ${colorClass} border flex items-center justify-center overflow-hidden shrink-0 ${containerClass} ${isDeleted ? 'opacity-70' : ''} ${cursorClass}`}
    >
      <svg className="w-full h-full opacity-90 mt-[5%]" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M12 15c-6 0-9 4-9 9h18c0-5-3-9-9-9z" />
      </svg>
    </div>
  );
};

export const UserBadge = ({ 
  name, 
  uuid,
  avatarUrl,
  size = 'w-6 h-6', 
  iconSize = 'w-4 h-4', 
  containerClass = '', 
  textClass = 'font-bold text-slate-700 text-sm' 
}: { 
  name: string; 
  uuid?: string | null;
  avatarUrl?: string | null;
  size?: string; 
  iconSize?: string; 
  containerClass?: string; 
  textClass?: string; 
}) => {
  const isDeleted = name === '(알 수 없음)' || uuid === null;
  const finalName = isDeleted ? '(알 수 없음)' : name;
  const finalTextClass = isDeleted ? 'font-medium text-slate-400 text-sm italic' : textClass;

  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${isDeleted ? 'opacity-80' : ''}`}>
      <UserAvatar name={finalName} uuid={uuid} avatarUrl={avatarUrl} size={size} iconSize={iconSize} containerClass={containerClass} />
      <span 
        className={`${finalTextClass} truncate cursor-pointer hover:underline`}
        onClick={(e) => {
          if (!uuid || isDeleted) return;
          e.preventDefault();
          e.stopPropagation();
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          useAppStore.getState().openProfilePopover(uuid, rect);
        }}
      >
        {finalName}
      </span>
    </div>
  );
};

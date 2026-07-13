import React from 'react';
import { UserAvatar } from './UserBadge';

export interface SummaryData {
  nickname: string;
  uuid?: string | null;
  avatarUrl?: string | null;
  side: 'proposer' | 'responder';
  points: string[];
}

export const SummaryCard = ({ summary }: { summary: SummaryData }) => {
  const isProposer = summary.side === 'proposer';
  const bgColor = isProposer ? 'bg-orange-50/50' : 'bg-blue-50/50';
  const borderColor = isProposer ? 'border-orange-100' : 'border-blue-100';
  const titleColor = isProposer ? 'text-orange-800' : 'text-blue-800';
  const textColor = isProposer ? 'text-orange-900' : 'text-blue-900';
  const numberColor = isProposer ? 'text-orange-500' : 'text-blue-400';
  const avatarBorder = isProposer ? 'border-orange-200' : 'border-blue-200';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-5`}>
      <h3 className={`font-black ${titleColor} mb-4 flex items-center gap-2 text-lg`}>
        <UserAvatar name={summary.nickname} uuid={summary.uuid} avatarUrl={summary.avatarUrl} size="w-6 h-6" iconSize="w-4 h-4" containerClass={`border ${avatarBorder}`} /> {summary.nickname}
      </h3>
      <ul className={`space-y-3 text-sm ${textColor} font-medium`}>
        {summary.points.map((point, index) => (
          <li key={index} className="flex gap-2">
            <span className={`font-black ${numberColor} shrink-0`}>{index + 1}.</span> {point}
          </li>
        ))}
      </ul>
    </div>
  );
};

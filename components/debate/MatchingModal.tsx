"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

export function MatchingModal({ isOpen, onClose, userId }: Props) {
  const [status, setStatus] = useState<'requesting' | 'waiting' | 'matched' | 'failed'>('requesting');
  const [debateId, setDebateId] = useState<string | null>(null);
  const router = useRouter();
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannel = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startMatching = async () => {
      try {
        setStatus('requesting');
        
        // 1. 매칭 요청 API 호출
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_match' })
        });
        
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.status === 'matched' && data.debateId) {
          setStatus('matched');
          setDebateId(data.debateId);
          setTimeout(() => {
            router.push(`/debate/live/${data.debateId}`);
          }, 1500);
          return;
        }

        if (data.status === 'waiting') {
          setStatus('waiting');
          setupRealtimeAndHeartbeat();
        } else {
          setStatus('failed');
        }

      } catch (err) {
        console.error(err);
        if (isMounted) setStatus('failed');
      }
    };

    const setupRealtimeAndHeartbeat = () => {
      const supabase = createClient();

      // Realtime 구독
      realtimeChannel.current = supabase.channel(`match_${userId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'matching_queue',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'matched' && payload.new.matched_debate_id) {
            setStatus('matched');
            setDebateId(payload.new.matched_debate_id);
            setTimeout(() => {
              router.push(`/debate/live/${payload.new.matched_debate_id}`);
            }, 1500);
          } else if (newStatus === 'failed' || newStatus === 'canceled' || newStatus === 'timeout') {
            setStatus('failed');
          }
        })
        .subscribe();

      // 하트비트 시작 (15초 간격)
      heartbeatInterval.current = setInterval(async () => {
        try {
          await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'heartbeat' })
          });
        } catch (e) {
          console.error('Heartbeat failed', e);
        }
      }, 15000);
    };

    startMatching();

    return () => {
      isMounted = false;
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
      }
    };
  }, [isOpen, userId, router]);

  const handleCancel = async () => {
    try {
      await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
    } catch(e) {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 animate-in fade-in zoom-in duration-300">
        
        {status === 'requesting' && (
          <>
            <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-black text-slate-900">매칭 서버 연결 중...</h2>
          </>
        )}

        {status === 'waiting' && (
          <>
            <div className="relative w-20 h-20 mb-6 flex justify-center items-center">
              <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-2 bg-yellow-400 rounded-full opacity-40 animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-4xl relative z-10">🔍</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">토론 상대를 찾고 있습니다</h2>
            <p className="text-slate-500 text-sm text-center mb-8">잠시만 기다려주세요...</p>
            <button 
              onClick={handleCancel}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors"
            >
              취소하기
            </button>
          </>
        )}

        {status === 'matched' && (
          <>
            <span className="text-5xl mb-4 animate-bounce">⚔️</span>
            <h2 className="text-2xl font-black text-yellow-600 mb-2">매칭 성공!</h2>
            <p className="text-slate-500 text-sm text-center">토론방으로 이동합니다...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <span className="text-5xl mb-4">⚠️</span>
            <h2 className="text-xl font-black text-red-600 mb-2">매칭 실패</h2>
            <p className="text-slate-500 text-sm text-center mb-8">오류가 발생했거나 취소되었습니다.</p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors"
            >
              닫기
            </button>
          </>
        )}

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export function useCountdown(targetDateStr: string, durationMs: number) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDateStr) return;

    const calculateTimeLeft = () => {
      const targetTime = new Date(targetDateStr).getTime();
      const expiresAt = targetTime + durationMs;
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('기한 만료');
        return;
      }

      setIsExpired(false);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
      } else {
        setTimeLeft(`${minutes}분 ${seconds}초`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr, durationMs]);

  return { timeLeft, isExpired };
}

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export const FloatingAdBanner = ({ side, imageUrl, type = 'follow' }: { side: 'left' | 'right', imageUrl: string, type?: 'follow' | 'static' }) => {
  const pathname = usePathname();
  const [offsetY, setOffsetY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetY = useRef(0);
  const currentY = useRef(0);
  const bannerHeight = 600;

  useEffect(() => {
    // 라우트(페이지)가 변경되면 애니메이션 상태를 즉시 초기화하여
    // 이전 페이지의 하단에서부터 배너가 날아오는 현상을 방지합니다.
    currentY.current = 0;
    targetY.current = 0;
    setOffsetY(0);
  }, [pathname]);

  useEffect(() => {
    if (type === 'static') return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      let desiredY = -parentRect.top + 128;
      const maxY = Math.max(0, parent.offsetHeight - bannerHeight);
      
      if (desiredY < 0) desiredY = 0;
      if (desiredY > maxY) desiredY = maxY;
      
      targetY.current = desiredY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let animationFrameId: number;
    const animate = () => {
      currentY.current += (targetY.current - currentY.current) * 0.1;
      
      if (Math.abs(targetY.current - currentY.current) > 0.5) {
        setOffsetY(currentY.current);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  return (
    <aside className={`hidden xl:block w-[160px] shrink-0 relative mt-32 ${side === 'left' ? 'mr-6' : 'ml-6'}`}>
      <div 
        ref={containerRef}
        className={`${type === 'static' ? 'relative' : 'absolute'} w-[160px] h-[600px] bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center overflow-hidden shadow-xl`}
        style={type === 'follow' ? { transform: `translateY(${offsetY}px)`, willChange: 'transform' } : undefined}
      >
        <img src={imageUrl} alt={`Ad ${side}`} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    </aside>
  );
};
